import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  Fuel,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Tags,
  UserCircle,
  Users,
  Wrench,
  FileBarChart,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAdmin } from "@/lib/admin-store";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/workers", label: "Workers", icon: Wrench },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/groups", label: "Groups & Discounts", icon: Tags },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/profile", label: "My Profile", icon: UserCircle },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const { profile, unreadCount, logout } = useAdmin();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchParams = useRouterState({ select: (s) => s.location.search }) as any;
  const current = nav.find((n) => pathname.startsWith(n.to));
  const currentTitle =
    pathname === "/search" ? "Search" : (current?.label ?? (pathname.startsWith("/profile") ? "My Profile" : "Dashboard"));

  useEffect(() => {
    if (pathname === "/search" && searchParams.q) {
      setSearchQuery(searchParams.q);
    } else {
      setSearchQuery("");
    }
  }, [pathname, searchParams.q]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "gradient-navy fixed inset-y-0 left-0 z-50 flex w-72 flex-col text-sidebar-foreground transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 px-6 py-6">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary-foreground ring-1 ring-white/15">
            <Fuel className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">FuelPoint</p>
            <p className="text-xs text-sidebar-foreground/70">Admin Console</p>
          </div>
          <button
            className="ml-auto rounded-md p-1 text-sidebar-foreground/70 hover:bg-white/10 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-white/8 hover:text-white data-[status=active]:bg-sidebar-primary data-[status=active]:text-sidebar-primary-foreground"
            >
              <Icon className="size-[18px]" />
              {label}
              {to === "/notifications" && unreadCount > 0 && (
                <span className="ml-auto rounded-full bg-teal px-2 py-0.5 text-[11px] font-semibold text-teal-foreground">
                  {unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="m-3 rounded-xl bg-white/6 p-4 ring-1 ring-white/10">
          <p className="text-xs font-semibold text-white">Discount engine</p>
          <p className="mt-1 text-xs text-sidebar-foreground/70">
            Group-based discounts are applied automatically at scan time.
          </p>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-navy/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Main */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6">
          <button
            className="rounded-md p-2 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <div>
            <h2 className="text-sm font-semibold text-foreground sm:text-base">{currentTitle}</h2>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Petrol pump customer &amp; discount management
            </p>
          </div>

          <div className="ml-auto hidden items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 md:flex md:w-72">
            <Search className="size-4 text-muted-foreground" />
            <input
              placeholder="Search customers, workers…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  navigate({
                    to: "/search" as any,
                    search: { q: searchQuery.trim() } as any,
                  });
                }
              }}
            />
          </div>

          <Link
            to="/notifications"
            className="relative ml-auto rounded-lg p-2 text-muted-foreground hover:bg-muted md:ml-0"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-left hover:bg-muted">
              <span className="gradient-brand flex size-8 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground">
                {profile.initials}
              </span>
              <span className="hidden leading-tight sm:block">
                <span className="block text-xs font-semibold text-foreground">{profile.name}</span>
                <span className="block text-[11px] text-muted-foreground">{profile.role}</span>
              </span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {profile.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                  <UserCircle className="size-4" /> My profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/reports" className="flex items-center gap-2 cursor-pointer">
                  <FileBarChart className="size-4" /> Reports
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="size-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
