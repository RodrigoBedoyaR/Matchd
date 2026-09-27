import { Clock, MapPin } from "lucide-react";
import { Card } from "@/components/Primitives";
import { MatchBadge } from "@/components/MatchBadge";
import { formatPay, type Job } from "@/lib/data";
import { jobScheduleLine } from "./fit";

// Compact job header used at the top of the apply flow.
export function JobSummaryCard({ job }: { job: Job }) {
  return (
    <Card className="mb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-foreground">{job.title}</p>
          <p className="text-sm text-muted-foreground">
            {job.business?.emoji} {job.business?.name}
          </p>
        </div>
        {job.match ? <MatchBadge score={job.match.score} size="sm" /> : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-mint px-3 py-1 font-bold text-mint-foreground">
          {formatPay(job.hourlyPay)}/hr
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-foreground">
          <Clock className="size-3.5 text-muted-foreground" /> {jobScheduleLine(job)}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-foreground">
          <MapPin className="size-3.5 text-muted-foreground" /> {job.area}
          {job.distanceKm != null ? ` · ${job.distanceKm} km` : ""}
        </span>
      </div>
    </Card>
  );
}
