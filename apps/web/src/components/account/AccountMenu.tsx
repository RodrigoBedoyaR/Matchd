import { useNavigate } from "react-router-dom";
import { LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initialsFor(label: string) {
  const base = label.includes("@") ? label.split("@")[0] : label;
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : base.slice(0, 2);
  return letters.toUpperCase();
}

// Avatar button in the Shell header: who you're signed in as + profile/settings/log out.
export function AccountMenu({ role }: { role: "worker" | "business" }) {
  const navigate = useNavigate();
  const { user, worker, business, logout } = useAuth();
  const name = (role === "worker" ? worker?.name : business?.name) ?? "";
  const email = user?.email ?? "";
  const label = name || email || "?";

  function handleLogout() {
    // Leave the protected route first, or its guard redirects to /login.
    navigate("/", { replace: true });
    logout();
  }

  const itemClass = "cursor-pointer rounded-xl px-3 py-2 font-medium focus:bg-mint focus:text-mint-foreground";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mint text-sm font-bold text-mint-foreground outline-none ring-offset-2 ring-offset-background transition-shadow hover:ring-2 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Account menu"
      >
        {initialsFor(label)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-2xl border-border p-1.5 shadow-soft">
        <DropdownMenuLabel className="px-3 py-2 font-normal">
          {name ? <p className="truncate text-sm font-bold text-foreground">{name}</p> : null}
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={itemClass} onSelect={() => navigate(`/${role}/profile`)}>
          <User /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass} onSelect={() => navigate(`/${role}/settings`)}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className={itemClass} onSelect={handleLogout}>
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
