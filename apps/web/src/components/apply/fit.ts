// Pure helpers for the apply flow: reading the match breakdown and turning
// profile/job data into the short summaries shown to workers.
import { DAYS, SLOTS, formatDays, formatPay, type Availability, type Job, type MatchBreakdown } from "@/lib/data";

export interface FitGaps {
  // Not-ok match reasons, in the order the API returned them.
  gaps: MatchBreakdown["reasons"];
  // True when one of the gaps is about days/hours (the availability reason).
  scheduleGap: boolean;
}

// The API always emits the availability reason first, but we key off the
// `availability` flag so a reordering server-side can't break detection.
export function fitGaps(match: MatchBreakdown | undefined): FitGaps {
  if (!match) return { gaps: [], scheduleGap: false };
  return {
    gaps: match.reasons.filter((r) => !r.ok),
    scheduleGap: !match.availability,
  };
}

// "Mon · Wed · Fri, 17:00–22:00"
export function jobScheduleLine(job: Pick<Job, "days" | "startTime" | "endTime">): string {
  return `${formatDays(job.days)}, ${job.startTime}–${job.endTime}`;
}

// "€12.50/hr · Mon · Wed · Fri, 17:00–22:00"
export function jobPayScheduleLine(job: Pick<Job, "hourlyPay" | "days" | "startTime" | "endTime">): string {
  return `${formatPay(job.hourlyPay)}/hr · ${jobScheduleLine(job)}`;
}

// One line per available day, e.g. "Mon: Morning, Evening".
export function availabilityLines(availability: Availability): string[] {
  return DAYS.flatMap((d) => {
    const slots = availability[d.key] ?? [];
    if (!slots.length) return [];
    const labels = SLOTS.filter((s) => slots.includes(s.key)).map((s) => s.label);
    return [`${d.short}: ${labels.join(", ")}`];
  });
}

export function formatAppliedDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
