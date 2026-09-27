import { cn } from "@/lib/utils";
import type {
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft",
  accent: "bg-accent text-accent-foreground hover:brightness-105 shadow-soft",
  soft: "bg-mint text-mint-foreground hover:bg-mint/70",
  outline: "border border-border bg-card text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
};

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-12 px-5 text-[0.95rem]",
  lg: "h-14 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}) {
  return <button className={cn(buttonBase, variants[variant], sizes[size], className)} {...props} />;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-3xl bg-card p-5 shadow-soft", className)}>{children}</div>;
}

export function Chip({
  selected,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
        selected
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-card text-foreground hover:border-primary/40",
        className,
      )}
      {...props}
    />
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {hint ? <span className="ml-2 text-xs text-muted-foreground">{hint}</span> : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-border bg-card px-4 text-base outline-none placeholder:text-muted-foreground focus:border-primary",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-2xl border border-border bg-card p-4 text-base outline-none placeholder:text-muted-foreground focus:border-primary",
        className,
      )}
      {...props}
    />
  );
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-bold tracking-tight text-foreground">{children}</h2>
      {sub ? <p className="mt-0.5 text-sm text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
