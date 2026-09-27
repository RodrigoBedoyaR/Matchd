import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { businessApi } from "@/lib/api";
import type { Application, WorkerProfile } from "@/lib/data";
import { Shell } from "@/components/Shell";
import { Button, Card, SectionTitle } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";

type ApplicationWithWorker = Application & { worker?: WorkerProfile };

export default function BusinessDashboard() {
  const jobsQuery = useQuery({ queryKey: ["business", "jobs"], queryFn: businessApi.jobs });
  const applicationsQuery = useQuery({ queryKey: ["business", "applications"], queryFn: businessApi.applications });
  const invitationsQuery = useQuery({ queryKey: ["business", "invitations"], queryFn: businessApi.invitations });

  const jobs = jobsQuery.data?.jobs ?? [];
  const applications = (applicationsQuery.data?.applications ?? []) as ApplicationWithWorker[];
  const invitations = invitationsQuery.data?.invitations ?? [];

  const activeJobs = jobs.filter((j) => j.active).length;
  const inInterview =
    applications.filter((a) => a.status === "Interview").length +
    invitations.filter((i) => i.status === "Interview").length;

  const activity = [
    ...applications.map((a) => ({
      id: `app-${a.id}`,
      createdAt: a.createdAt,
      status: a.status,
      workerName: a.worker?.name ?? "Candidate",
      jobTitle: a.job?.title ?? "—",
      kind: "Application" as const,
    })),
    ...invitations.map((i) => ({
      id: `inv-${i.id}`,
      createdAt: i.createdAt,
      status: i.status,
      workerName: i.worker?.name ?? "Candidate",
      jobTitle: i.job?.title ?? "—",
      kind: "Invitation" as const,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return (
    <Shell role="business" title="Dashboard">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active jobs</p>
          <p className="mt-1 text-3xl font-extrabold text-foreground">{activeJobs}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Applications</p>
          <p className="mt-1 text-3xl font-extrabold text-foreground">{applications.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invitations</p>
          <p className="mt-1 text-3xl font-extrabold text-foreground">{invitations.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">In interview</p>
          <p className="mt-1 text-3xl font-extrabold text-foreground">{inInterview}</p>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/business/jobs">
          <Button variant="outline" size="sm">
            Manage jobs
          </Button>
        </Link>
        <Link to="/business/candidates">
          <Button variant="outline" size="sm">
            Browse candidates
          </Button>
        </Link>
        <Link to="/business/applications">
          <Button variant="outline" size="sm">
            Applications & invitations
          </Button>
        </Link>
      </div>

      <div className="mt-8">
        <SectionTitle>Recent activity</SectionTitle>
        {activity.length === 0 ? (
          <Card>
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {activity.map((item) => (
              <Card key={item.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {item.workerName} · {item.jobTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.kind}</p>
                </div>
                <StatusBadge status={item.status} />
              </Card>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
