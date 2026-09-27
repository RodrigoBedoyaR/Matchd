import { Link } from "react-router-dom";
import { DAYS, SLOTS, type WorkerProfile, type MatchBreakdown } from "@/lib/data";
import { MatchBadge } from "./MatchBadge";
import { Button } from "./Primitives";

export function availabilitySummary(worker: WorkerProfile) {
  return DAYS.filter((d) => (worker.availability[d.key] ?? []).length > 0).map((d) => {
    const slots = worker.availability[d.key] ?? [];
    return `${d.long} ${slots.map((s) => SLOTS.find((x) => x.key === s)?.label).join(", ")}`;
  });
}

export function CandidateCard({
  worker,
  match,
  distanceKm,
  onInvite,
  invited,
}: {
  worker: WorkerProfile;
  match: MatchBreakdown;
  distanceKm: number;
  onInvite?: () => void;
  invited?: boolean;
}) {
  const availability = availabilitySummary(worker).slice(0, 2);
  return (
    <div className="rounded-3xl bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-mint text-lg font-bold text-mint-foreground">
            {worker.name.slice(0, 1)}
          </div>
          <div>
            <h3 className="text-lg font-bold leading-tight text-foreground">{worker.name}</h3>
            <p className="text-sm text-muted-foreground">{distanceKm} km away</p>
          </div>
        </div>
        <MatchBadge score={match.score} />
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available</dt>
          <dd className="font-medium text-foreground">{availability.join(" · ") || "Flexible"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Languages</dt>
          <dd className="font-medium text-foreground">{worker.languages.join(", ")}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Experience</dt>
          <dd className="font-medium text-foreground">
            {worker.experience.map((e) => e.summary).join(", ") || "No experience yet"}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {worker.interests.map((i) => (
          <span key={i} className="rounded-full bg-mint px-2.5 py-1 text-xs font-semibold text-mint-foreground">
            {i}
          </span>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Link to={`/business/candidates/${worker.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            View profile
          </Button>
        </Link>
        <Button
          variant={invited ? "soft" : "accent"}
          size="sm"
          className="flex-1"
          disabled={invited}
          onClick={onInvite}
        >
          {invited ? "Invited" : "Invite"}
        </Button>
      </div>
    </div>
  );
}
