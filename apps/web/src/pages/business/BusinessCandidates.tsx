import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { businessApi, type CandidateResult } from "@/lib/api";
import { Shell } from "@/components/Shell";
import { Button, Card, Input } from "@/components/Primitives";
import { CandidateCard } from "@/components/CandidateCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SortMode = "match" | "experience" | "distance";

export default function BusinessCandidates() {
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  // Preselect the job when arriving from a job card ("View candidates").
  const [jobId, setJobId] = useState<string | null>(params.get("jobId"));
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("match");

  const jobsQuery = useQuery({ queryKey: ["business", "jobs"], queryFn: businessApi.jobs });
  const jobs = jobsQuery.data?.jobs ?? [];

  const effectiveJobId =
    jobId ?? (jobs.find((j) => j.active)?.id ?? jobs[0]?.id ?? null);

  const candidatesQuery = useQuery({
    queryKey: ["business", "candidates", effectiveJobId],
    queryFn: () => businessApi.candidates(effectiveJobId as string),
    enabled: !!effectiveJobId,
  });

  const favoritesQuery = useQuery({
    queryKey: ["business", "favorites"],
    queryFn: businessApi.favoriteCandidates,
  });

  const invitationsQuery = useQuery({
    queryKey: ["business", "invitations"],
    queryFn: businessApi.invitations,
  });

  const favoriteIds = new Set(favoritesQuery.data?.workerIds ?? []);
  const invitedWorkerIds = new Set(
    (invitationsQuery.data?.invitations ?? [])
      .filter((inv) => inv.jobId === effectiveJobId)
      .map((inv) => inv.workerId),
  );

  const toggleFavorite = useMutation({
    mutationFn: (workerId: string) => businessApi.toggleFavoriteCandidate(workerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["business", "favorites"] }),
  });

  const invite = useMutation({
    mutationFn: (workerId: string) => businessApi.invite(workerId, effectiveJobId as string),
    onSuccess: () => {
      toast.success("Invitation sent");
      queryClient.invalidateQueries({ queryKey: ["business", "invitations"] });
    },
    onError: () => toast.error("Could not send invitation"),
  });

  const candidates = candidatesQuery.data?.candidates ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = candidates;
    if (term) {
      list = list.filter(
        (c) =>
          c.worker.name.toLowerCase().includes(term) ||
          c.worker.languages.some((l) => l.toLowerCase().includes(term)),
      );
    }
    const sorted = [...list];
    if (sort === "match") sorted.sort((a, b) => b.match.score - a.match.score);
    else if (sort === "experience") sorted.sort((a, b) => b.worker.experience.length - a.worker.experience.length);
    else if (sort === "distance") sorted.sort((a, b) => a.distanceKm - b.distanceKm);
    return sorted;
  }, [candidates, search, sort]);

  if (!jobsQuery.isLoading && jobs.length === 0) {
    return (
      <Shell role="business" title="Matched candidates">
        <Card>
          <p className="text-sm text-muted-foreground">
            You haven't posted any jobs yet.{" "}
            <Link to="/business/jobs" className="font-semibold text-primary underline">
              Post your first shift
            </Link>{" "}
            to see matched candidates here.
          </p>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell role="business" title="Matched candidates" subtitle="Ranked by how well they fit the selected job.">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={effectiveJobId ?? undefined} onValueChange={(v) => setJobId(v)}>
          <SelectTrigger className="h-12 rounded-2xl sm:w-64">
            <SelectValue placeholder="Select a job" />
          </SelectTrigger>
          <SelectContent>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.title} {job.active ? "" : "(closed)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or language"
          className="sm:flex-1"
        />
        <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
          <SelectTrigger className="h-12 rounded-2xl sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="match">Best match</SelectItem>
            <SelectItem value="experience">Most experience</SelectItem>
            <SelectItem value="distance">Nearest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {candidatesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading candidates...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">No candidates match this job yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((c: CandidateResult) => (
            <div key={c.worker.id} className="relative">
              <button
                type="button"
                onClick={() => toggleFavorite.mutate(c.worker.id)}
                className={cn(
                  "absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-card/90 shadow-soft transition-colors",
                  favoriteIds.has(c.worker.id) ? "text-accent" : "text-muted-foreground hover:text-accent",
                )}
                aria-label="Toggle favorite"
              >
                <Star className="size-4" fill={favoriteIds.has(c.worker.id) ? "currentColor" : "none"} />
              </button>
              <CandidateCard
                worker={c.worker}
                match={c.match}
                distanceKm={c.distanceKm}
                invited={invitedWorkerIds.has(c.worker.id)}
                onInvite={() => invite.mutate(c.worker.id)}
              />
              {/* CandidateCard's own "View profile" link drops jobId; overlay a
                  same-sized link in its exact slot so clicking it keeps jobId,
                  while leaving the Invite button (second slot) clickable. */}
              <div className="pointer-events-none absolute inset-x-5 bottom-5 z-10 flex h-9 gap-2">
                <Link
                  to={`/business/candidates/${c.worker.id}?jobId=${effectiveJobId}`}
                  className="pointer-events-auto flex-1"
                  aria-label={`View ${c.worker.name}'s profile`}
                />
                <div className="flex-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
