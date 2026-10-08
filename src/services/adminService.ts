import type {
  Customer,
  Group,
  Notification,
  SeriesPoint,
  Transaction,
  Worker,
} from "./types";
import { DEFAULT_GROUP_ID } from "./types";

const API_BASE_URL = (import.meta.env as any).VITE_API_BASE_URL || 'http://localhost:5000/api/v1/admin';

export const setToken = (newToken: string) => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem('adminToken', newToken);
  }
};

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  groupId?: string;
  status?: string;
  all?: boolean;
}

export interface WorkerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  shift?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  all?: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedCustomers {
  customers: Customer[];
  pagination: Pagination;
}

export interface PaginatedWorkers {
  workers: Worker[];
  pagination: Pagination;
}

export interface CustomerSummaryResponse {
  totalCustomers: number;
  newRegistrations7d: number;
  activeCustomers: number;
  usedPumpCustomers: number;
}

export interface WorkerSummaryResponse {
  totalWorkers: number;
  activeWorkers: number;
  totalScans: number;
  discountProcessed: number;
}

export interface GroupSummaryResponse {
  totalGroups: number;
  activeGroups: number;
  groupedCustomers: number;
  discountGenerated: number;
}

export interface ReportSummaryResponse {
  dateRange: { start: string; end: string };
  transactions: {
    transactions: number;
    revenue: number;
    litresDispensed: number;
    avgTicket: number;
  };
  discount: {
    discountGiven: number;
    effectiveRate: number;
    discountedScans: number;
    avgDiscountPerScan: number;
  };
  customers: {
    newRegistrations: number;
    totalCustomers: number;
    active: number;
    unassigned: number;
  };
  workers: {
    workers: number;
    active: number;
    scansInRange: number;
    discountProcessed: number;
  };
  groups: {
    groups: number;
    activeGroups: number;
    groupDiscount: number;
    groupedCustomers: number;
  };
  scansInRange: number;
  registrationsInRange: number;
}

export interface ReportDataParams {
  category: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ReportDataResponse<T = any> {
  data: T[];
  pagination: Pagination;
}

export interface ExportReportParams {
  category: string;
  startDate?: string;
  endDate?: string;
  format: 'csv' | 'excel';
}

export interface DashboardData {
  days: number;
  overview: {
    totalCustomers: number;
    totalWorkers: number;
    activeWorkers: number;
    totalDiscount: number;
    totalRevenue: number;
    totalTransactions: number;
    todayTransactions: number;
    todayDiscount: number;
    avgDiscountPercent: number;
    deltaRegistrations: number;
    deltaDiscount: number;
  };
  series: SeriesPoint[];
  groupDistribution: Array<{
    id: string;
    name: string;
    discountPercent: number;
    active: boolean;
    customers: number;
    transactions: number;
    discountGenerated: number;
  }>;
  workerActivity: Array<{
    id: string;
    name: string;
    scans: number;
    transactions: number;
    discountProcessed: number;
  }>;
  recentTransactions: Transaction[];
}

export const extractErrorMessage = async (response: Response, defaultMessage: string = "Request failed"): Promise<string> => {
  try {
    const text = await response.text();
    if (text) {
      try {
        const json = JSON.parse(text);
        if (json && typeof json === 'object') {
          if (typeof json.message === 'string' && json.message.trim()) {
            return json.message.trim();
          }
          if (typeof json.error === 'string' && json.error.trim()) {
            return json.error.trim();
          }
        }
      } catch {
        if (text.length < 150 && !text.startsWith('<')) {
          return text.trim();
        }
      }
    }
  } catch {
    // network or stream error
  }

  if (response.status === 401) return "Invalid email or password.";
  if (response.status === 403) return "Access denied. Admin privileges required.";
  if (response.status === 404) return "Requested resource not found.";
  if (response.status === 429) return "Too many requests. Please try again shortly.";
  if (response.status >= 500) return "Server error occurred. Please try again later.";

  return defaultMessage;
};

const fetchApiRaw = async (endpoint: string, options: RequestInit = {}) => {
  const currentToken = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') || '') : '';
  
  const headers = new Headers(options.headers);
  if (currentToken) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const message = await extractErrorMessage(response, `Request failed (${response.status})`);
    throw new Error(message);
  }
  return await response.json();
};

const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const json = await fetchApiRaw(endpoint, options);
  console.log("FETCH API:", endpoint, typeof json.data, Array.isArray(json.data));
  return json.data;
};

const mapWorker = (w: any): Worker => {
  const txns = Array.isArray(w.transactions) ? w.transactions : [];
  const txnsCount = typeof w.transactions === 'number'
    ? w.transactions
    : (typeof w.transactionsCount === 'number' ? w.transactionsCount : txns.length);
  const discount = typeof w.discountProcessed === 'number'
    ? w.discountProcessed
    : txns.reduce((sum: number, t: any) => sum + (t.discountAmount || 0), 0);
  const customers = typeof w.customersScanned === 'number'
    ? w.customersScanned
    : new Set(txns.map((t: any) => t.customerId)).size;
  let lastAct = w.lastActivity || w.joinedAt || new Date().toISOString();
  if (txns.length > 0 && !w.lastActivity) {
    const sorted = [...txns].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    lastAct = sorted[0].createdAt;
  }

  return {
    id: w.id,
    name: w.fullName || w.name || "Unknown",
    email: w.user?.email || w.email || "",
    phone: w.user?.mobile || w.phone || "",
    shift: w.shift || "Morning",
    status: (w.user?.status?.toLowerCase() || w.status || "active") as any,
    joinedAt: w.joinedAt || new Date().toISOString(),
    scans: w.scans || 0,
    customersScanned: customers,
    transactions: txnsCount,
    discountProcessed: discount,
    lastActivity: lastAct,
  };
};

const mapCustomer = (c: any): Customer => {
  let lastAct = c.lastActivity || c.joinedAt || null;
  if (c.transactions && c.transactions.length > 0) {
    const sorted = [...c.transactions].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    lastAct = sorted[0].createdAt;
  }
  return {
    id: c.id,
    name: c.fullName || "Unknown",
    email: c.user?.email || "",
    phone: c.user?.mobile || "",
    vehicle: c.vehicle || "",
    groupId: c.groupId || DEFAULT_GROUP_ID,
    status: (c.user?.status?.toLowerCase() || "active") as any,
    registeredAt: c.joinedAt || new Date().toISOString(),
    lastActivity: lastAct,
    transactions: c.transactions?.length || 0,
    totalSpend: c.transactions?.reduce((sum: number, t: any) => sum + (t.finalAmount || t.amount || 0), 0) || 0,
    discountReceived: c.transactions?.reduce((sum: number, t: any) => sum + (t.discountAmount || 0), 0) || 0,
    transactionsList: c.transactions || [],
  };
};

const mapTransaction = (t: any): Transaction => ({
  id: t.id,
  customerId: t.customerId,
  customerName: t.customer?.fullName || t.customerName || "Customer",
  workerId: t.workerId,
  workerName: t.worker?.fullName || t.workerName || "Worker",
  groupId: t.customer?.groupId || t.groupId || DEFAULT_GROUP_ID,
  amount: t.amount || 0,
  discountPercent: t.discountPercent || 0,
  discountAmount: t.discountAmount || 0,
  litres: t.litres || 0,
  fuel: (t.fuelType || t.fuel || "Petrol") as any,
  createdAt: t.createdAt || new Date().toISOString(),
});

const mapCustomerPayload = (data: Partial<Customer>) => {
  const payload: any = {
    fullName: data.name,
    mobile: data.phone,
    email: data.email,
    vehicle: data.vehicle,
    groupId: data.groupId === DEFAULT_GROUP_ID ? null : data.groupId,
    status: data.status?.toUpperCase(),
  };
  if (data.password) {
    payload.password = data.password;
  }
  return payload;
};

const mapWorkerPayload = (data: Partial<Worker>) => {
  const payload: any = {
    fullName: data.name,
    mobile: data.phone,
    email: data.email,
    shift: data.shift,
    status: data.status?.toUpperCase(),
  };
  if (data.password) {
    payload.password = data.password;
  }
  return payload;
};

export const adminService = {
  login: async (email: string, password?: string): Promise<{ token: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const message = await extractErrorMessage(response, "Invalid admin credentials");
      throw new Error(message);
    }
    const json = await response.json();
    return json.data;
  },
  globalSearch: async (q: string): Promise<any[]> => {
    return await fetchApi(`/search?q=${encodeURIComponent(q)}`);
  },
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.message || `Request failed (${response.status})`);
    }
    return json;
  },
  resetPassword: async (data: { token: string; password: string; confirmPassword?: string }): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.message || `Reset failed (${response.status})`);
    }
    return json;
  },
  verifyResetToken: async (token: string): Promise<{ valid: boolean; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-reset-token?token=${encodeURIComponent(token.trim())}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || !json.valid) {
      throw new Error(json.message || "This password reset link is invalid or has expired.");
    }
    return json;
  },
  getGroupSummary: async (): Promise<GroupSummaryResponse> => fetchApi('/groups/summary'),
  getGroups: async (): Promise<Group[]> => fetchApi('/groups'),
  getGroupsRaw: async (): Promise<{ success: boolean; data: Group[]; stats?: any }> => fetchApiRaw('/groups'),
  createGroup: async (group: Partial<Group>): Promise<Group> => {
    return fetchApi('/groups', {
      method: 'POST',
      body: JSON.stringify({
        name: group.name,
        discountPercent: Number(group.discountPercent),
        description: group.description,
        isDefault: group.isDefault,
      }),
    });
  },
  updateGroup: async (id: string, group: Partial<Group>): Promise<Group> => {
    return fetchApi(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: group.name,
        discountPercent: group.discountPercent !== undefined ? Number(group.discountPercent) : undefined,
        description: group.description,
        isDefault: group.isDefault,
        active: group.active,
      }),
    });
  },
  toggleGroupActive: async (id: string): Promise<Group> => {
    return fetchApi(`/groups/${id}/toggle`, { method: 'PATCH' });
  },
  deleteGroup: async (id: string): Promise<void> => {
    await fetchApi(`/groups/${id}`, { method: 'DELETE' });
  },
  getCustomerSummary: async (): Promise<CustomerSummaryResponse> => fetchApi('/customers/summary'),
  getCustomers: async (params?: CustomerQueryParams): Promise<Customer[]> => {
    const query = new URLSearchParams();
    if (params?.all) query.set('all', 'true');
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.groupId && params.groupId !== 'all') query.set('groupId', params.groupId);
    if (params?.status && params.status !== 'all') query.set('status', params.status);

    const qStr = query.toString() ? `?${query.toString()}` : '';
    const raw = await fetchApi(`/customers${qStr}`);
    return Array.isArray(raw) ? raw.map(mapCustomer) : (raw?.data ? raw.data.map(mapCustomer) : []);
  },
  getCustomersPaginated: async (params?: CustomerQueryParams): Promise<PaginatedCustomers> => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.groupId && params.groupId !== 'all') query.set('groupId', params.groupId);
    if (params?.status && params.status !== 'all') query.set('status', params.status);

    const qStr = query.toString() ? `?${query.toString()}` : '';
    const json = await fetchApiRaw(`/customers${qStr}`);
    const items = Array.isArray(json.data) ? json.data.map(mapCustomer) : [];
    return {
      customers: items,
      pagination: json.pagination || {
        page: params?.page || 1,
        limit: params?.limit || 10,
        total: items.length,
        totalPages: 1
      }
    };
  },
  createCustomer: async (customer: Partial<Customer>): Promise<Customer> => {
    const raw = await fetchApi('/customers', { method: 'POST', body: JSON.stringify(mapCustomerPayload(customer)) });
    return mapCustomer(raw);
  },
  updateCustomer: async (id: string, customer: Partial<Customer>): Promise<Customer> => {
    const raw = await fetchApi(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(mapCustomerPayload(customer)) });
    return mapCustomer(raw);
  },
  deleteCustomer: async (id: string): Promise<void> => fetchApi(`/customers/${id}`, { method: 'DELETE' }),
  getWorkerSummary: async (): Promise<WorkerSummaryResponse> => fetchApi('/workers/summary'),
  getWorkers: async (params?: WorkerQueryParams): Promise<Worker[]> => {
    const query = new URLSearchParams();
    if (params?.all) query.set('all', 'true');
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.shift && params.shift !== 'all') query.set('shift', params.shift);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

    const qStr = query.toString() ? `?${query.toString()}` : '';
    const raw = await fetchApi(`/workers${qStr}`);
    return Array.isArray(raw) ? raw.map(mapWorker) : (raw?.data ? raw.data.map(mapWorker) : []);
  },
  getWorkersPaginated: async (params?: WorkerQueryParams): Promise<PaginatedWorkers> => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.shift && params.shift !== 'all') query.set('shift', params.shift);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

    const qStr = query.toString() ? `?${query.toString()}` : '';
    const json = await fetchApiRaw(`/workers${qStr}`);
    const items = Array.isArray(json.data) ? json.data.map(mapWorker) : [];
    return {
      workers: items,
      pagination: json.pagination || {
        page: params?.page || 1,
        limit: params?.limit || 10,
        total: items.length,
        totalPages: 1
      }
    };
  },
  createWorker: async (worker: Partial<Worker>): Promise<Worker> => {
    const raw = await fetchApi('/workers', { method: 'POST', body: JSON.stringify(mapWorkerPayload(worker)) });
    return mapWorker(raw);
  },
  updateWorker: async (id: string, worker: Partial<Worker>): Promise<Worker> => {
    const raw = await fetchApi(`/workers/${id}`, { method: 'PUT', body: JSON.stringify(mapWorkerPayload(worker)) });
    return mapWorker(raw);
  },
  deleteWorker: async (id: string): Promise<void> => fetchApi(`/workers/${id}`, { method: 'DELETE' }),
  getTransactions: async (): Promise<Transaction[]> => {
    const raw = await fetchApi('/transactions');
    const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
    return list.map(mapTransaction);
  },
  getDashboard: async (days: number = 30): Promise<DashboardData> => {
    const raw = await fetchApi(`/dashboard?days=${days}`);
    return {
      ...raw,
      recentTransactions: (raw.recentTransactions || []).map(mapTransaction)
    };
  },
  getNotifications: async (): Promise<Notification[]> => fetchApi('/notifications'),
  getProfile: async () => fetchApi('/profile'),
  getToday: () => new Date(),
  getReportSummary: async (params?: { startDate?: string; endDate?: string }): Promise<ReportSummaryResponse> => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    const qStr = query.toString() ? `?${query.toString()}` : '';
    return fetchApi(`/reports/summary${qStr}`);
  },
  getReportData: async (params: ReportDataParams): Promise<ReportDataResponse> => {
    const query = new URLSearchParams();
    query.set('category', params.category);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    const qStr = `?${query.toString()}`;
    const raw = await fetchApiRaw(`/reports/data${qStr}`);
    return {
      data: Array.isArray(raw.data) ? raw.data : [],
      pagination: raw.pagination || {
        page: params.page || 1,
        limit: params.limit || 10,
        total: (raw.data || []).length,
        totalPages: 1,
      },
    };
  },
  exportReport: async (params: ExportReportParams): Promise<void> => {
    const query = new URLSearchParams();
    query.set('category', params.category);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    query.set('format', params.format);

    const currentToken = typeof window !== 'undefined' ? (localStorage.getItem('adminToken') || '') : '';
    const headers: Record<string, string> = {};
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/reports/export?${query.toString()}`, {
      headers,
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = 'Nothing to export for this range.';
      try {
        const parsed = JSON.parse(errText);
        if (parsed.message) msg = parsed.message;
      } catch {
        // default
      }
      throw new Error(msg);
    }

    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition');
    let filename = `${params.category}-report.${params.format === 'csv' ? 'csv' : 'xlsx'}`;
    if (disposition) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

export { DEFAULT_GROUP_ID };

/* ---------- formatting helpers ---------- */

export const formatCurrency = (value: number | null | undefined) =>
  `₹${Math.round(value || 0).toLocaleString("en-IN")}`;

export const formatNumber = (value: number | null | undefined) => (value || 0).toLocaleString("en-IN");

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
