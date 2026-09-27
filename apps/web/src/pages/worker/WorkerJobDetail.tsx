import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Clock, MapPin, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { Card, SectionTitle, buttonBase } from "@/components/Primitives";
import { StickyActionBar } from "@/components/apply/StickyActionBar";
import { MatchBadge, MatchBar } from "@/components/MatchBadge";
import { workerApi } from "@/lib/api";
import { formatDays, formatPay } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function WorkerJobDetail() {
  const { jobId } = useParams<{ jobId: string }>();
  const queryClient = useQueryClient();

  const jobQuery = useQuery({
    queryKey: ["worker", "job", jobId],
    queryFn: () => workerApi.jobDetail(jobId!),
    enabled: !!jobId,
  });
  const applicationsQuery = useQuery({ queryKey: ["worker", "applications"], queryFn: workerApi.applications });
  const favoritesQuery = useQuery({ queryKey: ["worker", "favoriteJobs"], queryFn: workerApi.favoriteJobs });

  const existingApplication = useMemo(
    () => applicationsQuery.data?.applications.find((a) => a.jobId === jobId),
    [applicationsQuery.data, jobId],
  );
  const favorited = favoritesQuery.data?.jobIds.includes(jobId ?? "") ?? false;

  const toggleFavorite = useMutation({
    mutationFn: () => workerApi.toggleFavoriteJob(jobId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["worker", "favoriteJobs"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't update favorite"),
  });

  if (jobQuery.isLoading || !jobQuery.data) {
    return (
      <Shell role="worker" title="Loading…">
        <p className="text-sm text-muted-foreground">Loading job…</p>
      </Shell>
    );
  }

  const job = jobQuery.data.job;
  const questionCount = job.screeningQuestions.length;

  return (
    <Shell role="worker" title="Job details">
      <Link to="/worker/matches" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        <ArrowLeft className="size-4" /> Back to matches
      </Link>

      <Card className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{job.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {job.business?.emoji} {job.business?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {job.match ? <MatchBadge score={job.match.score} /> : null}
            <button
              type="button"
              aria-label={favorited ? "Remove from saved" : "Save job"}
              onClick={() => toggleFavorite.mutate()}
              className="flex size-10 items-center justify-center rounded-full bg-muted transition-colors hover:bg-mint"
            >
              <Star className={cn("size-4", favorited ? "fill-accent text-accent" : "text-muted-foreground")} />
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-mint p-4 text-mint-foreground">
            <p className="text-xs font-semibold uppercase tracking-wide">Pay</p>
            <p className="mt-1 text-xl font-extrabold">
              {formatPay(job.hourlyPay)}
              <span className="text-sm font-semibold">/hour</span>
            </p>
          </div>
          <div className="rounded-2xl bg-muted p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Clock className="size-3.5" /> Days & hours
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">{formatDays(job.days)}</p>
            <p className="text-sm text-muted-foreground">
              {job.startTime}–{job.endTime}
            </p>
          </div>
          <div className="rounded-2xl bg-muted p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <MapPin className="size-3.5" /> Area
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">{job.area}</p>
            <p className="text-sm text-muted-foreground">{job.distanceKm} km away</p>
          </div>
        </div>
      </Card>

      <Card className="mb-5">
        <SectionTitle>The job</SectionTitle>
        <p className="text-sm leading-relaxed text-foreground">{job.description}</p>
      </Card>

      {job.tasks.length > 0 && (
        <Card className="mb-5">
          <SectionTitle>What you'll do</SectionTitle>
          <ul className="space-y-2">
            {job.tasks.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {t}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {job.requirements.length > 0 && (
        <Card className="mb-5">
          <SectionTitle>What we're looking for</SectionTitle>
          <ul className="space-y-2">
            {job.requirements.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {r}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {job.offers.length > 0 && (
        <Card className="mb-5">
          <SectionTitle>What they offer</SectionTitle>
          <ul className="space-y-2">
            {job.offers.map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {o}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {job.match && (
        <Card className="mb-5">
          <SectionTitle>Your match</SectionTitle>
          <div className="mb-3 flex items-center gap-3">
            <MatchBar score={job.match.score} />
            <MatchBadge score={job.match.score} size="sm" />
          </div>
          <ul className="space-y-2">
            {job.match.reasons.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                {r.ok ? (
                  <Check className="size-4 shrink-0 text-primary" />
                ) : (
                  <X className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className={r.ok ? "text-foreground" : "text-muted-foreground"}>{r.label}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {job.active && !existingApplication && questionCount > 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          The business asks {questionCount} quick question{questionCount === 1 ? "" : "s"} when you apply.
        </p>
      ) : null}

      <StickyActionBar>
        {!job.active ? (
          <p className="w-full rounded-full bg-muted px-5 py-3 text-center text-sm font-semibold text-muted-foreground">
            No longer accepting applications
          </p>
        ) : existingApplication ? (
          <Link
            to={`/worker/applications?open=${existingApplication.id}`}
            className={cn(buttonBase, "h-14 w-full bg-mint px-6 text-base text-mint-foreground hover:bg-mint/70")}
          >
            <Check className="size-5" /> Applied · View application
          </Link>
        ) : (
          <Link
            to={`/worker/jobs/${job.id}/apply`}
            className={cn(buttonBase, "h-14 w-full bg-primary px-6 text-base text-primary-foreground shadow-soft")}
          >
            <span className="md:hidden">{formatPay(job.hourlyPay)}/hr ·</span> Apply
            <span className="hidden md:inline">now</span>
          </Link>
        )}
      </StickyActionBar>
    </Shell>
  );
}
