import { useParams, useSearchParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { businessApi } from "@/lib/api";
import { DAYS, SLOTS } from "@/lib/data";
import { Shell } from "@/components/Shell";
import { Button, Card, SectionTitle } from "@/components/Primitives";
import { MatchBadge, MatchBar } from "@/components/MatchBadge";

export default function CandidateDetail() {
  const { workerId } = useParams<{ workerId: string }>();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId") ?? undefined;
  const queryClient = useQueryClient();

  const candidateQuery = useQuery({
    queryKey: ["business", "candidate", workerId, jobId],
    queryFn: () => businessApi.candidateDetail(workerId as string, jobId),
    enabled: !!workerId,
  });

  const invitationsQuery = useQuery({
    queryKey: ["business", "invitations"],
    queryFn: businessApi.invitations,
  });

  const alreadyInvited = (invitationsQuery.data?.invitations ?? []).some(
    (inv) => inv.workerId === workerId && inv.jobId === jobId,
  );

  const invite = useMutation({
    mutationFn: () => businessApi.invite(workerId as string, jobId as string),
    onSuccess: () => {
      toast.success("Invitation sent");
      queryClient.invalidateQueries({ queryKey: ["business", "invitations"] });
    },
    onError: () => toast.error("Could not send invitation"),
  });

  const worker = candidateQuery.data?.worker;
  const distanceKm = candidateQuery.data?.distanceKm;
  const match = candidateQuery.data?.match;

  return (
    <Shell role="business" title="Candidate profile" subtitle="Full availability, skills, and match details.">
      {candidateQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !worker ? (
        <Card>
          <p className="text-sm text-muted-foreground">This candidate couldn't be found.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-full bg-mint text-2xl font-bold text-mint-foreground">
                  {worker.name.slice(0, 1)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{worker.name}</h2>
                  {typeof distanceKm === "number" && (
                    <p className="text-sm text-muted-foreground">{distanceKm} km away</p>
                  )}
                </div>
              </div>
              {match && <MatchBadge score={match.score} />}
            </div>
            {match && (
              <div className="mt-4">
                <MatchBar score={match.score} />
              </div>
            )}

            <div className="mt-5">
              {jobId ? (
                <Button
                  variant={alreadyInvited ? "soft" : "accent"}
                  disabled={alreadyInvited || invite.isPending}
                  onClick={() => invite.mutate()}
                >
                  {alreadyInvited ? "Invited" : "Invite"}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Pick a job from the{" "}
                  <Link to="/business/candidates" className="font-semibold text-primary underline">
                    candidates list
                  </Link>{" "}
                  to invite this candidate.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <SectionTitle>Availability</SectionTitle>
            <div className="space-y-2">
              {DAYS.map((d) => {
                const slots = worker.availability[d.key] ?? [];
                return (
                  <div key={d.key} className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">{d.long}</span>
                    <span className="text-muted-foreground">
                      {slots.length
                        ? slots.map((s) => SLOTS.find((x) => x.key === s)?.label).join(", ")
                        : "Not available"}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionTitle>Languages</SectionTitle>
            <p className="text-sm font-medium text-foreground">{worker.languages.join(", ") || "—"}</p>
          </Card>

          <Card>
            <SectionTitle>Experience</SectionTitle>
            {worker.experience.length ? (
              <ul className="space-y-1.5 text-sm text-foreground">
                {worker.experience.map((e, i) => (
                  <li key={i}>
                    <span className="font-semibold">{e.category}:</span> {e.summary}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No experience listed.</p>
            )}
          </Card>

          <Card>
            <SectionTitle>Interests</SectionTitle>
            <div className="flex flex-wrap gap-1.5">
              {worker.interests.map((i) => (
                <span key={i} className="rounded-full bg-mint px-2.5 py-1 text-xs font-semibold text-mint-foreground">
                  {i}
                </span>
              ))}
            </div>
          </Card>

          {worker.bio && (
            <Card>
              <SectionTitle>Bio</SectionTitle>
              <p className="text-sm text-foreground">{worker.bio}</p>
            </Card>
          )}

          <Card>
            <SectionTitle>Driving licence</SectionTitle>
            <p className="text-sm text-foreground">{worker.drivingLicence ? "Yes" : "No"}</p>
          </Card>
        </div>
      )}
    </Shell>
  );
}
