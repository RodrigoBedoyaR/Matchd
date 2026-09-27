// Real session, backed by the API. Replaces the Lovable POC's localStorage-only
// src/lib/session.ts — same shape of hooks (useAuth() instead of useSession()),
// so porting screens over means swapping the import, not the logic.
import { createContext, startTransition, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, getToken, setToken, type AuthUser } from "@/lib/api";
import type { BusinessSummary, WorkerProfile } from "@/lib/data";

export type Role = "WORKER" | "BUSINESS";

interface AuthState {
  status: "loading" | "signed-out" | "signed-in";
  user: AuthUser | null;
  worker: WorkerProfile | null;
  business: BusinessSummary | null;
}

interface AuthContextValue extends AuthState {
  // These resolve with the signed-in account so callers can route by its real role.
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, role: Role) => Promise<AuthUser>;
  demoLogin: (role: Role) => Promise<AuthUser>;
  // For flows that hand back a token directly (e.g. password reset).
  signInWithToken: (token: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  setWorker: (worker: WorkerProfile) => void;
  setBusiness: (business: BusinessSummary) => void;
  setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
    worker: null,
    business: null,
  });

  const hydrate = useCallback(async () => {
    if (!getToken()) {
      setState({ status: "signed-out", user: null, worker: null, business: null });
      return;
    }
    try {
      const me = await authApi.me();
      setState({ status: "signed-in", user: me.user, worker: me.worker, business: me.business });
    } catch {
      setToken(null);
      setState({ status: "signed-out", user: null, worker: null, business: null });
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const signInWithToken = useCallback(async (token: string) => {
    setToken(token);
    await hydrate();
  }, [hydrate]);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await authApi.login({ email, password });
    await signInWithToken(token);
    return user;
  }, [signInWithToken]);

  const register = useCallback(async (email: string, password: string, role: Role) => {
    const { token, user } = await authApi.register({ email, password, role });
    await signInWithToken(token);
    return user;
  }, [signInWithToken]);

  const demoLogin = useCallback(async (role: Role) => {
    const { token, user } = role === "WORKER" ? await authApi.demoWorker() : await authApi.demoBusiness();
    await signInWithToken(token);
    return user;
  }, [signInWithToken]);

  const logout = useCallback(() => {
    setToken(null);
    // React Router applies navigations in a transition; signing out in one too
    // lets a navigate("/") made alongside land before the route guards see a
    // signed-out user on a protected page and bounce to /login.
    startTransition(() => {
      setState({ status: "signed-out", user: null, worker: null, business: null });
    });
  }, []);

  const setWorker = useCallback((worker: WorkerProfile) => {
    setState((prev) => ({ ...prev, worker }));
  }, []);

  const setBusiness = useCallback((business: BusinessSummary) => {
    setState((prev) => ({ ...prev, business }));
  }, []);

  const setUser = useCallback((user: AuthUser) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, demoLogin, signInWithToken, logout, refresh: hydrate, setWorker, setBusiness, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function homeFor(role: Role) {
  return role === "WORKER" ? "/worker/matches" : "/business/dashboard";
}

export function onboardingFor(role: Role) {
  return role === "WORKER" ? "/worker/onboarding" : "/business/onboarding";
}

export const DEMO_EMAILS = ["demo-worker@matchd.app", "demo-business@matchd.app"];

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
