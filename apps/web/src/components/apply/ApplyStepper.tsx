import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Segmented progress indicator for the apply flow: "Step 2 of 3 · Say hello".
export function ApplyStepper({ steps, current }: { steps: readonly string[]; current: number }) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Step {current + 1} of {steps.length} · <span className="text-foreground">{steps[current]}</span>
      </p>
      <ol className="flex items-center gap-1.5">
        {steps.map((label, i) => (
          <li key={label} className="flex-1" aria-current={i === current ? "step" : undefined}>
            <div
              className={cn(
                "h-1.5 rounded-full transition-colors",
                i < current ? "bg-primary" : i === current ? "bg-accent" : "bg-muted",
              )}
            />
            <span
              className={cn(
                "mt-1.5 hidden items-center gap-1 text-xs sm:flex",
                i === current ? "font-bold text-foreground" : "text-muted-foreground",
              )}
            >
              {i < current ? <Check className="size-3 text-primary" /> : null}
              {label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
