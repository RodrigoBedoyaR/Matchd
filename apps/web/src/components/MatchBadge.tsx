import { cn } from "@/lib/utils";

export function MatchBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const strong = score >= 85;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full font-bold",
        strong ? "bg-accent text-accent-foreground" : "bg-mint text-mint-foreground",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
      )}
    >
      {score}% match
    </span>
  );
}

export function MatchBar({ score }: { score: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn("h-full rounded-full", score >= 85 ? "bg-accent" : "bg-primary")}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}
