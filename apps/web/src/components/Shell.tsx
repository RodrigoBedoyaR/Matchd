import { Link, useLocation } from "react-router-dom";
import { Home, Sparkles, ClipboardList, User, LayoutDashboard, Briefcase, Users, Store } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/data";
import { AccountMenu } from "@/components/account/AccountMenu";

type NavItem = { to: string; label: string; icon: typeof Home };

const workerNav: NavItem[] = [
  { to: "/worker/matches", label: "Matches", icon: Sparkles },
  { to: "/worker/applications", label: "Applications", icon: ClipboardList },
  { to: "/worker/profile", label: "Profile", icon: User },
];

const businessNav: NavItem[] = [
  { to: "/business/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/business/jobs", label: "Jobs", icon: Briefcase },
  { to: "/business/candidates", label: "Candidates", icon: Users },
  { to: "/business/applications", label: "Applications", icon: ClipboardList },
  { to: "/business/profile", label: "Business", icon: Store },
];

export function Shell({
  role,
  title,
  subtitle,
  children,
  action,
}: {
  role: "worker" | "business";
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const nav = role === "worker" ? workerNav : businessNav;
  const homeTo = role === "worker" ? "/worker/matches" : "/business/dashboard";
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-10">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to={homeTo} className="text-lg font-extrabold tracking-tight text-primary">
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                    pathname === item.to ? "bg-mint text-mint-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <AccountMenu role={role} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-1 max-w-xl text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {action}
        </div>
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <div className="flex items-stretch">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold",
                  active ? "text-accent" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
