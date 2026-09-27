import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Star } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { Card, Chip, Input } from "@/components/Primitives";
import { JobCard } from "@/components/JobCard";
import { workerApi } from "@/lib/api";
import { CATEGORIES, type Category, type Job } from "@/lib/data";
import { cn } from "@/lib/utils";

type SortMode = "match" | "pay" | "distance";
type DistanceFilter = "5" | "15" | "30" | "any";

export default function WorkerMatches() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("match");
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>("any");
  const [categoryFilter, setCategoryFilter] = useState<Category[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);

  const queryClient = useQueryClient();

  const matchesQuery = useQuery({ queryKey: ["worker", "matches"], queryFn: workerApi.matches });
  const favoritesQuery = useQuery({ queryKey: ["worker", "favoriteJobs"], queryFn: workerApi.favoriteJobs });

  const favoriteIds = useMemo(() => new Set(favoritesQuery.data?.jobIds ?? []), [favoritesQuery.data]);

  const toggleFavorite = useMutation({
    mutationFn: (jobId: string) => workerApi.toggleFavoriteJob(jobId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["worker", "favoriteJobs"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't update favorite"),
  });

  function toggleCategory(cat: Category) {
    setCategoryFilter((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  const allJobs = matchesQuery.data?.jobs ?? [];

  const jobs = useMemo(() => {
    let list: Job[] = allJobs;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((j) => j.title.toLowerCase().includes(q) || j.business?.name.toLowerCase().includes(q));
    }
    if (distanceFilter !== "any") {
      const max = Number(distanceFilter);
      list = list.filter((j) => (j.distanceKm ?? Infinity) <= max);
    }
    if (categoryFilter.length > 0) {
      list = list.filter((j) => categoryFilter.includes(j.category));
    }
    if (savedOnly) {
      list = list.filter((j) => favoriteIds.has(j.id));
    }

    const sorted = [...list];
    if (sort === "match") sorted.sort((a, b) => (b.match?.score ?? 0) - (a.match?.score ?? 0));
    if (sort === "pay") sorted.sort((a, b) => b.hourlyPay - a.hourlyPay);
    if (sort === "distance") sorted.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    return sorted;
  }, [allJobs, search, distanceFilter, categoryFilter, savedOnly, favoriteIds, sort]);

  return (
    <Shell role="worker" title="Jobs that fit you" subtitle="Ranked by how well they match your profile.">
      <div className="mb-5 grid grid-cols-2 gap-3 sm:max-w-sm">
        <Card className="p-4 text-center">
          <p className="text-2xl font-extrabold text-primary">{allJobs.length}</p>
          <p className="text-xs font-semibold text-muted-foreground">jobs match you</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-extrabold text-accent">{favoriteIds.size}</p>
          <p className="text-xs font-semibold text-muted-foreground">saved</p>
        </Card>
      </div>

      <Card className="mb-5 space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title or business"
            className="pl-11"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sort by</p>
          <div className="flex flex-wrap gap-2">
            <Chip type="button" selected={sort === "match"} onClick={() => setSort("match")}>
              Best match
            </Chip>
            <Chip type="button" selected={sort === "pay"} onClick={() => setSort("pay")}>
              Highest pay
            </Chip>
            <Chip type="button" selected={sort === "distance"} onClick={() => setSort("distance")}>
              Nearest
            </Chip>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Max distance</p>
          <div className="flex flex-wrap gap-2">
            {(["5", "15", "30", "any"] as DistanceFilter[]).map((d) => (
              <Chip key={d} type="button" selected={distanceFilter === d} onClick={() => setDistanceFilter(d)}>
                {d === "any" ? "Any distance" : `≤ ${d} km`}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Chip key={cat} type="button" selected={categoryFilter.includes(cat)} onClick={() => toggleCategory(cat)}>
                {cat}
              </Chip>
            ))}
          </div>
        </div>

        <Chip type="button" selected={savedOnly} onClick={() => setSavedOnly((s) => !s)}>
          <Star className={cn("mr-1 inline size-3.5", savedOnly && "fill-current")} />
          Saved only
        </Chip>
      </Card>

      {matchesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading jobs…</p>
      ) : jobs.length === 0 ? (
        <Card className="py-10 text-center text-sm text-muted-foreground">
          No jobs match your filters right now. Try widening your search.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {jobs.map((job) => {
            const favorited = favoriteIds.has(job.id);
            return (
              <div key={job.id} className="relative">
                <button
                  type="button"
                  aria-label={favorited ? "Remove from saved" : "Save job"}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFavorite.mutate(job.id);
                  }}
                  className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-card/90 shadow-soft transition-colors hover:bg-mint"
                >
                  <Star className={cn("size-4", favorited ? "fill-accent text-accent" : "text-muted-foreground")} />
                </button>
                <JobCard job={job} />
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
