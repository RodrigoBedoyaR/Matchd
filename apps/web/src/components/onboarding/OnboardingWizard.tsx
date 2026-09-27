import type { FormEvent, ReactNode } from "react";
import { APP_NAME } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/Primitives";
import { Progress } from "@/components/ui/progress";

/**
 * Shared chrome for the step-by-step onboarding flows (worker + business).
 * The whole wizard is one <form>, so pressing Enter triggers the primary
 * action (Continue / Finish) for the current step.
 */
export function OnboardingWizard({
  step,
  total,
  title,
  sub,
  intro,
  onSubmit,
  footer,
  children,
}: {
  /** 1-based index of the current step */
  step: number;
  total: number;
  title: string;
  sub?: string;
  /** Optional line shown above the step title (e.g. a welcome message) */
  intro?: ReactNode;
  onSubmit: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <div className="min-h-screen bg-background">
      <form onSubmit={handleSubmit} className="mx-auto flex min-h-screen max-w-2xl flex-col px-4">
        <StepperHeader step={step} total={total} />

        <div className="flex-1 space-y-5 py-6">
          {intro ? (
            <p className="rounded-2xl bg-mint px-4 py-3 text-sm font-medium text-mint-foreground">{intro}</p>
          ) : null}
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
            {sub ? <p className="mt-1 text-sm text-muted-foreground">{sub}</p> : null}
          </div>
          {children}
        </div>

        {/* Sticky on mobile so the actions are always in thumb reach; inline on larger screens */}
        <div
          className={cn(
            "sticky bottom-0 -mx-4 border-t border-border/60 bg-background/95 px-4 pt-3 backdrop-blur",
            "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
            "sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-10 sm:pt-0 sm:backdrop-blur-none",
          )}
        >
          {footer}
        </div>
      </form>
    </div>
  );
}

export function StepperHeader({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <header className="space-y-3 pt-5">
      <div className="flex items-center justify-between">
        <p className="text-lg font-extrabold tracking-tight text-primary">{APP_NAME}</p>
        <p className="text-xs font-semibold text-muted-foreground" aria-live="polite">
          Step {step} of {total}
        </p>
      </div>
      <Progress value={pct} className="h-2 bg-mint" aria-label={`Step ${step} of ${total}`} />
    </header>
  );
}

/**
 * Back / Continue footer. `secondary` renders an extra action (e.g. "Skip & finish")
 * between Back and the primary button.
 */
export function StepFooter({
  onBack,
  primaryLabel,
  busy,
  busyLabel = "Saving…",
  secondary,
}: {
  onBack?: () => void;
  primaryLabel: string;
  busy?: boolean;
  busyLabel?: string;
  secondary?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex items-center gap-2">
      {onBack ? (
        <Button type="button" variant="ghost" onClick={onBack} disabled={busy}>
          Back
        </Button>
      ) : null}
      <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:flex-none">
        {secondary ? (
          <Button type="button" variant="outline" onClick={secondary.onClick} disabled={busy}>
            {secondary.label}
          </Button>
        ) : null}
        <Button type="submit" className="flex-1 sm:min-w-40 sm:flex-none" disabled={busy}>
          {busy ? busyLabel : primaryLabel}
        </Button>
      </div>
    </div>
  );
}

/** Small inline error shown under a step's fields when validation fails */
export function StepError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm font-medium text-destructive">
      {children}
    </p>
  );
}
