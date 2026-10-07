import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Fuel,
  Loader2,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useState, useId, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminService } from "@/services/adminService";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search['token'] as string) || "",
  }),
  head: () => ({
    meta: [
      { title: "Reset Password — FuelPoint Admin" },
      {
        name: "description",
        content: "Reset your FuelPoint administrator password securely.",
      },
      { property: "og:title", content: "Reset Password — FuelPoint Admin" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const rawToken =
    search['token'] ||
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("token") || ""
      : "");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenInvalidOrExpired, setIsTokenInvalidOrExpired] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(Boolean(rawToken));
  const [errorMessage, setErrorMessage] = useState("");

  const newPasswordId = useId();
  const confirmPasswordId = useId();

  useEffect(() => {
    if (!rawToken) {
      setIsValidatingToken(false);
      return;
    }

    let isMounted = true;
    const verifyToken = async () => {
      setIsValidatingToken(true);
      try {
        await adminService.verifyResetToken(rawToken);
        if (isMounted) {
          setIsTokenInvalidOrExpired(false);
        }
      } catch {
        if (isMounted) {
          setIsTokenInvalidOrExpired(true);
        }
      } finally {
        if (isMounted) {
          setIsValidatingToken(false);
        }
      }
    };

    verifyToken();
    return () => {
      isMounted = false;
    };
  }, [rawToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!rawToken) {
      setErrorMessage("Reset token is missing.");
      return;
    }

    if (!password) {
      setErrorMessage("Password is required.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (!confirmPassword) {
      setErrorMessage("Please confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await adminService.resetPassword({
        token: rawToken,
        password,
        confirmPassword,
      });
      setIsSuccess(true);
      toast.success("Password reset successful", {
        description: "Your administrator password has been updated.",
      });
    } catch (err: any) {
      const msg = err.message || "Failed to reset password.";
      if (
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("expired")
      ) {
        setIsTokenInvalidOrExpired(true);
      } else {
        setErrorMessage(msg);
        toast.error("Password reset failed", {
          description: msg,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="gradient-navy relative hidden flex-col justify-between p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <Fuel className="size-5" />
          </span>
          <div>
            <p className="font-semibold">FuelPoint</p>
            <p className="text-xs text-white/60">Petrol pump management suite</p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl leading-tight font-bold">
            Secure admin credential management.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Create a strong, unique password to protect access to customer profiles,
            worker shifts, discount groups, and station transaction records.
          </p>
          <div className="mt-8 rounded-xl bg-white/5 p-4 ring-1 ring-white/10 space-y-2 text-xs text-white/70">
            <p className="font-semibold text-white">Password Requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Minimum 8 characters</li>
              <li>Must not match recently compromised credentials</li>
              <li>Single-use cryptographic reset link</li>
            </ul>
          </div>
        </div>

        <p className="flex items-center gap-2 text-xs text-white/50">
          <ShieldCheck className="size-4" /> Cryptographic token verification · Single-use update
        </p>
      </div>

      {/* Form / Content panel */}
      <div className="flex items-center justify-center bg-background px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          {/* Mobile brand header */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="gradient-brand flex size-10 items-center justify-center rounded-xl text-primary-foreground">
              <Fuel className="size-5" />
            </span>
            <p className="font-semibold text-foreground">FuelPoint Admin</p>
          </div>

          {/* STATE 0: VALIDATING TOKEN */}
          {isValidatingToken ? (
            <div className="space-y-6 text-center py-8">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Loader2 className="size-7 animate-spin" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Verifying reset link…</h2>
                <p className="text-sm text-muted-foreground">
                  Checking link validity and security status.
                </p>
              </div>
            </div>
          ) : !rawToken ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <ShieldAlert className="size-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Invalid reset link</h2>
                <p className="text-sm text-muted-foreground">
                  This password reset link is missing or invalid. Please request a new link from the sign-in page.
                </p>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate({ to: "/" })}
              >
                Back to Sign In
              </Button>
            </div>
          ) : isTokenInvalidOrExpired ? (
            /* STATE 2: EXPIRED OR ALREADY USED TOKEN */
            <div className="space-y-6 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertCircle className="size-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Reset link expired</h2>
                <p className="text-sm text-muted-foreground">
                  This password reset link is invalid or has expired. Please request a new password reset link.
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => navigate({ to: "/" })}
                >
                  Back to Sign In
                </Button>
              </div>
            </div>
          ) : isSuccess ? (
            /* STATE 3: SUCCESS STATE */
            <div className="space-y-6 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Password reset successful</h2>
                <p className="text-sm text-muted-foreground">
                  Your administrator password has been updated successfully. You can now sign in using your new password.
                </p>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate({ to: "/" })}
              >
                Go to Admin Sign In <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          ) : (
            /* STATE 4: RESET PASSWORD FORM */
            <div>
              <h2 className="text-2xl font-bold text-foreground">Reset your password</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Create a new secure password for your administrator account.
              </p>

              {errorMessage && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor={newPasswordId}>New password</Label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={newPasswordId}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-10"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={loading}
                      required
                      minLength={8}
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
                  <p className="text-[11px] text-muted-foreground">
                    Must be at least 8 characters long.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={confirmPasswordId}>Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={confirmPasswordId}
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 pr-10"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      disabled={loading}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Updating password…
                    </>
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
