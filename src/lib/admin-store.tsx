import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { adminService, DEFAULT_GROUP_ID, setToken, type CustomerQueryParams, type WorkerQueryParams } from "@/services/adminService";
import type { AdminProfile, Customer, Group, Notification, Transaction, Worker } from "@/services/types";

interface AdminState {
  authReady: boolean;
  authed: boolean;
  login: (email: string, password?: string, remember?: boolean) => Promise<void>;
  logout: () => void;
  profile: AdminProfile;
  updateProfile: (patch: Partial<AdminProfile>) => void;
  customers: Customer[];
  workers: Worker[];
  groups: Group[];
  transactions: Transaction[];
  notifications: Notification[];
  unreadCount: number;
  assignCustomerGroup: (customerId: string, groupId: string) => Promise<void>;
  saveGroup: (group: Omit<Group, "createdAt"> & { createdAt?: string }) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  toggleGroupActive: (groupId: string) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  saveCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  saveWorker: (worker: Worker) => Promise<void>;
  deleteWorker: (workerId: string) => Promise<void>;
  getCustomers: (params?: CustomerQueryParams) => Promise<Customer[]>;
  getWorkers: (params?: WorkerQueryParams) => Promise<Worker[]>;
  getGroups: () => Promise<Group[]>;
}

const AdminContext = createContext<AdminState | null>(null);

const AUTH_KEY = "fuelpoint-admin-authed";

export function AdminProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  
  const [profile, setProfile] = useState<AdminProfile>({
    name: "Admin",
    email: "admin@fuelpoint.com",
    phone: "",
    role: "Administrator",
    location: "",
    joinedAt: new Date().toISOString(),
    initials: "A",
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const logout = useCallback(() => {
    setAuthed(false);
    setToken("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem("adminToken");
    }
  }, []);

  // Restore the session after a page refresh or browser restart (client-side only).
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("adminToken");
      const isAuthed = sessionStorage.getItem(AUTH_KEY) === "1" || localStorage.getItem(AUTH_KEY) === "1";
      if (token && isAuthed) {
        try {
          // Check token expiry
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload.exp && payload.exp * 1000 > Date.now()) {
            setAuthed(true);
          } else {
            logout();
          }
        } catch {
          setAuthed(true);
        }
      }
    }
    setAuthReady(true);
  }, [logout]);

  useEffect(() => {
    if (!authed) return;
    const loadData = async () => {
      try {
        const catchError = (err: any) => {
          if (err.message?.includes("401")) logout();
          return null;
        };

        const results = await Promise.all([
          adminService.getProfile().catch(catchError),
          adminService.getCustomers({ all: true }).catch(catchError),
          adminService.getGroups().catch(catchError),
          adminService.getNotifications().catch(catchError),
          adminService.getWorkers({ all: true }).catch(catchError),
          adminService.getTransactions().catch(catchError)
        ]);
        
        setProfile(results[0] || {} as any);
        setCustomers(results[1] || []);
        setGroups(results[2] || []);
        setNotifications(results[3] || []);
        setWorkers(results[4] || []);
        
        const rawTx = results[5];
        if (rawTx && rawTx.data && Array.isArray(rawTx.data)) {
          setTransactions(rawTx.data);
        } else if (Array.isArray(rawTx)) {
          setTransactions(rawTx);
        } else {
          setTransactions([]);
        }
      } catch (err: any) {
        console.error("Failed to load admin data", err);
        if (err.message?.includes("401")) {
          logout();
        }
      }
    };
    loadData();
  }, [authed, logout]);

  const login = useCallback(async (email: string, password?: string, remember: boolean = true) => {
    // Call real API
    const data = await adminService.login(email, password);
    
    // Store real JWT in localStorage (where fetchApi expects it)
    setToken(data.token);

    // Update UI state
    setAuthed(true);
    setProfile((p) => ({ ...p, email: email || p.email }));
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_KEY, "1");
      if (remember) {
        sessionStorage.setItem(AUTH_KEY, "1");
      } else {
        sessionStorage.removeItem(AUTH_KEY);
      }
    }
  }, []);


  const getGroups = useCallback(async () => {
    try {
      const fresh = await adminService.getGroups();
      setGroups(fresh);
      return fresh;
    } catch (err: any) {
      if (err.message?.includes("401")) logout();
      throw err;
    }
  }, [logout]);

  const assignCustomerGroup = useCallback(
    async (customerId: string, groupId: string) => {
      try {
        await adminService.updateCustomer(customerId, { groupId });
        const [freshCustomers, freshGroups] = await Promise.all([
          adminService.getCustomers({ all: true }),
          adminService.getGroups(),
        ]);
        setCustomers(freshCustomers);
        setGroups(freshGroups);
        setNotifications((prev) =>
          prev.map((n) => (n.customerId === customerId ? { ...n, read: true } : n)),
        );
      } catch (err: any) {
        if (err.message?.includes("401")) logout();
        throw err;
      }
    },
    [logout],
  );

  const saveGroup: AdminState["saveGroup"] = useCallback(async (group) => {
    try {
      const isNew = !group.id;
      let savedGroup: Group;
      if (isNew) {
        const payload = { ...group };
        delete (payload as any).id;
        savedGroup = await adminService.createGroup(payload);
      } else {
        savedGroup = await adminService.updateGroup(group.id, group);
      }
      const freshGroups = await adminService.getGroups();
      setGroups(freshGroups);
    } catch (err: any) {
      if (err.message?.includes("401")) logout();
      throw err;
    }
  }, [logout]);

  const deleteGroup = useCallback(async (groupId: string) => {
    try {
      await adminService.deleteGroup(groupId);
      const [freshGroups, freshCustomers] = await Promise.all([
        adminService.getGroups(),
        adminService.getCustomers({ all: true }),
      ]);
      setGroups(freshGroups);
      setCustomers(freshCustomers);
    } catch (err: any) {
      if (err.message?.includes("401")) logout();
      throw err;
    }
  }, [logout]);

  const toggleGroupActive = useCallback(async (groupId: string) => {
    try {
      await adminService.toggleGroupActive(groupId);
      const freshGroups = await adminService.getGroups();
      setGroups(freshGroups);
    } catch (err: any) {
      if (err.message?.includes("401")) logout();
      throw err;
    }
  }, [logout]);

  const saveCustomer = useCallback(async (customer: Customer) => {
    try {
      const isNew = !customer.id;
      const savedCustomer = isNew ? await adminService.createCustomer(customer) : await adminService.updateCustomer(customer.id, customer);
      setCustomers((prev) => {
        const exists = prev.some((c) => c.id === savedCustomer.id);
        if (exists) return prev.map((c) => (c.id === savedCustomer.id ? savedCustomer : c));
        return [...prev, savedCustomer];
      });
    } catch (err: any) {
      if (err.message?.includes("401")) logout();
      throw err;
    }
  }, [logout]);

  const deleteCustomer = useCallback(async (customerId: string) => {
    try {
      await adminService.deleteCustomer(customerId);
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    } catch (err: any) {
      if (err.message?.includes("401")) logout();
      throw err;
    }
  }, [logout]);

  const saveWorker = useCallback(async (worker: Worker) => {
    try {
      const isNew = !worker.id;
      let savedWorker: Worker;
      if (isNew) {
        savedWorker = await adminService.createWorker(worker);
      } else {
        savedWorker = await adminService.updateWorker(worker.id, worker);
      }
      
      setWorkers((prev) => {
        const exists = prev.some((w) => w.id === savedWorker.id);
        if (exists) return prev.map((w) => (w.id === savedWorker.id ? savedWorker : w));
        return [...prev, savedWorker];
      });
    } catch (err: any) {
      if (err.message?.includes("401")) logout();
      throw err;
    }
  }, [logout]);

  const deleteWorker = useCallback(async (workerId: string) => {
    try {
      await adminService.deleteWorker(workerId);
      setWorkers((prev) => prev.filter((w) => w.id !== workerId));
    } catch (err: any) {
      if (err.message?.includes("401")) logout();
      throw err;
    }
  }, [logout]);

  const getCustomers = useCallback(async (params?: CustomerQueryParams) => {
    try {
      const data = await adminService.getCustomers(params);
      if (!params || params.all) {
        setCustomers(data);
      }
      return data;
    } catch (err: any) {
      if (err.message?.includes("401")) logout();
      throw err;
    }
  }, [logout]);

  const getWorkers = useCallback(async (params?: WorkerQueryParams) => {
    try {
      const data = await adminService.getWorkers(params);
      if (!params || params.all) {
        setWorkers(data);
      }
      return data;
    } catch (err: any) {
      if (err.message?.includes("401")) logout();
      throw err;
    }
  }, [logout]);

  const value: AdminState = {
    authReady,
    authed,
    login,
    logout,
    profile,
    updateProfile: (patch) => setProfile((p) => ({ ...p, ...patch })),
    customers,
    workers,
    groups,
    transactions,
    notifications,
    // @ts-ignore
    _debug: console.log("NOTIFICATIONS VALUE:", notifications),
    unreadCount: Array.isArray(notifications) ? notifications.filter((n) => !n?.read).length : 0,
    assignCustomerGroup,
    saveGroup,
    deleteGroup,
    toggleGroupActive,
    markRead: async (id) => {
      try {
        await adminService.markNotificationRead(id);
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      } catch (err) {
        console.error("Failed to mark notification read", err);
      }
    },
    markAllRead: async () => {
      try {
        await adminService.markAllNotificationsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch (err) {
        console.error("Failed to mark all notifications read", err);
      }
    },
    saveCustomer,
    deleteCustomer,
    saveWorker,
    deleteWorker,
    getCustomers,
    getWorkers,
    getGroups,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside AdminProvider");
  return ctx;
}
