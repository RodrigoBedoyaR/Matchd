import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Action bar that sticks to the bottom of the screen on mobile, sitting just
// above Shell's fixed bottom nav (md:hidden, ~64px => bottom-16), and falls
// back to a normal inline block on desktop. Renders a spacer so the fixed bar
// never covers the last bit of page content on mobile.
export function StickyActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <>
      <div className="h-20 md:hidden" aria-hidden />
      <div
        className={cn(
          "fixed inset-x-0 bottom-16 z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur",
          "md:static md:mt-6 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none",
        )}
      >
        <div className={cn("mx-auto flex max-w-5xl items-center gap-3", className)}>{children}</div>
      </div>
    </>
  );
}
