import { Navigate, Outlet } from "react-router-dom";
import { useAuth, type Role } from "@/context/AuthContext";

export function RequireRole({ role }: { role: Role }) {
  const { status, user } = useAuth();
  if (status === "loading") return <FullPageSpinner />;
  if (status === "signed-out") return <Navigate to="/login" replace />;
  if (user?.role !== role) {
    return <Navigate to={user?.role === "WORKER" ? "/worker/matches" : "/business/dashboard"} replace />;
  }
  return <Outlet />;
}

// Gate for routes that need a completed onboarding profile. Renders the
// onboarding route itself unguarded so there's somewhere to land.
export function RequireWorkerProfile() {
  const { worker } = useAuth();
  if (!worker) return <Navigate to="/worker/onboarding" replace />;
  return <Outlet />;
}

export function RequireBusinessProfile() {
  const { business } = useAuth();
  if (!business) return <Navigate to="/business/onboarding" replace />;
  return <Outlet />;
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      Loading…
    </div>
  );
}
