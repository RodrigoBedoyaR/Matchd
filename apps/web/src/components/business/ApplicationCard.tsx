import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import type { Application, ApplicationStatus } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button, Card } from "@/components/Primitives";
import { StatusBadge } from "@/components/StatusBadge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Past this much free text (note + answers) the card starts collapsed.
const COLLAPSE_AFTER_CHARS = 220;

function formatAppliedDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/**
 * Popover rather than a tooltip so it can be opened with a tap on mobile.
 */
function ScheduleGapBadge() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-foreground"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-accent" />
          Schedule gap confirmed
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 rounded-2xl text-sm">
        This candidate's availability didn't fully match the shift times, but they confirmed they can work them.
      </PopoverContent>
    </Popover>
  );
}

export function ApplicationCard({
  application: a,
  actions,
  busy,
  onStatusChange,
}: {
  application: Application;
  actions: ApplicationStatus[];
  busy: boolean;
  onStatusChange: (status: ApplicationStatus) => void;
}) {
  const note = a.note?.trim();
  const answers = a.answers ?? [];
  const contentLength = (note?.length ?? 0) + answers.reduce((n, qa) => n + qa.question.length + qa.answer.length, 0);
  const collapsible = contentLength > COLLAPSE_AFTER_CHARS;
  const [expanded, setExpanded] = useState(false);
  const collapsed = collapsible && !expanded;
  const applied = formatAppliedDate(a.createdAt);
  const name = a.worker?.name ?? "Candidate";

  return (
    <Card className="space-y-4">
      {/* Who / which job / when */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/business/candidates/${a.workerId}?jobId=${a.jobId}`}
            className="text-sm font-bold text-foreground underline-offset-2 hover:text-primary hover:underline"
          >
            {name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {a.job?.title ?? "—"}
            {applied ? ` · Applied ${applied}` : ""}
          </p>
        </div>
        <StatusBadge status={a.status} />
      </div>

      {a.confirmedScheduleGaps && <ScheduleGapBadge />}

      {note && (
        <blockquote
          className={cn(
            "whitespace-pre-line border-l-4 border-mint pl-3 text-sm italic text-foreground",
            collapsed && "line-clamp-3",
          )}
        >
          “{note}”
        </blockquote>
      )}

      {answers.length > 0 && (
        <dl className="space-y-2 rounded-2xl bg-muted/60 p-3">
          {answers.map((qa, i) => (
            <div key={i}>
              <dt className="text-xs font-semibold text-muted-foreground">{qa.question}</dt>
              <dd className={cn("whitespace-pre-line text-sm text-foreground", collapsed && "line-clamp-2")}>
                {qa.answer || <span className="text-muted-foreground">No answer</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      {/* Status actions sit below the content so the card reads top-down on mobile. */}
      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        {actions
          .filter((s) => s !== a.status)
          .map((s) => (
            <Button key={s} variant="outline" size="sm" disabled={busy} onClick={() => onStatusChange(s)}>
              {s}
            </Button>
          ))}
      </div>
    </Card>
  );
}
