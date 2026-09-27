import { cn } from "@/lib/utils";
import { APPLICATION_STATUSES, type ApplicationStatus, type InvitationStatus } from "@/lib/data";

const tone: Record<string, string> = {
  Sent: "bg-muted text-muted-foreground",
  Viewed: "bg-mint text-mint-foreground",
  Responded: "bg-mint text-mint-foreground",
  Interview: "bg-accent text-accent-foreground",
  Hired: "bg-primary text-primary-foreground",
  Closed: "bg-muted text-muted-foreground line-through",
  Invited: "bg-mint text-mint-foreground",
  Accepted: "bg-primary text-primary-foreground",
  Declined: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: ApplicationStatus | InvitationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold",
        tone[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

export function StatusProgress({ status }: { status: ApplicationStatus }) {
  if (status === "Closed") {
    return <p className="text-xs text-muted-foreground">This vacancy was filled or withdrawn.</p>;
  }
  const steps = APPLICATION_STATUSES.slice(0, 5);
  const current = steps.indexOf(status);
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((s, i) => (
        <div key={s} className="flex-1">
          <div
            className={cn(
              "h-1.5 rounded-full",
              i <= current ? (i === current ? "bg-accent" : "bg-primary") : "bg-muted",
            )}
          />
          <span
            className={cn(
              "mt-1 block text-[10px]",
              i === current ? "font-bold text-foreground" : "text-muted-foreground",
            )}
          >
            {s}
          </span>
        </div>
      ))}
    </div>
  );
}
