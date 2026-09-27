import { Link } from "react-router-dom";
import { MapPin, Clock, Languages } from "lucide-react";
import { formatDays, formatPay, formatLanguages, type Job } from "@/lib/data";
import { MatchBadge } from "./MatchBadge";

export function JobCard({ job }: { job: Job }) {
  return (
    <Link
      to={`/worker/jobs/${job.id}`}
      className="block rounded-3xl bg-card p-5 shadow-soft transition-shadow hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold leading-tight text-foreground">{job.title}</h3>
          <p className="text-sm text-muted-foreground">
            {job.business?.emoji} {job.business?.name}
          </p>
        </div>
        {job.match ? <MatchBadge score={job.match.score} /> : null}
      </div>

      <p className="mt-4 text-2xl font-extrabold text-primary">
        {formatPay(job.hourlyPay)}
        <span className="text-base font-semibold text-muted-foreground">/hour</span>
      </p>

      <div className="mt-3 space-y-1.5 text-sm text-foreground">
        <p className="flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          <span className="font-semibold">{formatDays(job.days)}</span>
          <span className="text-muted-foreground">
            {job.startTime}–{job.endTime}
          </span>
        </p>
        <p className="flex items-center gap-2">
          <MapPin className="size-4 text-primary" />
          <span className="font-semibold">{job.area}</span>
          <span className="text-muted-foreground">{job.distanceKm} km away</span>
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Languages className="size-4 text-primary" />
          {formatLanguages(job.requiredLanguages)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold text-mint-foreground">
          {job.category}
        </span>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {job.experienceLevel}
        </span>
        <span className="ml-auto text-sm font-bold text-accent">View job →</span>
      </div>
    </Link>
  );
}
