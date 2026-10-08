import { createFileRoute } from "@tanstack/react-router";
import { Fuel, Search, UserPlus, Users, UserCheck, Pencil, Trash2, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Column, DataTable } from "@/components/admin/DataTable";
import { GroupPill, PageHeader, Panel, StatCard, StatusBadge } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdmin } from "@/lib/admin-store";
import {
  DEFAULT_GROUP_ID,
  adminService,
  buildOverview,
  exportCsv,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  relativeDays,
  type CustomerSummaryResponse,
  type Pagination,
} from "@/services/adminService";
import type { Customer } from "@/services/types";

export const Route = createFileRoute("/_admin/customers")({
  head: () => ({
    meta: [
      { title: "Customers — FuelPoint Admin" },
      {
        name: "description",
        content:
          "Manage registered customers, assign discount groups and review fuelling activity.",
      },
      { property: "og:title", content: "Customers — FuelPoint Admin" },
      {
        property: "og:description",
        content: "Customer registrations, group assignment and discount received.",
      },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { customers, groups, transactions, workers, saveCustomer, deleteCustomer, getCustomers } = useAdmin();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [tableCustomers, setTableCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [isSaving, setIsSaving] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [summaryData, setSummaryData] = useState<CustomerSummaryResponse | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const fetchSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const data = await adminService.getCustomerSummary();
      setSummaryData(data);
    } catch (err: any) {
      console.error("Failed to load customer summary", err);
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Debounce search query (3 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 3000);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset page to 1 on filter or search change
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, groupFilter, statusFilter]);

  // Fetch paginated customers from backend
  const fetchTableCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getCustomersPaginated({
        page,
        limit,
        search: debouncedQuery.trim() || undefined,
        groupId: groupFilter !== "all" ? groupFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setTableCustomers(res.customers);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error("Failed to fetch customers:", err);
      toast.error(err.message || "Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedQuery, groupFilter, statusFilter]);

  useEffect(() => {
    fetchTableCustomers();
  }, [fetchTableCustomers]);

  const overview = useMemo(
    () => buildOverview(customers, workers, groups, transactions),
    [customers, workers, groups, transactions],
  );
  
  const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? "Unassigned";
  const groupPercent = (id: string) => groups.find((g) => g.id === id)?.discountPercent ?? 0;

  const selected = (tableCustomers.find((c) => c.id === selectedId) || customers.find((c) => c.id === selectedId)) ?? null;
  const selectedTxns = selected && selected.transactionsList
    ? selected.transactionsList.slice(0, 8)
    : [];

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      sortValue: (c) => c.name,
      render: (c) => (
        <div>
          <p className="font-medium text-foreground">{c.name}</p>
          <p className="text-xs text-muted-foreground">{c.phone}</p>
        </div>
      ),
    },
    {
      key: "group",
      header: "Group",
      sortValue: (c) => groupName(c.groupId),
      render: (c) =>
        c.groupId === DEFAULT_GROUP_ID ? (
          <span className="inline-flex items-center rounded-full bg-warning/18 px-2.5 py-1 text-xs font-semibold text-warning">
            Unassigned
          </span>
        ) : (
          <GroupPill name={groupName(c.groupId)} percent={groupPercent(c.groupId)} />
        ),
    },
    {
      key: "registered",
      header: "Registered",
      sortValue: (c) => c.registeredAt,
      render: (c) => <span className="text-sm">{formatDate(c.registeredAt)}</span>,
    },
    { key: "status", header: "Status", sortValue: (c) => c.status, render: (c) => <StatusBadge status={c.status} /> },
    {
      key: "txns",
      header: "Transactions",
      align: "right",
      sortValue: (c) => c.transactions,
      render: (c) => formatNumber(c.transactions),
    },
    {
      key: "discount",
      header: "Discount received",
      align: "right",
      sortValue: (c) => c.discountReceived,
      render: (c) => <span className="font-medium text-teal">{formatCurrency(c.discountReceived)}</span>,
    },
    {
      key: "last",
      header: "Last activity",
      align: "right",
      sortValue: (c) => c.lastActivity ?? "",
      render: (c) => <span className="text-xs text-muted-foreground">{relativeDays(c.lastActivity)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => {
              setErrors({});
              setConfirmPassword("");
              setEditingCustomer({ ...c, password: "" });
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeletingCustomer(c)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const validateForm = () => {
    if (!editingCustomer) return false;
    const newErrors: Record<string, string> = {};
    
    if (!editingCustomer.name.trim()) newErrors.name = "Full name is required.";
    
    if (!editingCustomer.phone) {
      newErrors.phone = "Phone number is required.";
    } else if (editingCustomer.phone.length !== 10) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editingCustomer.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(editingCustomer.email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!editingCustomer.id) {
      if (!editingCustomer.password) {
        newErrors.password = "Password is required.";
      }
    }

    if (editingCustomer.password) {
      if (editingCustomer.password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
        newErrors.password = "Passwords do not match.";
      }
    }

    if (!editingCustomer.groupId) newErrors.groupId = "Group Assignment is required.";
    if (!editingCustomer.status) newErrors.status = "Status is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Registrations, group assignment and fuelling history."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const exportList = await adminService.getCustomers({
                    search: debouncedQuery.trim() || undefined,
                    groupId: groupFilter !== "all" ? groupFilter : undefined,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                    all: true,
                  });
                  exportCsv(
                    "customers.csv",
                    exportList.map((c) => ({
                      ID: c.id,
                      Name: c.name,
                      Phone: c.phone,
                      Group: groupName(c.groupId),
                      Registered: formatDate(c.registeredAt),
                      Transactions: c.transactions,
                      Discount: c.discountReceived,
                      Status: c.status,
                    })),
                  );
                } catch (err: any) {
                  toast.error("Failed to export customers");
                }
              }}
            >
              Export CSV
            </Button>
            <Button
              onClick={() => {
                setErrors({});
                setConfirmPassword("");
                setEditingCustomer({
                  id: "",
                  name: "",
                  phone: "",
                  email: "",
                  vehicle: "",
                  groupId: DEFAULT_GROUP_ID,
                  status: "active",
                  registeredAt: new Date().toISOString(),
                  lastActivity: null,
                  transactions: 0,
                  totalSpend: 0,
                  discountReceived: 0,
                  password: "",
                });
              }}
            >
              <Plus className="size-4" /> New Customer
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total customers"
          value={formatNumber(summaryData ? summaryData.totalCustomers : overview.totalCustomers)}
          icon={Users}
        />
        <StatCard
          label="New registrations"
          value={formatNumber(summaryData ? summaryData.newRegistrations7d : overview.newRegistrations7d)}
          icon={UserPlus}
          tone="warning"
          hint="last 7 days"
        />
        <StatCard
          label="Active customers"
          value={formatNumber(summaryData ? summaryData.activeCustomers : overview.activeCustomers)}
          icon={UserCheck}
          tone="teal"
        />
        <StatCard
          label="Used the pump"
          value={formatNumber(summaryData ? summaryData.usedPumpCustomers : overview.usedPumpCustomers)}
          icon={Fuel}
          tone="navy"
          hint="last 30 days"
        />
      </div>

      <Panel title="Customer directory" description="Search and filter the customer base" className="mt-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex min-w-56 flex-1 items-center gap-2 rounded-lg border border-border px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, phone or ID"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
              <SelectItem value={DEFAULT_GROUP_ID}>Unassigned</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DataTable
          rows={tableCustomers}
          columns={columns}
          pageSize={limit}
          isLoading={isLoading}
          serverPagination={{
            currentPage: pagination.page,
            totalPages: pagination.totalPages,
            pageSize: pagination.limit,
            totalItems: pagination.total,
            onPageChange: (p) => setPage(p),
            onPageSizeChange: (s) => {
              setLimit(s);
              setPage(1);
            },
          }}
          onRowClick={(c) => setSelectedId(c.id)}
        />
      </Panel>

      <Dialog open={!!selectedId} onOpenChange={(o) => !o && setSelectedId(null)}>
        <DialogContent className="sm:max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="gradient-brand flex size-12 shrink-0 items-center justify-center rounded-full font-bold text-primary-foreground">
                    {selected.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selected.name}</DialogTitle>
                    <DialogDescription>
                      {selected.phone} · {selected.email} · {selected.vehicle}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Group</p>
                  <div className="mt-1">
                    {selected.groupId === DEFAULT_GROUP_ID ? (
                      <span className="text-sm font-semibold text-warning">Unassigned</span>
                    ) : (
                      <GroupPill name={groupName(selected.groupId)} percent={groupPercent(selected.groupId)} />
                    )}
                  </div>
                </div>
                {[
                  ["Transactions", formatNumber(selected.transactions)],
                  ["Total spend", formatCurrency(selected.totalSpend)],
                  ["Discount", formatCurrency(selected.discountReceived)],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-lg border border-border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">{l}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{v}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-border">
                <p className="border-b border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
                  Recent activity
                </p>
                <ul className="scrollbar-thin max-h-64 divide-y divide-border overflow-y-auto">
                  {selectedTxns.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                    >
                      <span>
                        <span className="font-medium text-foreground">{(t as any).fuelType || (t as any).fuel}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDateTime(t.createdAt)} &middot; {t.litres}L &middot; {(t as any).worker?.fullName || (t as any).workerName}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="font-medium">{formatCurrency((t as any).finalAmount || t.amount)}</span>
                        <span className="block text-xs font-medium text-teal">
                          −{formatCurrency(t.discountAmount)}
                        </span>
                      </span>
                    </li>
                  ))}
                  {selectedTxns.length === 0 && (
                    <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                      This customer hasn't fuelled yet.
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex items-center justify-between gap-3">
                <StatusBadge status={selected.status} />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setDeletingCustomer(selected);
                      setSelectedId(null);
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setErrors({});
                      setConfirmPassword("");
                      setEditingCustomer({ ...selected, password: "" });
                      setSelectedId(null);
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="default" onClick={() => setSelectedId(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingCustomer} onOpenChange={(o) => !o && setEditingCustomer(null)}>
        <DialogContent className="sm:max-w-md">
          {editingCustomer && (
            <>
              <DialogHeader>
                <DialogTitle>{editingCustomer.id ? "Edit Customer" : "Create Customer"}</DialogTitle>
                <DialogDescription>Update basic info and group assignment.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="c-name">Full name <span className="text-destructive">*</span></Label>
                    <Input
                      id="c-name"
                      placeholder="e.g. Ramesh Singh"
                      value={editingCustomer.name}
                      onChange={(e) => {
                        setEditingCustomer({ ...editingCustomer, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: "" });
                      }}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-phone">Phone number <span className="text-destructive">*</span></Label>
                    <Input
                      id="c-phone"
                      placeholder="e.g. 9876543210"
                      value={editingCustomer.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setEditingCustomer({ ...editingCustomer, phone: val });
                        if (errors.phone) setErrors({ ...errors, phone: "" });
                      }}
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="c-email">Email <span className="text-destructive">*</span></Label>
                    <Input
                      id="c-email"
                      type="email"
                      placeholder="e.g. ramesh@gmail.com"
                      value={editingCustomer.email}
                      onChange={(e) => {
                        setEditingCustomer({ ...editingCustomer, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: "" });
                      }}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-vehicle">Vehicle</Label>
                    <Input
                      id="c-vehicle"
                      placeholder="e.g. GJ01AB1234"
                      value={editingCustomer.vehicle}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, vehicle: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="c-password">
                      {editingCustomer.id ? "New Password" : "Password"}
                      {!editingCustomer.id && <span className="text-destructive"> *</span>}
                    </Label>
                    <Input
                      id="c-password"
                      type="password"
                      placeholder={editingCustomer.id ? "Leave blank to keep unchanged" : "Create password"}
                      value={editingCustomer.password || ""}
                      onChange={(e) => {
                        setEditingCustomer({ ...editingCustomer, password: e.target.value });
                        if (errors.password) setErrors({ ...errors, password: "" });
                      }}
                      className={errors.password ? "border-destructive" : ""}
                    />
                    {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-confirm-password">
                      Confirm Password 
                      {(!editingCustomer.id || editingCustomer.password) && <span className="text-destructive"> *</span>}
                    </Label>
                    <Input
                      id="c-confirm-password"
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                      }}
                      className={errors.confirmPassword ? "border-destructive" : ""}
                    />
                    {errors.confirmPassword && <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Group Assignment <span className="text-destructive">*</span></Label>
                    <Select
                      value={editingCustomer.groupId}
                      onValueChange={(v) => {
                        setEditingCustomer({ ...editingCustomer, groupId: v });
                        if (errors.groupId) setErrors({ ...errors, groupId: "" });
                      }}
                    >
                      <SelectTrigger className={errors.groupId ? "border-destructive" : ""}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name}
                          </SelectItem>
                        ))}
                        <SelectItem value={DEFAULT_GROUP_ID}>Unassigned</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.groupId && <p className="mt-1 text-xs text-destructive">{errors.groupId}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Status <span className="text-destructive">*</span></Label>
                    <Select
                      value={editingCustomer.status}
                      onValueChange={(v: "active" | "inactive" | "pending" | "offline" | "suspended") => {
                        setEditingCustomer({ ...editingCustomer, status: v });
                        if (errors.status) setErrors({ ...errors, status: "" });
                      }}
                    >
                      <SelectTrigger className={errors.status ? "border-destructive" : ""}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && <p className="mt-1 text-xs text-destructive">{errors.status}</p>}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => {
                  setEditingCustomer(null);
                  setConfirmPassword("");
                  setErrors({});
                }}>
                  Cancel
                </Button>
                <Button
                  disabled={isSaving}
                  onClick={async () => {
                    if (!validateForm()) return;
                    
                    const customerToSave = { ...editingCustomer };
                    setIsSaving(true);
                    try {
                      if (!customerToSave.id) {
                        delete (customerToSave as any).id;
                      } else if (!customerToSave.password) {
                        delete (customerToSave as any).password;
                      }
                      
                      await saveCustomer(customerToSave);
                      toast.success(editingCustomer.id ? "Customer updated successfully" : "Customer created successfully");
                      setEditingCustomer(null);
                      setConfirmPassword("");
                      setErrors({});
                      if (getCustomers) await getCustomers({ all: true });
                      await Promise.all([fetchTableCustomers(), fetchSummary()]);
                    } catch (err: any) {
                      toast.error(err.message || "Failed to save customer");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  {isSaving ? "Saving..." : editingCustomer.id ? "Save changes" : "Create Customer"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCustomer} onOpenChange={(o) => !o && setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will safely remove the customer profile for{" "}
              <span className="font-semibold text-foreground">{deletingCustomer?.name}</span>.
              They will no longer be able to log in, but historical transactions remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={async (e) => {
                e.preventDefault();
                if (deletingCustomer) {
                  setIsDeleting(true);
                  try {
                    await deleteCustomer(deletingCustomer.id);
                    toast.success("Customer deleted successfully");
                    setDeletingCustomer(null);
                    if (getCustomers) await getCustomers({ all: true });
                    await Promise.all([fetchTableCustomers(), fetchSummary()]);
                  } catch (err: any) {
                    toast.error(err.message || "Failed to delete customer");
                  } finally {
                    setIsDeleting(false);
                  }
                }
              }}
            >
              {isDeleting ? "Deleting..." : "Delete customer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
