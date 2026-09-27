import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { APP_NAME } from "@/lib/data";
import { homeFor, onboardingFor, useAuth, type Role } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { Button, Card, Chip, Field, Input } from "@/components/Primitives";
import { FullPageSpinner } from "@/components/RouteGuards";
import { AuthLayout } from "@/components/account/AuthLayout";
import { PasswordInput } from "@/components/account/PasswordInput";

function parseRole(value: string | null): Role {
  return value?.toUpperCase() === "BUSINESS" ? "BUSINESS" : "WORKER";
}

export default function Auth() {
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { status, user, login, register, demoLogin } = useAuth();

  // The URL is the source of truth for the mode: /signup vs /login.
  const mode: "login" | "register" = pathname === "/signup" ? "register" : "login";
  const [role, setRole] = useState<Role>(parseRole(params.get("role")));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next: "login" | "register") {
    const qs = next === "register" && params.get("role") ? `?role=${params.get("role")}` : "";
    navigate((next === "register" ? "/signup" : "/login") + qs, { replace: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        // role of the account, not the toggle, decides where we land
        const account = await login(email, password);
        navigate(homeFor(account.role), { replace: true });
      } else {
        const account = await register(email, password, role);
        navigate(onboardingFor(account.role), { replace: true });
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

  async function handleDemo(r: Role) {
    setSubmitting(true);
    try {
      const account = await demoLogin(r);
      navigate(homeFor(account.role), { replace: true });
    } catch {
      toast.error("Couldn't start the demo session. Is the API running?");
      setSubmitting(false);
    }
  }

  if (status === "loading") return <FullPageSpinner />;
  // Already signed in (and not mid-submit, where we navigate ourselves): skip the form.
  if (status === "signed-in" && user && !submitting) return <Navigate to={homeFor(user.role)} replace />;

  return (
    <AuthLayout>
      <Card>
        <div className="mb-4 flex gap-2">
          <Chip selected={mode === "login"} onClick={() => switchMode("login")} className="flex-1 text-center">
            Log in
          </Chip>
          <Chip selected={mode === "register"} onClick={() => switchMode("register")} className="flex-1 text-center">
            Sign up
          </Chip>
        </div>

        {mode === "register" ? (
          <div className="mb-4">
            <span className="text-sm font-semibold text-foreground">How will you use {APP_NAME}?</span>
            <div className="mt-2 flex gap-2">
              <Chip selected={role === "WORKER"} onClick={() => setRole("WORKER")} className="flex-1 text-center">
                Find work
              </Chip>
              <Chip selected={role === "BUSINESS"} onClick={() => setRole("BUSINESS")} className="flex-1 text-center">
                Hire people
              </Chip>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email">
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <div>
            <Field label="Password">
              <PasswordInput
                required
                minLength={8}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </Field>
            {mode === "login" ? (
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
            ) : null}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {mode === "login" ? "Log in" : "Create account"}
          </Button>
        </form>
      </Card>

      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">Just looking? Try the demo</p>
        <div className="mt-2 flex justify-center gap-2">
          <Button variant="ghost" size="sm" disabled={submitting} onClick={() => handleDemo("WORKER")}>
            As a worker
          </Button>
          <Button variant="ghost" size="sm" disabled={submitting} onClick={() => handleDemo("BUSINESS")}>
            As a business
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
