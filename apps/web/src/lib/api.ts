// Typed client for the apps/api REST surface. Every screen goes through
// these functions rather than calling fetch directly, so the endpoint
// contract lives in exactly one place on the frontend.
import type {
  Application,
  BusinessSummary,
  Invitation,
  Job,
  ScreeningAnswer,
  WorkerProfile,
} from "./data";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const TOKEN_KEY = "matchd.token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// The API answers either a plain string or a zod `flatten()` object; turn both
// into one human-readable sentence for toasts.
function errorMessage(error: unknown): string | undefined {
  if (!error) return undefined;
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const { formErrors, fieldErrors } = error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
    if (formErrors?.length) return formErrors[0];
    const [field, messages] = Object.entries(fieldErrors ?? {})[0] ?? [];
    if (field && messages?.length) return `${field}: ${messages[0]}`;
  }
  return undefined;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => undefined) : undefined;
  if (!res.ok) {
    throw new ApiError(res.status, errorMessage(body?.error) ?? res.statusText);
  }
  return body as T;
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined });
const patch = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined });
const del = <T>(path: string, data?: unknown) =>
  request<T>(path, { method: "DELETE", body: data ? JSON.stringify(data) : undefined });

/* --------------------------------- auth ---------------------------------- */

export interface AuthUser {
  id: string;
  email: string;
  role: "WORKER" | "BUSINESS";
}
export interface AuthResponse {
  token: string;
  user: AuthUser;
}
export interface MeResponse {
  user: AuthUser;
  worker: WorkerProfile | null;
  business: BusinessSummary | null;
}

export const authApi = {
  register: (input: { email: string; password: string; role: "WORKER" | "BUSINESS" }) =>
    post<AuthResponse>("/auth/register", input),
  login: (input: { email: string; password: string }) => post<AuthResponse>("/auth/login", input),
  demoWorker: () => post<AuthResponse>("/auth/demo/worker"),
  demoBusiness: () => post<AuthResponse>("/auth/demo/business"),
  me: () => get<MeResponse>("/auth/me"),
  // devResetUrl is only returned outside production (there is no mail provider yet).
  forgotPassword: (email: string) => post<{ ok: true; devResetUrl?: string }>("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    post<AuthResponse>("/auth/reset-password", { token, password }),
  changePassword: (currentPassword: string, newPassword: string) =>
    patch<{ ok: true }>("/auth/account/password", { currentPassword, newPassword }),
  changeEmail: (email: string, password: string) => patch<{ user: AuthUser }>("/auth/account/email", { email, password }),
  deleteAccount: (password: string) => del<{ ok: true }>("/auth/account", { password }),
};

export interface ApplyInput {
  note?: string;
  answers?: ScreeningAnswer[];
  confirmedScheduleGaps?: boolean;
}

/* -------------------------------- worker ---------------------------------- */

export const workerApi = {
  onboard: (input: Record<string, unknown>) => post<{ worker: WorkerProfile }>("/worker/onboarding", input),
  updateProfile: (input: Record<string, unknown>) => patch<{ worker: WorkerProfile }>("/worker/profile", input),
  matches: () => get<{ jobs: Job[] }>("/worker/matches"),
  jobDetail: (jobId: string) => get<{ job: Job }>(`/worker/jobs/${jobId}`),
  apply: (jobId: string, input: ApplyInput = {}) =>
    post<{ application: Application }>("/worker/applications", { jobId, ...input }),
  applications: () => get<{ applications: Application[] }>("/worker/applications"),
  invitations: () => get<{ invitations: Invitation[] }>("/worker/invitations"),
  respondToInvitation: (id: string, status: "Accepted" | "Declined") =>
    patch<{ invitation: Invitation }>(`/worker/invitations/${id}`, { status }),
  toggleFavoriteJob: (jobId: string) => post<{ favorited: boolean }>(`/worker/favorites/jobs/${jobId}`),
  favoriteJobs: () => get<{ jobIds: string[] }>("/worker/favorites/jobs"),
};

/* ------------------------------- business ---------------------------------- */

export interface CandidateResult {
  worker: WorkerProfile;
  distanceKm: number;
  match: NonNullable<Job["match"]>;
}

export const businessApi = {
  onboard: (input: Record<string, unknown>) => post<{ business: BusinessSummary }>("/business/onboarding", input),
  updateProfile: (input: Record<string, unknown>) => patch<{ business: BusinessSummary }>("/business/profile", input),
  createJob: (input: Record<string, unknown>) => post<{ job: Job }>("/business/jobs", input),
  jobs: () => get<{ jobs: Job[] }>("/business/jobs"),
  setJobActive: (jobId: string, active: boolean) => patch<{ job: Job }>(`/business/jobs/${jobId}`, { active }),
  setScreeningQuestions: (jobId: string, screeningQuestions: string[]) =>
    patch<{ job: Job }>(`/business/jobs/${jobId}`, { screeningQuestions }),
  candidates: (jobId: string) => get<{ candidates: CandidateResult[] }>(`/business/candidates?jobId=${jobId}`),
  candidateDetail: (workerId: string, jobId?: string) =>
    get<{ worker: WorkerProfile; distanceKm?: number; match?: Job["match"] }>(
      `/business/candidates/${workerId}${jobId ? `?jobId=${jobId}` : ""}`,
    ),
  invite: (workerId: string, jobId: string) => post<{ invitation: Invitation }>("/business/invitations", { workerId, jobId }),
  invitations: () => get<{ invitations: Invitation[] }>("/business/invitations"),
  updateInvitationStatus: (id: string, status: string) =>
    patch<{ invitation: Invitation }>(`/business/invitations/${id}`, { status }),
  applications: () => get<{ applications: Application[] }>("/business/applications"),
  updateApplicationStatus: (id: string, status: string) =>
    patch<{ application: Application }>(`/business/applications/${id}`, { status }),
  toggleFavoriteCandidate: (workerId: string) =>
    post<{ favorited: boolean }>(`/business/favorites/candidates/${workerId}`),
  favoriteCandidates: () => get<{ workerIds: string[] }>("/business/favorites/candidates"),
};
