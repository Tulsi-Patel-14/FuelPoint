import type {
  Customer,
  Group,
  Notification,
  SeriesPoint,
  Transaction,
  Worker,
} from "./types";
import { DEFAULT_GROUP_ID } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1/admin';
let token = localStorage.getItem('adminToken') || '';

export const setToken = (newToken: string) => {
  token = newToken;
  localStorage.setItem('adminToken', token);
};

const fetchApi = async (endpoint: string) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  const json = await response.json();
  return json.data;
};

export const adminService = {
  getGroups: async (): Promise<Group[]> => fetchApi('/groups'),
  getCustomers: async (): Promise<Customer[]> => fetchApi('/customers'),
  getWorkers: async (): Promise<Worker[]> => fetchApi('/workers'),
  getTransactions: async (): Promise<Transaction[]> => {
    const res = await fetchApi('/transactions');
    return res.data || res; // handle pagination structure if applicable
  },
  getNotifications: async (): Promise<Notification[]> => fetchApi('/notifications'),
  getProfile: async () => fetchApi('/profile'),
  getToday: () => new Date(),
};

export { DEFAULT_GROUP_ID };

/* ---------- formatting helpers ---------- */

export const formatCurrency = (value: number) =>
  `₹${Math.round(value).toLocaleString("en-IN")}`;

export const formatNumber = (value: number) => value.toLocaleString("en-IN");

export const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export const formatDateTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const TODAY = new Date();
export const relativeDays = (value: string | null) => {
  if (!value) return "Never";
  const diff = Math.floor((TODAY.getTime() - new Date(value).getTime()) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 30) return `${diff} days ago`;
  return `${Math.floor(diff / 30)} mo ago`;
};

const dayKey = (value: string) => value.slice(0, 10);
export const todayKey = () => TODAY.toISOString().slice(0, 10);

/* ---------- analytics ---------- */

export interface Overview {
  totalCustomers: number;
  totalWorkers: number;
  activeWorkers: number;
  totalGroups: number;
  totalTransactions: number;
  totalDiscount: number;
  totalRevenue: number;
  todayTransactions: number;
  todayDiscount: number;
  newRegistrations7d: number;
  activeCustomers: number;
  usedPumpCustomers: number;
  unassignedCustomers: number;
  avgDiscountPercent: number;
}

export function buildOverview(
  customers: Customer[],
  workers: Worker[],
  groups: Group[],
  transactions: Transaction[],
): Overview {
  const tk = todayKey();
  const totalDiscount = transactions.reduce((s, t) => s + (t.discountAmount || 0), 0);
  const totalRevenue = transactions.reduce((s, t) => s + (t.amount || 0), 0);
  return {
    totalCustomers: customers.length,
    totalWorkers: workers.length,
    activeWorkers: workers.filter((w) => w.status === "active").length,
    totalGroups: groups.filter((g) => g.active).length,
    totalTransactions: transactions.length,
    totalDiscount,
    totalRevenue,
    todayTransactions: transactions.filter((t) => dayKey(t.createdAt) === tk).length,
    todayDiscount: transactions
      .filter((t) => dayKey(t.createdAt) === tk)
      .reduce((s, t) => s + (t.discountAmount || 0), 0),
    newRegistrations7d: customers.filter(
      (c) => TODAY.getTime() - new Date(c.registeredAt).getTime() <= 7 * 86400000,
    ).length,
    activeCustomers: customers.filter((c) => c.status === "active").length,
    usedPumpCustomers: customers.filter((c) => c.transactions > 0).length,
    unassignedCustomers: customers.filter((c) => c.groupId === DEFAULT_GROUP_ID).length,
    avgDiscountPercent: totalRevenue ? (totalDiscount / totalRevenue) * 100 : 0,
  };
}

export function buildSeries(
  customers: Customer[],
  transactions: Transaction[],
  days: number,
): SeriesPoint[] {
  const buckets = new Map<string, SeriesPoint>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(TODAY.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, {
      date: key,
      label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      transactions: 0,
      discount: 0,
      registrations: 0,
      revenue: 0,
    });
  }
  transactions.forEach((t) => {
    const b = buckets.get(dayKey(t.createdAt));
    if (!b) return;
    b.transactions += 1;
    b.discount += (t.discountAmount || 0);
    b.revenue += (t.amount || 0);
  });
  customers.forEach((c) => {
    const b = buckets.get(dayKey(c.registeredAt));
    if (b) b.registrations += 1;
  });
  return [...buckets.values()];
}

export function groupDistribution(customers: Customer[], groups: Group[], transactions: Transaction[]) {
  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    discountPercent: g.discountPercent,
    active: g.active,
    customers: customers.filter((c) => c.groupId === g.id).length,
    discountGenerated: transactions
      .filter((t) => t.groupId === g.id)
      .reduce((s, t) => s + (t.discountAmount || 0), 0),
    transactions: transactions.filter((t) => t.groupId === g.id).length,
  }));
}

export function workerActivity(workers: Worker[]) {
  return [...workers]
    .sort((a, b) => (b.scans || 0) - (a.scans || 0))
    .map((w) => ({ name: w.name.split(" ")[0], scans: w.scans, transactions: w.transactions }));
}

export type RangeKey = "today" | "week" | "month" | "quarter" | "custom";

export function rangeBounds(range: RangeKey, from?: string, to?: string) {
  const end = new Date(TODAY);
  end.setUTCHours(23, 59, 59, 999);
  const start = new Date(TODAY);
  start.setUTCHours(0, 0, 0, 0);
  if (range === "week") start.setUTCDate(start.getUTCDate() - 6);
  if (range === "month") start.setUTCDate(start.getUTCDate() - 29);
  if (range === "quarter") start.setUTCDate(start.getUTCDate() - 89);
  if (range === "custom") {
    return {
      start: from ? new Date(`${from}T00:00:00.000Z`) : start,
      end: to ? new Date(`${to}T23:59:59.999Z`) : end,
    };
  }
  return { start, end };
}

export function inRange(value: string, bounds: { start: Date; end: Date }) {
  const t = new Date(value).getTime();
  return t >= bounds.start.getTime() && t <= bounds.end.getTime();
}

export function exportCsv(filename: string, rows: Record<string, string | number>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]!);
  const body = rows.map((r) =>
    headers
      .map((h) => {
        const v = String(r[h] ?? "");
        return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
      })
      .join(","),
  );
  const csv = [headers.join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
