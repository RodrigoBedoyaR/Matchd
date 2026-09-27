// Match scoring, ported from the Lovable POC's src/lib/matching.ts and moved
// server-side so the score is computed once, consistently, and can't be
// spoofed by the client. Weights come from @matchd/shared so both the API
// and any future re-implementation agree on them.
import { MATCH_WEIGHTS } from "@matchd/shared";
import type { Job, WorkerProfile } from "@prisma/client";

export type Slot = "morning" | "afternoon" | "evening";
type ExperienceEntry = { category: string; summary: string };

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

export interface MatchBreakdown {
  score: number; // 0-100
  availability: boolean;
  distance: boolean;
  category: boolean;
  language: boolean;
  experience: boolean;
  reasons: { ok: boolean; label: string }[];
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

// Resolves a job-to-worker distance: prefer real coordinates when both sides
// have them, otherwise fall back to the seeded/demo distanceKm on the job.
export function resolveDistanceKm(
  job: Pick<Job, "lat" | "lng" | "distanceKm">,
  worker: Pick<WorkerProfile, "lat" | "lng">,
): number {
  if (job.lat != null && job.lng != null && worker.lat != null && worker.lng != null) {
    return Math.round(haversineKm({ lat: job.lat, lng: job.lng }, { lat: worker.lat, lng: worker.lng }) * 10) / 10;
  }
  return job.distanceKm ?? 5;
}

export function matchJobToWorker(
  job: Pick<Job, "days" | "startTime" | "endTime" | "category" | "requiredLanguages" | "experienceLevel" | "lat" | "lng" | "distanceKm">,
  worker: Pick<WorkerProfile, "availability" | "maxDistanceKm" | "interests" | "languages" | "experience" | "lat" | "lng">,
): MatchBreakdown {
  const needed = slotsForTime(job.startTime, job.endTime);
  const availability = (worker.availability ?? {}) as Record<string, Slot[]>;

  let covered = 0;
  for (const day of job.days) {
    const has = availability[day] ?? [];
    const daySlots = needed.filter((s) => has.includes(s));
    covered += needed.length ? daySlots.length / needed.length : 0;
  }
  const availabilityScore = job.days.length ? covered / job.days.length : 0;

  const distanceKm = resolveDistanceKm(job, worker);
  const max = worker.maxDistanceKm || 10;
  const distanceScore = distanceKm <= max ? 1 : Math.max(0, 1 - (distanceKm - max) / max);

  const categoryScore = worker.interests.includes(job.category) ? 1 : 0.25;

  const requiredLanguages = job.requiredLanguages;
  const languageScore = requiredLanguages.every((l) => worker.languages.includes(l))
    ? 1
    : requiredLanguages.some((l) => worker.languages.includes(l))
      ? 0.5
      : 0;

  const experience = (worker.experience ?? []) as ExperienceEntry[];
  const hasExp = experience.some((e) => e.category === job.category);
  const experienceScore =
    job.experienceLevel === "No experience needed" ? (hasExp ? 1 : 0.8) : hasExp ? 1 : 0.35;

  const raw =
    availabilityScore * MATCH_WEIGHTS.availability +
    distanceScore * MATCH_WEIGHTS.distance +
    categoryScore * MATCH_WEIGHTS.category +
    languageScore * MATCH_WEIGHTS.language +
    experienceScore * MATCH_WEIGHTS.experience;

  const score = Math.round(raw * 100);

  return {
    score,
    availability: availabilityScore >= 0.99,
    distance: distanceKm <= max,
    category: worker.interests.includes(job.category),
    language: languageScore === 1,
    experience: hasExp,
    reasons: [
      {
        ok: availabilityScore >= 0.99,
        label:
          availabilityScore >= 0.99
            ? "Your availability matches"
            : availabilityScore > 0
              ? "Partly fits your availability"
              : "Outside your availability",
      },
      {
        ok: distanceKm <= max,
        label:
          distanceKm <= max
            ? `Within your ${max} km range (${distanceKm} km)`
            : `${distanceKm} km — further than your ${max} km range`,
      },
      {
        ok: worker.interests.includes(job.category),
        label: worker.interests.includes(job.category)
          ? `Matches your ${job.category.toLowerCase()} preference`
          : `Outside your usual categories (${job.category})`,
      },
      {
        ok: languageScore === 1,
        label:
          languageScore === 1
            ? `${requiredLanguages.join(" & ") || "No language"} accepted`
            : `Asks for ${requiredLanguages.join(" & ")}`,
      },
      {
        // A job that needs no experience is never a gap, even without experience.
        ok: hasExp || job.experienceLevel === "No experience needed",
        label: hasExp
          ? `You have ${job.category.toLowerCase()} experience`
          : job.experienceLevel === "No experience needed"
            ? "No experience needed"
            : "Some experience preferred",
      },
    ],
  };
}
