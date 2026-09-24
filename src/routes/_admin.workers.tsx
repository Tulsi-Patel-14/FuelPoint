import { createFileRoute } from "@tanstack/react-router";
import { Activity, BadgePercent, Search, UserCheck, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { HorizontalBarChart } from "@/components/admin/charts";
import { Column, DataTable } from "@/components/admin/DataTable";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
} from "@/services/adminService";
import type { Worker } from "@/services/types";

export const Route = createFileRoute("/_admin/workers")({
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
  const { workers, transactions } = useAdmin();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [shift, setShift] = useState("all");
  const [selected, setSelected] = useState<Worker | null>(null);

  const filtered = useMemo(
    () =>
      workers.filter(
        (w) =>
          (status === "all" || w.status === status) &&
          (shift === "all" || w.shift === shift) &&
          (w.name.toLowerCase().includes(query.toLowerCase()) ||
            w.id.toLowerCase().includes(query.toLowerCase()) ||
            w.email.toLowerCase().includes(query.toLowerCase())),
      ),
    [workers, query, status, shift],
  );

  const totals = useMemo(
    () => ({
      scans: workers.reduce((s, w) => s + w.scans, 0),
      discount: workers.reduce((s, w) => s + w.discountProcessed, 0),
      active: workers.filter((w) => w.status === "active").length,
    }),
    [workers],
  );

  const scansData = useMemo(
    () =>
      [...workers].sort((a, b) => b.scans - a.scans).map((w) => ({ name: w.name, scans: w.scans })),
    [workers],
  );

  const discountData = useMemo(
    () =>
      [...workers]
        .sort((a, b) => b.discountProcessed - a.discountProcessed)
        .map((w) => ({ name: w.name, discount: w.discountProcessed })),
    [workers],
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
          <div>
            <p className="font-medium text-foreground">{w.name}</p>
            <p className="text-xs text-muted-foreground">
              {w.id} · {w.shift} shift
            </p>
          </div>
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
  ];

  const workerTxns = selected
    ? transactions.filter((t) => t.workerId === selected.id).slice(0, 8)
    : [];

  return (
    <>
      <PageHeader title="Workers" subtitle="Scanning activity and discount handling per worker." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total workers" value={formatNumber(workers.length)} icon={Wrench} />
        <StatCard
          label="Active workers"
          value={formatNumber(totals.active)}
          icon={UserCheck}
          tone="teal"
        />
        <StatCard
          label="Total scans"
          value={formatNumber(totals.scans)}
          icon={Activity}
          tone="navy"
        />
        <StatCard
          label="Discount processed"
          value={formatCurrency(totals.discount)}
          icon={BadgePercent}
          tone="teal"
        />
      </div>

      {/* Full-width Worker Directory */}
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
              <SelectItem value="offline">Offline</SelectItem>
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
        <DataTable rows={filtered} columns={columns} pageSize={8} onRowClick={setSelected} />
      </Panel>

      {/* Worker Performance Analytics */}
      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Worker performance
          </h2>
          <p className="text-xs text-muted-foreground">
            Comparative breakdown of scans handled and discount processed by team members
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Scans by worker" description="Ranked by total scans handled">
            <HorizontalBarChart
              data={scansData}
              dataKey="scans"
              height={320}
              color="var(--primary)"
              yAxisWidth={110}
            />
          </Panel>

          <Panel
            title="Discount processed by worker"
            description="Ranked by total discount value processed"
          >
            <HorizontalBarChart
              data={discountData}
              dataKey="discount"
              height={320}
              color="var(--teal)"
              valueFormatter={formatCurrency}
              yAxisWidth={110}
            />
          </Panel>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
                <DialogDescription>
                  {selected.id} · {selected.shift} shift · joined {formatDate(selected.joinedAt)}
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
                <ul className="max-h-64 divide-y divide-border overflow-y-auto">
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
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
