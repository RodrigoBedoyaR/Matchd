import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { APP_NAME } from "@/lib/data";

// Centered single-card layout shared by the log-in / sign-up / password pages.
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-6 block text-center text-xl font-extrabold tracking-tight text-primary">
          {APP_NAME}
        </Link>
        {children}
      </div>
    </div>
  );
}
