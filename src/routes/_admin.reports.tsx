import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/admin/DataTable";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  adminService,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  rangeBounds,
  type Pagination,
  type RangeKey,
  type ReportSummaryResponse,
} from "@/services/adminService";

export const Route = createFileRoute("/_admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — FuelPoint Admin" },
      {
        name: "description",
        content:
          "Customer, worker, transaction, discount and group reports with date ranges and CSV export.",
      },
      { property: "og:title", content: "Reports — FuelPoint Admin" },
      {
        property: "og:description",
        content: "Date-ranged petrol pump reports with summary metrics and CSV export.",
      },
    ],
  }),
  component: ReportsPage,
});

const rangeOptions: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "quarter", label: "90 days" },
  { key: "custom", label: "Custom" },
];

const categories = [
  { key: "transactions", label: "Transactions" },
  { key: "discount", label: "Discount" },
  { key: "customers", label: "Customers" },
  { key: "workers", label: "Workers" },
  { key: "groups", label: "Groups" },
] as const;

type Category = (typeof categories)[number]["key"];

function ReportsPage() {
  const [range, setRange] = useState<RangeKey>("month");
  const [from, setFrom] = useState("2026-09-01");
  const [to, setTo] = useState("2026-10-07");
  const [category, setCategory] = useState<Category>("transactions");

  // Server-side pagination & table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [summaryData, setSummaryData] = useState<ReportSummaryResponse | null>(null);
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const bounds = useMemo(() => rangeBounds(range, from, to), [range, from, to]);

  // Reset page when category or range changes
  useEffect(() => {
    setPage(1);
  }, [category, range, from, to]);

  // 1. Fetch Summary for Top Cards
  const fetchSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const data = await adminService.getReportSummary({
        startDate: bounds.start.toISOString(),
        endDate: bounds.end.toISOString(),
      });
      setSummaryData(data);
    } catch (err: any) {
      console.error("Failed to load report summary", err);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [bounds]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // 2. Fetch Server-side Paginated Data for Table
  const fetchTableData = useCallback(async () => {
    setIsLoadingTable(true);
    try {
      const res = await adminService.getReportData({
        category,
        startDate: bounds.start.toISOString(),
        endDate: bounds.end.toISOString(),
        page,
        limit: pageSize,
      });
      setTableRows(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      console.error("Failed to load report data", err);
      toast.error(err.message || "Failed to load report data");
    } finally {
      setIsLoadingTable(false);
    }
  }, [category, bounds, page, pageSize]);

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  // 3. Stat Cards values populated from API (exactly 4 cards per category)
  const summary: [string, string][] = useMemo(() => {
    const t = summaryData?.transactions;
    const d = summaryData?.discount;
    const c = summaryData?.customers;
    const w = summaryData?.workers;
    const g = summaryData?.groups;

    const cardsMap: Record<Category, [string, string][]> = {
      transactions: [
        ["Transactions", summaryData ? formatNumber(t?.transactions) : "—"],
        ["Revenue", summaryData ? formatCurrency(t?.revenue) : "—"],
        ["Litres dispensed", summaryData ? formatNumber(t?.litresDispensed) : "—"],
        ["Avg ticket", summaryData ? formatCurrency(t?.avgTicket) : "—"],
      ],
      discount: [
        ["Discount given", summaryData ? formatCurrency(d?.discountGiven) : "—"],
        ["Effective rate", summaryData ? `${d?.effectiveRate ?? 0}%` : "—"],
        ["Discounted scans", summaryData ? formatNumber(d?.discountedScans) : "—"],
        ["Avg discount/scan", summaryData ? formatCurrency(d?.avgDiscountPerScan) : "—"],
      ],
      customers: [
        ["New registrations", summaryData ? formatNumber(c?.newRegistrations) : "—"],
        ["Total customers", summaryData ? formatNumber(c?.totalCustomers) : "—"],
        ["Active", summaryData ? formatNumber(c?.active) : "—"],
        ["Unassigned", summaryData ? formatNumber(c?.unassigned) : "—"],
      ],
      workers: [
        ["Workers", summaryData ? formatNumber(w?.workers) : "—"],
        ["Active", summaryData ? formatNumber(w?.active) : "—"],
        ["Scans in range", summaryData ? formatNumber(w?.scansInRange) : "—"],
        ["Discount processed", summaryData ? formatCurrency(w?.discountProcessed) : "—"],
      ],
      groups: [
        ["Groups", summaryData ? formatNumber(g?.groups) : "—"],
        ["Active groups", summaryData ? formatNumber(g?.activeGroups) : "—"],
        ["Group discount", summaryData ? formatCurrency(g?.groupDiscount) : "—"],
        ["Grouped customers", summaryData ? formatNumber(g?.groupedCustomers) : "—"],
      ],
    };

    return cardsMap[category];
  }, [summaryData, category]);

  // 4. Server-Side Export CSV & Excel via Backend API
  const handleExport = async (kind: "csv" | "excel") => {
    setIsExporting(true);
    try {
      await adminService.exportReport({
        category,
        startDate: bounds.start.toISOString(),
        endDate: bounds.end.toISOString(),
        format: kind,
      });
      toast.success(`${kind === "csv" ? "CSV" : "Excel"} report downloaded`, {
        description: `${formatDate(bounds.start.toISOString())} → ${formatDate(bounds.end.toISOString())}`,
      });
    } catch (err: any) {
      console.error(`Export ${kind} failed:`, err);
      toast.error(err.message || `Failed to export ${kind} report`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Date-ranged reporting across customers, workers, scans, discounts and groups."
      />

      <Tabs value={category} onValueChange={(v) => setCategory(v as Category)}>
        <TabsList>
          {categories.map((c) => (
            <TabsTrigger key={c.key} value={c.key}>
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map(([l, v], idx) => (
          <StatCard key={`${category}-${l}-${idx}`} label={l} value={v} />
        ))}
      </div>

      <Panel
        title={`${categories.find((c) => c.key === category)!.label} report`}
        description="Tabular detail for the selected range"
        className="mt-6"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isExporting}
              onClick={() => handleExport("csv")}
            >
              {isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Export CSV
            </Button>
            <Button
              size="sm"
              disabled={isExporting}
              onClick={() => handleExport("excel")}
            >
              {isExporting ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
              Export Excel
            </Button>
          </div>
        }
      >
        <div className="mb-6 flex flex-wrap items-end gap-3 border-b border-border/40 pb-5">
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1">
            {rangeOptions.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={
                  range === r.key
                    ? "rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm"
                    : "rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                }
              >
                {r.label}
              </button>
            ))}
          </div>
          {range === "custom" && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="from" className="text-xs">
                  From
                </Label>
                <Input
                  id="from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="to" className="text-xs">
                  To
                </Label>
                <Input
                  id="to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
          )}
          <p className="ml-auto text-xs text-muted-foreground">
            {formatDate(bounds.start.toISOString())} → {formatDate(bounds.end.toISOString())} ·{" "}
            {formatNumber(
              category === "customers"
                ? (summaryData?.registrationsInRange ?? pagination.total)
                : (summaryData?.scansInRange ?? pagination.total)
            )}{" "}
            {category === "customers" ? "registrations" : "scans"} in range
          </p>
        </div>

        <div className="mt-4">
          {category === "workers" && (
            <DataTable
              rows={tableRows}
              pageSize={pageSize}
              serverPagination={{
                currentPage: pagination.page,
                totalPages: pagination.totalPages,
                pageSize: pagination.limit,
                totalItems: pagination.total,
                onPageChange: (p) => setPage(p),
                onPageSizeChange: (s) => {
                  setPageSize(s);
                  setPage(1);
                },
              }}
              isLoading={isLoadingTable}
              emptyMessage="No workers found."
              columns={[
                { key: "name", header: "Worker", sortValue: (w) => w.name, render: (w) => <span className="font-medium">{w.name}</span> },
                { key: "status", header: "Status", sortValue: (w) => w.status, render: (w) => <StatusBadge status={w.status} /> },
                { key: "scans", header: "Scans", sortValue: (w) => w.scans, render: (w) => formatNumber(w.scans) },
                { key: "transactions", header: "Transactions", sortValue: (w) => w.transactions, render: (w) => formatNumber(w.transactions) },
                { key: "discount", header: "Discount processed", sortValue: (w) => w.discountProcessed, render: (w) => <span className="font-medium text-teal">{formatCurrency(w.discountProcessed)}</span> },
                { key: "lastActivity", header: "Last activity", sortValue: (w) => w.lastActivity, render: (w) => <span className="text-muted-foreground">{formatDate(w.lastActivity)}</span> },
              ]}
            />
          )}

          {category === "groups" && (
            <DataTable
              rows={tableRows}
              pageSize={pageSize}
              serverPagination={{
                currentPage: pagination.page,
                totalPages: pagination.totalPages,
                pageSize: pagination.limit,
                totalItems: pagination.total,
                onPageChange: (p) => setPage(p),
                onPageSizeChange: (s) => {
                  setPageSize(s);
                  setPage(1);
                },
              }}
              isLoading={isLoadingTable}
              emptyMessage="No groups found."
              columns={[
                { key: "name", header: "Group", sortValue: (g) => g.name, render: (g) => <span className="font-medium">{g.name}</span> },
                { key: "discount", header: "Discount %", sortValue: (g) => g.discountPercent, render: (g) => `${g.discountPercent}%` },
                { key: "customers", header: "Customers", sortValue: (g) => g.customers, render: (g) => formatNumber(g.customers) },
                { key: "transactions", header: "Transactions", sortValue: (g) => g.transactions, render: (g) => formatNumber(g.transactions) },
                { key: "discountGenerated", header: "Discount generated", sortValue: (g) => g.discountGenerated, render: (g) => <span className="font-medium text-teal">{formatCurrency(g.discountGenerated)}</span> },
              ]}
            />
          )}

          {category === "customers" && (
            <DataTable
              rows={tableRows}
              pageSize={pageSize}
              serverPagination={{
                currentPage: pagination.page,
                totalPages: pagination.totalPages,
                pageSize: pagination.limit,
                totalItems: pagination.total,
                onPageChange: (p) => setPage(p),
                onPageSizeChange: (s) => {
                  setPageSize(s);
                  setPage(1);
                },
              }}
              isLoading={isLoadingTable}
              emptyMessage="No registrations in this range."
              columns={[
                { key: "name", header: "Customer", sortValue: (c) => c.name, render: (c) => <span className="font-medium">{c.name}</span> },
                { key: "registered", header: "Registered", sortValue: (c) => c.registeredAt, render: (c) => <span className="text-muted-foreground">{formatDate(c.registeredAt)}</span> },
                { key: "group", header: "Group", sortValue: (c) => c.groupName ?? "", render: (c) => c.groupName },
                { key: "transactions", header: "Transactions", sortValue: (c) => c.transactions, render: (c) => formatNumber(c.transactions) },
                { key: "discount", header: "Discount received", sortValue: (c) => c.discountReceived, render: (c) => <span className="font-medium text-teal">{formatCurrency(c.discountReceived)}</span> },
                { key: "status", header: "Status", sortValue: (c) => c.status, render: (c) => <StatusBadge status={c.status} /> },
              ]}
            />
          )}

          {(category === "transactions" || category === "discount") && (
            <DataTable
              rows={tableRows}
              pageSize={pageSize}
              serverPagination={{
                currentPage: pagination.page,
                totalPages: pagination.totalPages,
                pageSize: pagination.limit,
                totalItems: pagination.total,
                onPageChange: (p) => setPage(p),
                onPageSizeChange: (s) => {
                  setPageSize(s);
                  setPage(1);
                },
              }}
              isLoading={isLoadingTable}
              emptyMessage="No transactions in this range."
              columns={[
                { key: "id", header: "Txn", sortValue: (t) => t.id, render: (t) => <span className="font-mono text-xs text-muted-foreground">{t.id}</span> },
                { key: "date", header: "Date", sortValue: (t) => t.createdAt, render: (t) => <span className="text-muted-foreground">{formatDateTime(t.createdAt)}</span> },
                { key: "customer", header: "Customer", sortValue: (t) => t.customerName, render: (t) => <span className="font-medium">{t.customerName}</span> },
                { key: "worker", header: "Worker", sortValue: (t) => t.workerName, render: (t) => t.workerName },
                { key: "amount", header: "Amount", sortValue: (t) => t.amount, render: (t) => <span className="font-medium">{formatCurrency(t.amount)}</span> },
                { key: "discount", header: "Discount", sortValue: (t) => t.discountAmount, render: (t) => <span className="font-medium text-teal">-{formatCurrency(t.discountAmount)} ({t.discountPercent}%)</span> },
              ]}
            />
          )}
        </div>
      </Panel>
    </>
  );
}
