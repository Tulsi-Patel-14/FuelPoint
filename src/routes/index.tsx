import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Fuel, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdmin } from "@/lib/admin-store";
import { adminService } from "@/services/adminService";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Admin Sign In — FuelPoint Console" },
      {
        name: "description",
        content:
          "Secure sign in for petrol pump administrators managing customers, workers and discount groups.",
      },
      { property: "og:title", content: "Admin Sign In — FuelPoint Console" },
      {
        property: "og:description",
        content: "Secure sign in for the FuelPoint petrol pump admin console.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAdmin();
  const navigate = useNavigate();
  const [email, setEmail] = useState("rajesh.menon@fuelpoint.in");
  const [password, setPassword] = useState("fuelpoint");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleForgotOpenChange = (open: boolean) => {
    setForgot(open);
    if (!open) {
      setResetLoading(false);
      setResetSent(false);
      setResetEmail("");
    }
  };

  const handleForgotSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const emailToReset = resetEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailToReset || !emailRegex.test(emailToReset)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setResetLoading(true);
    try {
      await adminService.requestPasswordReset(emailToReset);
      setResetSent(true);
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes("too many")) {
        toast.error(err.message);
      } else {
        // Generic success even on silent failure to avoid enumeration
        setResetSent(true);
      }
    } finally {
      setResetLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 4) {
      toast.error("Invalid input", {
        description: "Please enter a valid email address and a password of at least 4 characters.",
      });
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password, remember);
      toast.success("Signed in successfully", {
        description: "Welcome back to the FuelPoint Admin Console.",
      });
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      let rawMsg = String(err?.message || "Failed to sign in");
      if (rawMsg.includes("{") && rawMsg.includes("}")) {
        try {
          const parsed = JSON.parse(rawMsg.slice(rawMsg.indexOf("{"), rawMsg.lastIndexOf("}") + 1));
          if (parsed.message) rawMsg = parsed.message;
        } catch {}
      }
      rawMsg = rawMsg.replace(/^(Login|API)\s*Error:\s*\d+\s*-\s*/i, "").trim();

      toast.error(rawMsg || "Invalid admin credentials", {
        description: "Please check your email and password and try again.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="gradient-navy relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        {/* Subtle background ambient lighting */}
        <div className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-cyan-400/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 size-80 rounded-full bg-blue-500/15 blur-3xl" aria-hidden="true" />

        {/* Brand header */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 shadow-inner ring-1 ring-white/20">
            <Fuel className="size-5 text-white" />
          </span>
          <div>
            <p className="font-semibold text-white">FuelPoint</p>
            <p className="text-xs text-white/65">Fuel Station Management Platform</p>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 my-auto max-w-md py-12">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white lg:text-4xl">
            Powering smarter<br />fuel station operations.
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/75">
            Manage customers, workers and fuel discounts from one secure, real-time platform.
          </p>
        </div>

        {/* Subtle fuel dispenser architectural visual in bottom-right corner */}
        <svg
          className="pointer-events-none absolute -right-6 -bottom-6 z-0 h-80 w-80 select-none opacity-15 transition-opacity lg:h-96 lg:w-96 lg:opacity-20"
          viewBox="0 0 280 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="pumpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Canopy / Station Line */}
          <path d="M40 34 L260 34 L230 56 L30 56 Z" stroke="url(#lineGrad)" strokeWidth="1.5" fill="white" fillOpacity="0.03" />
          <line x1="45" y1="56" x2="45" y2="246" stroke="white" strokeOpacity="0.08" strokeDasharray="3 3" />

          {/* Plinth Base */}
          <rect x="50" y="240" width="180" height="16" rx="4" stroke="url(#lineGrad)" strokeWidth="1.5" fill="url(#pumpGrad)" />
          <line x1="30" y1="256" x2="250" y2="256" stroke="white" strokeOpacity="0.15" strokeWidth="1" />

          {/* Dispenser Body */}
          <rect x="80" y="70" width="120" height="170" rx="10" stroke="url(#lineGrad)" strokeWidth="1.5" fill="url(#pumpGrad)" />

          {/* Top Brand / Lighting Header */}
          <rect x="92" y="80" width="96" height="24" rx="4" stroke="white" strokeOpacity="0.25" strokeWidth="1" fill="white" fillOpacity="0.06" />
          <circle cx="106" cy="92" r="3" fill="white" fillOpacity="0.6" />
          <line x1="116" y1="92" x2="176" y2="92" stroke="white" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />

          {/* Digital Display Meter Screen */}
          <rect x="96" y="114" width="88" height="48" rx="6" stroke="white" strokeOpacity="0.2" strokeWidth="1" fill="#041B33" fillOpacity="0.4" />
          <rect x="104" y="122" width="46" height="5" rx="1.5" fill="white" fillOpacity="0.4" />
          <rect x="156" y="122" width="20" height="5" rx="1.5" fill="white" fillOpacity="0.3" />
          <rect x="104" y="131" width="34" height="5" rx="1.5" fill="white" fillOpacity="0.35" />
          <rect x="150" y="131" width="26" height="5" rx="1.5" fill="white" fillOpacity="0.25" />
          <line x1="104" y1="146" x2="176" y2="146" stroke="white" strokeOpacity="0.15" />

          {/* Lower Louvers */}
          <line x1="104" y1="180" x2="176" y2="180" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="104" y1="190" x2="176" y2="190" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="104" y1="200" x2="176" y2="200" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="104" y1="210" x2="176" y2="210" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round" />

          {/* Left Hose & Nozzle */}
          <path d="M80 120 C 55 120, 50 190, 68 215 C 74 223, 78 220, 78 210 L 78 140" stroke="white" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" fill="none" />
          <rect x="74" y="136" width="6" height="26" rx="2" fill="white" fillOpacity="0.45" />
          <path d="M72 136 L66 126 L62 126 L60 134 L68 136" stroke="white" strokeOpacity="0.45" strokeWidth="1.5" fill="none" strokeLinejoin="round" />

          {/* Right Hose & Nozzle */}
          <path d="M200 120 C 225 120, 230 190, 212 215 C 206 223, 202 220, 202 210 L 202 140" stroke="white" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" fill="none" />
          <rect x="200" y="136" width="6" height="26" rx="2" fill="white" fillOpacity="0.45" />
          <path d="M208 136 L214 126 L218 126 L220 134 L212 136" stroke="white" strokeOpacity="0.45" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
        </svg>

        {/* Bottom trust statement */}
        <div className="relative z-10 flex items-center gap-2 text-xs font-medium text-white/60">
          <ShieldCheck className="size-4 shrink-0 text-white/70" />
          <span>Secure admin workspace • Role-based access</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="gradient-brand flex size-10 items-center justify-center rounded-xl text-primary-foreground">
              <Fuel className="size-5" />
            </span>
            <p className="font-semibold text-foreground">FuelPoint Admin</p>
          </div>

          <h2 className="text-2xl font-bold text-foreground">Admin sign in</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Use your administrator credentials to continue.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="admin@fuelpoint.in"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => setForgot(true)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={remember}
                onCheckedChange={(v) => setRemember(Boolean(v))}
                aria-label="Remember me"
              />
              Remember me on this device
            </label>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in to console <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 rounded-lg border border-border bg-card px-3 py-2.5 text-xs text-muted-foreground">
            Demo credentials are pre-filled. Authentication is mocked on the client and can be
            wired to a real API later.
          </p>
        </div>
      </div>

      <Dialog open={forgot} onOpenChange={handleForgotOpenChange}>
        <DialogContent className="sm:max-w-md">
          {resetSent ? (
            <>
              <DialogHeader>
                <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-6" />
                </div>
                <DialogTitle className="text-center">Check your email</DialogTitle>
                <DialogDescription className="text-center text-sm">
                  If an administrator account exists for this email, we've sent a password reset link.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-center text-xs text-muted-foreground">
                The link will expire in 30 minutes.
              </div>
              <DialogFooter className="sm:justify-center">
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => handleForgotOpenChange(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={handleForgotSubmit}>
              <DialogHeader>
                <DialogTitle>Reset your password</DialogTitle>
                <DialogDescription>
                  We'll email a secure reset link to your registered admin address.
                </DialogDescription>
              </DialogHeader>
              <div className="my-4 space-y-2">
                <Label htmlFor="reset">Admin email</Label>
                <Input
                  id="reset"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="admin@fuelpoint.in"
                  disabled={resetLoading}
                  autoComplete="email"
                  required
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleForgotOpenChange(false)}
                  disabled={resetLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={resetLoading}>
                  {resetLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Sending…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
