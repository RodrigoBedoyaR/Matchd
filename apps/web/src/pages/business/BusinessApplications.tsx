import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { businessApi } from "@/lib/api";
import type { ApplicationStatus, InvitationStatus } from "@/lib/data";
import { Shell } from "@/components/Shell";
import { Button, Card } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { ApplicationCard } from "@/components/business/ApplicationCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const APPLICATION_ACTIONS: ApplicationStatus[] = ["Viewed", "Responded", "Interview", "Hired", "Closed"];
const INVITATION_ACTIONS: InvitationStatus[] = ["Viewed", "Interview", "Hired", "Closed"];

export default function BusinessApplications() {
  const queryClient = useQueryClient();

  const applicationsQuery = useQuery({ queryKey: ["business", "applications"], queryFn: businessApi.applications });
  const invitationsQuery = useQuery({ queryKey: ["business", "invitations"], queryFn: businessApi.invitations });

  const updateApplication = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
      businessApi.updateApplicationStatus(id, status),
    onSuccess: () => {
      toast.success("Application updated");
      queryClient.invalidateQueries({ queryKey: ["business", "applications"] });
    },
    onError: () => toast.error("Could not update application"),
  });

  const updateInvitation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: InvitationStatus }) =>
      businessApi.updateInvitationStatus(id, status),
    onSuccess: () => {
      toast.success("Invitation updated");
      queryClient.invalidateQueries({ queryKey: ["business", "invitations"] });
    },
    onError: () => toast.error("Could not update invitation"),
  });

  const applications = applicationsQuery.data?.applications ?? [];
  const invitations = invitationsQuery.data?.invitations ?? [];

  return (
    <Shell role="business" title="Applications & invitations">
      <Tabs defaultValue="applications">
        <TabsList>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          {applicationsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : applications.length === 0 ? (
            <Card>
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {applications.map((a) => (
                <ApplicationCard
                  key={a.id}
                  application={a}
                  actions={APPLICATION_ACTIONS}
                  busy={updateApplication.isPending}
                  onStatusChange={(status) => updateApplication.mutate({ id: a.id, status })}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invitations">
          {invitationsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : invitations.length === 0 ? (
            <Card>
              <p className="text-sm text-muted-foreground">No invitations yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv) => (
                <Card key={inv.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{inv.worker?.name ?? "Candidate"}</p>
                    <p className="text-xs text-muted-foreground">{inv.job?.title ?? "—"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={inv.status} />
                    {INVITATION_ACTIONS.filter((s) => s !== inv.status).map((s) => (
                      <Button
                        key={s}
                        variant="outline"
                        size="sm"
                        disabled={updateInvitation.isPending}
                        onClick={() => updateInvitation.mutate({ id: inv.id, status: s })}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Shell>
  );
}
