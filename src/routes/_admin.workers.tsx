import { createFileRoute } from "@tanstack/react-router";
import { Activity, BadgePercent, Search, UserCheck, Wrench, Pencil, Trash2, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HorizontalBarChart } from "@/components/admin/charts";
import { Column, DataTable } from "@/components/admin/DataTable";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdmin } from "@/lib/admin-store";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  relativeDays,
  adminService,
  type WorkerSummaryResponse,
  type Pagination,
} from "@/services/adminService";
import type { Worker } from "@/services/types";

export const Route = createFileRoute("/_admin/workers")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || undefined,
      highlight: (search.highlight as string) || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Workers — FuelPoint Admin" },
      {
        name: "description",
        content: "Manage pump workers, monitor scans, transactions handled and discount processed.",
      },
      { property: "og:title", content: "Workers — FuelPoint Admin" },
      {
        property: "og:description",
        content: "Worker performance: scans, customers scanned and discount processed.",
      },
    ],
  }),
  component: WorkersPage,
});

function WorkersPage() {
  const searchParams = Route.useSearch();
  const { workers, transactions, saveWorker, deleteWorker, getWorkers } = useAdmin();
  const [query, setQuery] = useState(searchParams.q || "");
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.q || "");
  const [status, setStatus] = useState("all");
  const [shift, setShift] = useState("all");
  const [sortConfig, setSortConfig] = useState<{ key: string; dir: "asc" | "desc" } | null>({
    key: "joinedAt",
    dir: "desc",
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [tableWorkers, setTableWorkers] = useState<Worker[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Create selected state holding ID rather than object so it automatically maps, just like Customers.
  // Wait, workers page uses `selected` holding the entire Worker object!
  // To handle highlight, let's look up the worker from tableWorkers or workers based on searchParams.highlight inside useEffect.
  const [selected, setSelected] = useState<Worker | null>(null);

  useEffect(() => {
    if (searchParams.highlight) {
      const match = tableWorkers.find(w => w.id === searchParams.highlight) || workers.find(w => w.id === searchParams.highlight);
      if (match) setSelected(match);
    }
  }, [searchParams.highlight, tableWorkers, workers]);
  
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [isSaving, setIsSaving] = useState(false);
  const [deletingWorker, setDeletingWorker] = useState<Worker | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [summaryData, setSummaryData] = useState<WorkerSummaryResponse | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const fetchSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const data = await adminService.getWorkerSummary();
      setSummaryData(data);
    } catch (err: any) {
      console.error("Failed to load worker summary", err);
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Debounce search query with 3 seconds delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 3000);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset page to 1 on filter or search change
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, status, shift]);

  // Fetch paginated workers from backend
  const fetchTableWorkers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminService.getWorkersPaginated({
        page,
        limit,
        search: debouncedQuery.trim() || undefined,
        status: status !== "all" ? status : undefined,
        shift: shift !== "all" ? shift : undefined,
        sortBy: sortConfig?.key || "joinedAt",
        sortOrder: sortConfig?.dir || "desc",
      });
      setTableWorkers(res.workers);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error("Failed to fetch workers:", err);
      toast.error(err.message || "Failed to load workers");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedQuery, status, shift, sortConfig]);

  useEffect(() => {
    fetchTableWorkers();
  }, [fetchTableWorkers]);

  const augmentedWorkers = useMemo(() => {
    return workers.map((w) => {
      const wTxns = transactions.filter((t) => t.workerId === w.id);
      const discount = wTxns.reduce((sum, t) => sum + (t.discountAmount || 0), 0);
      const customers = new Set(wTxns.map((t) => t.customerId)).size;
      
      let lastAct = w.lastActivity;
      if (wTxns.length > 0) {
        const sorted = [...wTxns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        lastAct = sorted[0].createdAt;
      }

      return {
        ...w,
        transactions: wTxns.length > 0 ? wTxns.length : w.transactions,
        discountProcessed: discount > 0 ? discount : w.discountProcessed,
        customersScanned: customers > 0 ? customers : w.customersScanned,
        lastActivity: lastAct,
      };
    });
  }, [workers, transactions]);

  const totals = useMemo(
    () => ({
      scans: augmentedWorkers.reduce((s, w) => s + (w.scans || 0), 0),
      discount: augmentedWorkers.reduce((s, w) => s + (w.discountProcessed || 0), 0),
      active: augmentedWorkers.filter((w) => w.status === "active").length,
    }),
    [augmentedWorkers],
  );

  const columns: Column<Worker>[] = [
    {
      key: "name",
      header: "Worker",
      sortValue: (w) => w.name,
      render: (w) => (
        <div className="flex items-center gap-3">
          <span className="gradient-brand flex size-9 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground">
            {w.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </span>
          <p className="font-medium text-foreground">{w.name}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (w) => w.status,
      render: (w) => <StatusBadge status={w.status} />,
    },
    {
      key: "shift",
      header: "Shift",
      sortValue: (w) => w.shift,
      render: (w) => <span className="text-sm">{w.shift}</span>,
    },
    {
      key: "scans",
      header: "Scans",
      align: "right",
      sortValue: (w) => w.scans,
      render: (w) => formatNumber(w.scans),
    },
    {
      key: "customers",
      header: "Customers",
      align: "right",
      sortValue: (w) => w.customersScanned,
      render: (w) => formatNumber(w.customersScanned),
    },
    {
      key: "transactions",
      header: "Transactions",
      align: "right",
      sortValue: (w) => w.transactions,
      render: (w) => formatNumber(w.transactions),
    },
    {
      key: "discount",
      header: "Discount processed",
      align: "right",
      sortValue: (w) => w.discountProcessed,
      render: (w) => (
        <span className="font-medium text-teal">{formatCurrency(w.discountProcessed)}</span>
      ),
    },
    {
      key: "last",
      header: "Last activity",
      align: "right",
      sortValue: (w) => w.lastActivity,
      render: (w) => (
        <span className="text-xs text-muted-foreground">{relativeDays(w.lastActivity)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (w) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => {
              setErrors({});
              setConfirmPassword("");
              setEditingWorker({ ...w, password: "" });
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeletingWorker(w)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const workerTxns = selected
    ? transactions.filter((t) => t.workerId === selected.id).slice(0, 8)
    : [];

  const validateForm = () => {
    if (!editingWorker) return false;
    const newErrors: Record<string, string> = {};
    
    if (!editingWorker.name.trim()) newErrors.name = "Full name is required.";
    
    if (!editingWorker.phone) {
      newErrors.phone = "Phone number is required.";
    } else if (editingWorker.phone.length !== 10) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
    }

    if (workers.some(w => w.phone === editingWorker.phone && w.id !== editingWorker.id)) {
      newErrors.phone = "Mobile number is already registered.";
    }

    if (editingWorker.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editingWorker.email.trim())) {
        newErrors.email = "Enter a valid email address.";
      }
    }

    if (editingWorker.password) {
      if (editingWorker.password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
        newErrors.password = "Passwords do not match.";
      }
    }

    if (!editingWorker.shift) newErrors.shift = "Shift is required.";
    if (!editingWorker.status) newErrors.status = "Status is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <>
      <PageHeader
        title="Workers"
        subtitle="Scanning activity and discount handling per worker."
        actions={
          <Button
            onClick={() => {
              setErrors({});
              setConfirmPassword("");
              setEditingWorker({
                id: "",
                name: "",
                email: "",
                phone: "",
                shift: "Morning",
                status: "active",
                joinedAt: new Date().toISOString(),
                scans: 0,
                customersScanned: 0,
                transactions: 0,
                discountProcessed: 0,
                lastActivity: new Date().toISOString(),
                password: "",
              });
            }}
          >
            <Plus className="size-4" /> New Worker
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total workers"
          value={formatNumber(summaryData ? summaryData.totalWorkers : augmentedWorkers.length)}
          icon={Wrench}
        />
        <StatCard
          label="Active workers"
          value={formatNumber(summaryData ? summaryData.activeWorkers : totals.active)}
          icon={UserCheck}
          tone="teal"
        />
        <StatCard
          label="Total scans"
          value={formatNumber(summaryData ? summaryData.totalScans : totals.scans)}
          icon={Activity}
          tone="navy"
        />
        <StatCard
          label="Discount processed"
          value={formatCurrency(summaryData ? summaryData.discountProcessed : totals.discount)}
          icon={BadgePercent}
          tone="teal"
        />
      </div>

      <Panel
        title="Worker directory"
        description="Search, filter and sort the team"
        className="mt-6"
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex min-w-56 flex-1 items-center gap-2 rounded-lg border border-border px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, ID or email"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={shift} onValueChange={setShift}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All shifts</SelectItem>
              <SelectItem value="Morning">Morning</SelectItem>
              <SelectItem value="Evening">Evening</SelectItem>
              <SelectItem value="Night">Night</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DataTable
          rows={tableWorkers}
          columns={columns}
          pageSize={limit}
          isLoading={isLoading}
          sortConfig={sortConfig}
          onSortChange={(key, dir) => setSortConfig({ key, dir })}
          serverPagination={{
            currentPage: pagination.page,
            totalPages: pagination.totalPages,
            pageSize: pagination.limit,
            totalItems: pagination.total,
            onPageChange: (newPage) => setPage(newPage),
            onPageSizeChange: (newLimit) => {
              setLimit(newLimit);
              setPage(1);
            },
          }}
          onRowClick={setSelected}
        />
      </Panel>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>
                  {selected.email} · {selected.id} · {selected.shift} shift · joined {formatDate(selected.joinedAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Scans", formatNumber(selected.scans)],
                  ["Customers", formatNumber(selected.customersScanned)],
                  ["Transactions", formatNumber(selected.transactions)],
                  ["Discount", formatCurrency(selected.discountProcessed)],
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
                  {workerTxns.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                    >
                      <span>
                        <span className="font-medium">{t.customerName}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDateTime(t.createdAt)} · {t.fuel}
                        </span>
                      </span>
                      <span className="text-right">
                        {formatCurrency(t.amount)}
                        <span className="block text-xs text-teal">
                          −{formatCurrency(t.discountAmount)}
                        </span>
                      </span>
                    </li>
                  ))}
                  {workerTxns.length === 0 && (
                    <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No transactions recorded.
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
                      setDeletingWorker(selected);
                      setSelected(null);
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setErrors({});
                      setConfirmPassword("");
                      setEditingWorker({ ...selected, password: "" });
                      setSelected(null);
                    }}
                  >
                    Edit
                  </Button>
                  <Button variant="default" onClick={() => setSelected(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingWorker} onOpenChange={(o) => !o && setEditingWorker(null)}>
        <DialogContent className="sm:max-w-md">
          {editingWorker && (
            <>
              <DialogHeader>
                <DialogTitle>{editingWorker.id ? "Edit Worker" : "Create Worker"}</DialogTitle>
                <DialogDescription>
                  Update basic info and shift assignment.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="w-name">Full name <span className="text-destructive">*</span></Label>
                    <Input
                      id="w-name"
                      placeholder="e.g. Ramesh Singh"
                      value={editingWorker.name}
                      onChange={(e) => {
                        setEditingWorker({ ...editingWorker, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: "" });
                      }}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="w-phone">Phone number <span className="text-destructive">*</span></Label>
                    <Input
                      id="w-phone"
                      placeholder="e.g. 9876543210"
                      value={editingWorker.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setEditingWorker({ ...editingWorker, phone: val });
                        if (errors.phone) setErrors({ ...errors, phone: "" });
                      }}
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="w-email">Email</Label>
                  <Input
                    id="w-email"
                    type="email"
                    placeholder="e.g. ramesh@fuelpoint.in"
                    value={editingWorker.email}
                    onChange={(e) => {
                      setEditingWorker({ ...editingWorker, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="w-password">
                      {editingWorker.id ? "New Password" : "Password"}
                    </Label>
                    <Input
                      id="w-password"
                      type="password"
                      placeholder={editingWorker.id ? "Leave blank to keep unchanged" : "Create password"}
                      value={editingWorker.password || ""}
                      onChange={(e) => {
                        setEditingWorker({ ...editingWorker, password: e.target.value });
                        if (errors.password) setErrors({ ...errors, password: "" });
                      }}
                      className={errors.password ? "border-destructive" : ""}
                    />
                    {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="w-confirm-password">
                      Confirm Password 
                    </Label>
                    <Input
                      id="w-confirm-password"
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
                    <Label>Shift <span className="text-destructive">*</span></Label>
                    <Select
                      value={editingWorker.shift}
                      onValueChange={(v: "Morning" | "Evening" | "Night") => {
                        setEditingWorker({ ...editingWorker, shift: v });
                        if (errors.shift) setErrors({ ...errors, shift: "" });
                      }}
                    >
                      <SelectTrigger className={errors.shift ? "border-destructive" : ""}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Morning">Morning</SelectItem>
                        <SelectItem value="Evening">Evening</SelectItem>
                        <SelectItem value="Night">Night</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.shift && <p className="mt-1 text-xs text-destructive">{errors.shift}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Status <span className="text-destructive">*</span></Label>
                    <Select
                      value={editingWorker.status}
                      onValueChange={(v: "active" | "offline" | "suspended") => {
                        setEditingWorker({ ...editingWorker, status: v });
                        if (errors.status) setErrors({ ...errors, status: "" });
                      }}
                    >
                      <SelectTrigger className={errors.status ? "border-destructive" : ""}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && <p className="mt-1 text-xs text-destructive">{errors.status}</p>}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => {
                  setEditingWorker(null);
                  setConfirmPassword("");
                  setErrors({});
                }}>
                  Cancel
                </Button>
                <Button
                  disabled={isSaving}
                  onClick={async () => {
                    if (!validateForm()) return;
                    
                    const workerToSave = { ...editingWorker };
                    setIsSaving(true);
                    try {
                      if (!workerToSave.id) {
                        delete (workerToSave as any).id;
                      } else if (!workerToSave.password) {
                        delete (workerToSave as any).password;
                      }
                      
                      await saveWorker(workerToSave);
                      await Promise.all([fetchTableWorkers(), fetchSummary()]);
                      if (getWorkers) getWorkers({ all: true }).catch(() => {});
                      toast.success(editingWorker.id ? "Worker updated successfully" : "Worker created successfully");
                      setEditingWorker(null);
                      setConfirmPassword("");
                      setErrors({});
                    } catch (err: any) {
                      toast.error(err.message || "Failed to save worker");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  {isSaving ? "Saving..." : editingWorker.id ? "Save changes" : "Create Worker"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingWorker} onOpenChange={(o) => !o && setDeletingWorker(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the worker profile for{" "}
              <span className="font-semibold text-foreground">{deletingWorker?.name}</span>.
              They will no longer be able to log in or process scans.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={async (e) => {
                e.preventDefault();
                if (deletingWorker) {
                  setIsDeleting(true);
                  try {
                    await deleteWorker(deletingWorker.id);
                    await Promise.all([fetchTableWorkers(), fetchSummary()]);
                    if (getWorkers) getWorkers({ all: true }).catch(() => {});
                    toast.success("Worker deleted successfully");
                    setDeletingWorker(null);
                  } catch (err: any) {
                    toast.error(err.message || "Failed to delete worker");
                  } finally {
                    setIsDeleting(false);
                  }
                }
              }}
            >
              {isDeleting ? "Deleting..." : "Delete worker"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
