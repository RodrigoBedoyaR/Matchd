// Compatibility layer so components ported from the Lovable POC can keep
// importing domain types/constants from "@/lib/data" unchanged. Enums and
// validation live in @matchd/shared; the API-response shapes and pure
// display helpers (not needed server-side) live here.
export * from "@matchd/shared";
import { DAYS, type Category, type Day, type Slot, type ApplicationStatus, type InvitationStatus } from "@matchd/shared";

export const APP_NAME = "Matchd";

export type Availability = Partial<Record<Day, Slot[]>>;

export interface ExperienceEntry {
  category: Category;
  summary: string;
}

export interface WorkerProfile {
  id: string;
  name: string;
  age?: number;
  city: string;
  postalCode?: string;
  maxDistanceKm: number;
  distanceKm?: number;
  availability: Availability;
  interests: Category[];
  languages: string[];
  experience: ExperienceEntry[];
  preferredPay?: number;
  drivingLicence: boolean;
  bio?: string;
}

export interface BusinessSummary {
  id: string;
  name: string;
  industry: string;
  area: string;
  city: string;
  description?: string;
  emoji?: string;
}

export interface MatchBreakdown {
  score: number;
  availability: boolean;
  distance: boolean;
  category: boolean;
  language: boolean;
  experience: boolean;
  reasons: { ok: boolean; label: string }[];
}

export interface Job {
  id: string;
  businessId: string;
  business?: BusinessSummary;
  title: string;
  category: Category;
  hourlyPay: number;
  days: Day[];
  startTime: string;
  endTime: string;
  area: string;
  city: string;
  distanceKm?: number;
  requiredLanguages: string[];
  requirements: string[];
  tasks: string[];
  offers: string[];
  description: string;
  recurring: boolean;
  experienceLevel: string;
  screeningQuestions: string[];
  active: boolean;
  match?: MatchBreakdown;
}

export interface ScreeningAnswer {
  question: string;
  answer: string;
}

export interface Application {
  id: string;
  workerId: string;
  jobId: string;
  status: ApplicationStatus;
  note?: string;
  answers: ScreeningAnswer[];
  confirmedScheduleGaps: boolean;
  createdAt: string;
  job?: Job;
  worker?: WorkerProfile;
}

export interface Invitation {
  id: string;
  businessId: string;
  workerId: string;
  jobId: string;
  status: InvitationStatus;
  createdAt: string;
  job?: Job;
  worker?: WorkerProfile;
}

export function slotsForTime(startTime: string, endTime: string): Slot[] {
  const start = Number(startTime.slice(0, 2));
  const endRaw = Number(endTime.slice(0, 2));
  const end = endRaw <= start ? endRaw + 24 : endRaw;
  const result: Slot[] = [];
  for (let h = start; h < end; h++) {
    const hour = h % 24;
    if (hour >= 6 && hour < 12) result.push("morning");
    else if (hour >= 12 && hour < 17) result.push("afternoon");
    else result.push("evening");
  }
  return Array.from(new Set(result));
}

export function formatDays(days: Day[]): string {
  const labels = days.map((d) => DAYS.find((x) => x.key === d)?.long ?? d);
  if (labels.length === 1) return labels[0] ?? "";
  if (labels.length === 2) return `${labels[0]} & ${labels[1]}`;
  return labels.map((l) => l.slice(0, 3)).join(" · ");
}

export const formatPay = (pay: number) => `€${pay.toFixed(2)}`;

export function formatLanguages(required: string[]): string {
  if (!required.length) return "No language requirement";
  return `${required.join(" & ")} ${required.length > 1 ? "required" : "OK"}`;
}
