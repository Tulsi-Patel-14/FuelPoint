import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TablePagination } from "@/components/admin/DataTable";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdmin } from "@/lib/admin-store";
import {
  buildSeries,
  exportCsv,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  groupDistribution,
  inRange,
  rangeBounds,
  DEFAULT_GROUP_ID,
  type RangeKey,
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
  const { customers, workers, groups, transactions } = useAdmin();
  const [range, setRange] = useState<RangeKey>("month");
  const [from, setFrom] = useState("2026-09-01");
  const [to, setTo] = useState("2026-09-23");
  const [category, setCategory] = useState<Category>("transactions");
  const [customersPage, setCustomersPage] = useState(1);
  const [customersPageSize, setCustomersPageSize] = useState(10);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsPageSize, setTransactionsPageSize] = useState(10);

  useEffect(() => {
    setCustomersPage(1);
  }, [range, from, to, customersPageSize]);

  useEffect(() => {
    setTransactionsPage(1);
  }, [range, from, to, transactionsPageSize]);

  const bounds = useMemo(() => rangeBounds(range, from, to), [range, from, to]);
  const txns = useMemo(
    () => transactions.filter((t) => inRange(t.createdAt, bounds)),
    [transactions, bounds],
  );
  const regs = useMemo(
    () => customers.filter((c) => inRange(c.registeredAt, bounds)),
    [customers, bounds],
  );
  const days = Math.max(
    1,
    Math.round((bounds.end.getTime() - bounds.start.getTime()) / 86400000) + 1,
  );
  const series = useMemo(
    () => buildSeries(customers, txns, Math.min(days, 90)),
    [customers, txns, days],
  );
  const dist = useMemo(() => groupDistribution(customers, groups, txns), [customers, groups, txns]);

  const totalTxnPages = Math.max(1, Math.ceil(txns.length / transactionsPageSize));
  const safeTxnPage = Math.min(transactionsPage, totalTxnPages);
  const pagedTxns = useMemo(
    () => txns.slice((safeTxnPage - 1) * transactionsPageSize, safeTxnPage * transactionsPageSize),
    [txns, safeTxnPage, transactionsPageSize],
  );

  const totalRegPages = Math.max(1, Math.ceil(regs.length / customersPageSize));
  const safeRegPage = Math.min(customersPage, totalRegPages);
  const pagedRegs = useMemo(
    () => regs.slice((safeRegPage - 1) * customersPageSize, safeRegPage * customersPageSize),
    [regs, safeRegPage, customersPageSize],
  );

  const discountTotal = txns.reduce((s, t) => s + t.discountAmount, 0);
  const revenueTotal = txns.reduce((s, t) => s + t.amount, 0);
  const litresTotal = Math.round(txns.reduce((s, t) => s + t.litres, 0));

  const summary: [string, string][] = {
    transactions: [
      ["Transactions", formatNumber(txns.length)],
      ["Revenue", formatCurrency(revenueTotal)],
      ["Litres dispensed", formatNumber(litresTotal)],
      ["Avg ticket", formatCurrency(txns.length ? revenueTotal / txns.length : 0)],
    ],
    discount: [
      ["Discount given", formatCurrency(discountTotal)],
      [
        "Effective rate",
        `${revenueTotal ? ((discountTotal / revenueTotal) * 100).toFixed(2) : "0"}%`,
      ],
      ["Discounted scans", formatNumber(txns.filter((t) => t.discountAmount > 0).length)],
      ["Avg discount/scan", formatCurrency(txns.length ? discountTotal / txns.length : 0)],
    ],
    customers: [
      ["New registrations", formatNumber(regs.length)],
      ["Total customers", formatNumber(customers.length)],
      ["Active", formatNumber(customers.filter((c) => c.status === "active").length)],
      ["Unassigned", formatNumber(customers.filter((c) => c.groupId === DEFAULT_GROUP_ID).length)],
    ],
    workers: [
      ["Workers", formatNumber(workers.length)],
      ["Active", formatNumber(workers.filter((w) => w.status === "active").length)],
      ["Scans in range", formatNumber(txns.length)],
      ["Discount processed", formatCurrency(discountTotal)],
    ],
    groups: [
      ["Groups", formatNumber(groups.length)],
      ["Active groups", formatNumber(groups.filter((g) => g.active).length)],
      ["Group discount", formatCurrency(discountTotal)],
      [
        "Grouped customers",
        formatNumber(customers.filter((c) => c.groupId !== DEFAULT_GROUP_ID).length),
      ],
    ],
  }[category] as [string, string][];

  const exportRows = () => {
    if (category === "customers")
      return regs.map((c) => ({
        ID: c.id,
        Name: c.name,
        Phone: c.phone,
        Group: groups.find((g) => g.id === c.groupId)?.name ?? "",
        Registered: formatDate(c.registeredAt),
        Transactions: c.transactions,
        Discount: c.discountReceived,
      }));
    if (category === "workers")
      return workers.map((w) => ({
        ID: w.id,
        Name: w.name,
        Status: w.status,
        Scans: w.scans,
        Transactions: w.transactions,
        DiscountProcessed: w.discountProcessed,
        LastActivity: formatDate(w.lastActivity),
      }));
    if (category === "groups")
      return dist.map((g) => ({
        Group: g.name,
        DiscountPercent: g.discountPercent,
        Customers: g.customers,
        Transactions: g.transactions,
        DiscountGenerated: g.discountGenerated,
      }));
    return txns.map((t) => ({
      ID: t.id,
      Date: formatDateTime(t.createdAt),
      Customer: t.customerName,
      Worker: t.workerName,
      Fuel: t.fuel,
      Litres: t.litres,
      Amount: t.amount,
      DiscountPercent: t.discountPercent,
      Discount: t.discountAmount,
    }));
  };

  const handleExport = (kind: "csv" | "excel") => {
    const rows = exportRows();
    if (!rows.length) {
      toast.error("Nothing to export for this range.");
      return;
    }
    exportCsv(`${category}-report.${kind === "csv" ? "csv" : "xls.csv"}`, rows);
    toast.success(`${kind === "csv" ? "CSV" : "Excel-ready"} report exported`, {
      description: `${rows.length} rows · ${formatDate(bounds.start.toISOString())} → ${formatDate(bounds.end.toISOString())}`,
    });
  };

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Date-ranged reporting across customers, workers, scans, discounts and groups."
        actions={
          <>
            <Button variant="outline" onClick={() => handleExport("csv")}>
              <Download className="size-4" /> Export CSV
            </Button>
            <Button onClick={() => handleExport("excel")}>
              <FileSpreadsheet className="size-4" /> Export Excel
            </Button>
          </>
        }
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

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map(([l, v]) => (
          <div key={l} className="surface-card p-4">
            <p className="text-xs text-muted-foreground">{l}</p>
            <p className="mt-1 text-xl font-bold text-foreground">{v}</p>
          </div>
        ))}
      </div>

      <div className="surface-card mt-6 flex flex-wrap items-end gap-3 p-4">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border p-1">
          {rangeOptions.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={
                range === r.key
                  ? "rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
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
          {formatNumber(txns.length)} scans in range
        </p>
      </div>

      <Panel
        title={`${categories.find((c) => c.key === category)!.label} report`}
        description="Tabular detail for the selected range"
        className="mt-4"
      >
        <div className="overflow-x-auto">
          {category === "workers" && (
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  {[
                    "Worker",
                    "Status",
                    "Scans",
                    "Transactions",
                    "Discount processed",
                    "Last activity",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w.id} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-3 font-medium">{w.name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={w.status} />
                    </td>
                    <td className="px-4 py-3">{formatNumber(w.scans)}</td>
                    <td className="px-4 py-3">{formatNumber(w.transactions)}</td>
                    <td className="px-4 py-3 text-teal">{formatCurrency(w.discountProcessed)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(w.lastActivity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {category === "groups" && (
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  {["Group", "Discount %", "Customers", "Transactions", "Discount generated"].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {dist.map((g) => (
                  <tr key={g.id} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-3 font-medium">{g.name}</td>
                    <td className="px-4 py-3">{g.discountPercent}%</td>
                    <td className="px-4 py-3">{formatNumber(g.customers)}</td>
                    <td className="px-4 py-3">{formatNumber(g.transactions)}</td>
                    <td className="px-4 py-3 text-teal">{formatCurrency(g.discountGenerated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {category === "customers" && (
            <div>
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    {[
                      "Customer",
                      "Registered",
                      "Group",
                      "Transactions",
                      "Discount received",
                      "Status",
                    ].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedRegs.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-border/70 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{c.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(c.registeredAt)}
                      </td>
                      <td className="px-4 py-3">{groups.find((g) => g.id === c.groupId)?.name}</td>
                      <td className="px-4 py-3">{formatNumber(c.transactions)}</td>
                      <td className="px-4 py-3 font-medium text-teal">
                        {formatCurrency(c.discountReceived)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                    </tr>
                  ))}
                  {pagedRegs.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                      >
                        No registrations in this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <TablePagination
                currentPage={safeRegPage}
                totalPages={totalRegPages}
                pageSize={customersPageSize}
                totalItems={regs.length}
                currentCount={pagedRegs.length}
                onPageChange={setCustomersPage}
                onPageSizeChange={setCustomersPageSize}
              />
            </div>
          )}

          {(category === "transactions" || category === "discount") && (
            <div>
              <table className="w-full min-w-[820px] text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    {["Txn", "Date", "Customer", "Worker", "Fuel", "Amount", "Discount"].map(
                      (h) => (
                        <th key={h} className="px-4 py-3 text-left font-semibold">
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pagedTxns.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-border/70 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.id}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(t.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{t.customerName}</td>
                      <td className="px-4 py-3 text-foreground">{t.workerName}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.fuel} · {t.litres} L
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="px-4 py-3 font-medium text-teal">
                        −{formatCurrency(t.discountAmount)} ({t.discountPercent}%)
                      </td>
                    </tr>
                  ))}
                  {pagedTxns.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-sm text-muted-foreground"
                      >
                        No transactions in this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <TablePagination
                currentPage={safeTxnPage}
                totalPages={totalTxnPages}
                pageSize={transactionsPageSize}
                totalItems={txns.length}
                currentCount={pagedTxns.length}
                onPageChange={setTransactionsPage}
                onPageSizeChange={setTransactionsPageSize}
              />
            </div>
          )}
        </div>
      </Panel>
    </>
  );
}
