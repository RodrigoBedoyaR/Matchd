import type { TextareaHTMLAttributes } from "react";
import { Textarea } from "@/components/Primitives";
import { cn } from "@/lib/utils";

// Textarea with a live "120/500" counter that turns accent near the limit.
export function CountedTextarea({
  value,
  max,
  className,
  ...props
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "maxLength"> & { value: string; max: number }) {
  const nearLimit = value.length >= max * 0.9;
  return (
    <div>
      <Textarea value={value} maxLength={max} className={cn("min-h-28 resize-y", className)} {...props} />
      <p
        className={cn("mt-1 text-right text-xs", nearLimit ? "font-semibold text-accent" : "text-muted-foreground")}
        aria-live="polite"
      >
        {value.length}/{max}
      </p>
    </div>
  );
}
