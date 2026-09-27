import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { Button, Card } from "@/components/Primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, StatusProgress } from "@/components/StatusBadge";
import { ApplicationAnswers } from "@/components/apply/ApplicationAnswers";
import { formatAppliedDate, jobPayScheduleLine } from "@/components/apply/fit";
import { workerApi } from "@/lib/api";
import type { Application } from "@/lib/data";
import { cn } from "@/lib/utils";

export default function WorkerApplications() {
  const queryClient = useQueryClient();
  // ?open=<applicationId> (from job detail / apply flow) expands that card.
  const [searchParams] = useSearchParams();
  const openId = searchParams.get("open");

  const applicationsQuery = useQuery({ queryKey: ["worker", "applications"], queryFn: workerApi.applications });
  const invitationsQuery = useQuery({ queryKey: ["worker", "invitations"], queryFn: workerApi.invitations });

  const respond = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "Accepted" | "Declined" }) =>
      workerApi.respondToInvitation(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["worker", "invitations"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't respond"),
  });

  const applications = applicationsQuery.data?.applications ?? [];
  const invitations = invitationsQuery.data?.invitations ?? [];

  return (
    <Shell role="worker" title="My applications">
      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-3">
          {applications.length === 0 ? (
            <Card className="py-10 text-center text-sm text-muted-foreground">
              You haven't applied to any jobs yet.{" "}
              <Link to="/worker/matches" className="font-semibold text-primary">
                Browse jobs
              </Link>
            </Card>
          ) : (
            applications.map((app) => (
              <ApplicationCard key={app.id} application={app} defaultOpen={app.id === openId} />
            ))
          )}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-3">
          {invitations.length === 0 ? (
            <Card className="py-10 text-center text-sm text-muted-foreground">
              No invitations yet.{" "}
              <Link to="/worker/matches" className="font-semibold text-primary">
                Browse jobs
              </Link>
            </Card>
          ) : (
            invitations.map((inv) => {
              const canRespond = inv.status === "Invited" || inv.status === "Viewed";
              return (
                <Card key={inv.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-foreground">{inv.job?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {inv.job?.business?.emoji} {inv.job?.business?.name}
                      </p>
                    </div>
                    <StatusBadge status={inv.status} />
                  </div>
                  {canRespond && (
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => respond.mutate({ id: inv.id, status: "Accepted" })}
                        disabled={respond.isPending}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respond.mutate({ id: inv.id, status: "Declined" })}
                        disabled={respond.isPending}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </Shell>
  );
}

function ApplicationCard({ application: app, defaultOpen }: { application: Application; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (defaultOpen) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [defaultOpen]);

  return (
    <div ref={ref}>
      <Card className={cn(defaultOpen && "ring-2 ring-accent/40")}>
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/worker/jobs/${app.jobId}`} className="font-bold text-foreground hover:text-primary">
              {app.job?.title ?? "Job"}
            </Link>
            <p className="text-sm text-muted-foreground">
              {app.job?.business?.emoji} {app.job?.business?.name}
            </p>
          </div>
          <StatusBadge status={app.status} />
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Applied {formatAppliedDate(app.createdAt)}
          {app.job ? ` · ${jobPayScheduleLine(app.job)}` : ""}
        </p>
        <StatusProgress status={app.status} />

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            Your application
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
          <Link to={`/worker/jobs/${app.jobId}`} className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            View job
          </Link>
        </div>

        {open && (
          <div className="mt-3 rounded-2xl bg-muted/60 p-4">
            <ApplicationAnswers note={app.note} answers={app.answers ?? []} />
            {app.confirmedScheduleGaps ? (
              <p className="mt-4 text-xs text-muted-foreground">
                You confirmed you can work this job's hours, even though they didn't fully match your availability.
              </p>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
}
