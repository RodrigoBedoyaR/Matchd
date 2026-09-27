import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, ShieldAlert } from "lucide-react";
import { authApi, ApiError } from "@/lib/api";
import { DEMO_EMAILS, useAuth } from "@/context/AuthContext";
import { Shell } from "@/components/Shell";
import { Button, Card, Field, Input, SectionTitle } from "@/components/Primitives";
import { PasswordInput } from "@/components/account/PasswordInput";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function errorText(err: unknown) {
  return err instanceof ApiError ? err.message : "Something went wrong. Try again.";
}

export default function AccountSettings({ role }: { role: "worker" | "business" }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  // Demo accounts are shared by everyone trying the prototype, so the API refuses changes.
  const isDemo = !!user && DEMO_EMAILS.includes(user.email.toLowerCase());

  function handleLogout() {
    // Leave the protected route first, or its guard redirects to /login.
    navigate("/", { replace: true });
    logout();
  }

  return (
    <Shell role={role} title="Settings" subtitle="Manage your login details and account.">
      <div className="max-w-2xl space-y-4">
        {isDemo ? (
          <div className="flex items-start gap-3 rounded-3xl bg-mint p-4 text-sm text-mint-foreground">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <p>
              You're using a shared demo account, so the email, password and account can't be changed here. Sign up
              for your own account to try these.
            </p>
          </div>
        ) : null}

        <Card>
          <SectionTitle>Account</SectionTitle>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="mt-0.5 break-all font-semibold text-foreground">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Account type</dt>
              <dd className="mt-0.5 font-semibold text-foreground">
                {user?.role === "BUSINESS" ? "Business (hiring)" : "Worker (finding work)"}
              </dd>
            </div>
          </dl>
        </Card>

        <ChangeEmailCard disabled={isDemo} />
        <ChangePasswordCard disabled={isDemo} />

        <Card>
          <SectionTitle sub="You'll need your email and password to get back in.">Log out</SectionTitle>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="size-4" /> Log out
          </Button>
        </Card>

        <DeleteAccountCard disabled={isDemo} onDeleted={handleLogout} />
      </div>
    </Shell>
  );
}

function ChangeEmailCard({ disabled }: { disabled: boolean }) {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authApi.changeEmail(email, password);
      setUser(res.user);
      setEmail("");
      setPassword("");
      toast.success("Email updated.");
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <SectionTitle sub="We'll use this for logging in and account emails.">Change email</SectionTitle>
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset disabled={disabled} className="space-y-4 disabled:opacity-60">
          <Field label="New email">
            <Input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Current password" hint="to confirm it's you">
            <PasswordInput
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        </fieldset>
        <Button type="submit" disabled={disabled || submitting}>
          Update email
        </Button>
      </form>
    </Card>
  );
}

function ChangePasswordCard({ disabled }: { disabled: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const mismatch = confirm.length > 0 && next !== confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) return toast.error("Use at least 8 characters.");
    if (next !== confirm) return toast.error("The new passwords don't match.");
    setSubmitting(true);
    try {
      await authApi.changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Password updated.");
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <SectionTitle>Change password</SectionTitle>
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset disabled={disabled} className="space-y-4 disabled:opacity-60">
          <Field label="Current password">
            <PasswordInput
              required
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
          <Field label="New password">
            <PasswordInput
              required
              minLength={8}
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder="At least 8 characters"
            />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>
          {mismatch ? <p className="text-sm font-medium text-destructive">The new passwords don't match.</p> : null}
        </fieldset>
        <Button type="submit" disabled={disabled || submitting || mismatch}>
          Update password
        </Button>
      </form>
    </Card>
  );
}

function DeleteAccountCard({ disabled, onDeleted }: { disabled: boolean; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await authApi.deleteAccount(password);
      toast.success("Your account has been deleted.");
      onDeleted();
    } catch (err) {
      toast.error(errorText(err));
      setSubmitting(false);
    }
  }

  return (
    <Card className="border border-destructive/30">
      <SectionTitle sub="Permanently delete your account, profile and applications. This can't be undone.">
        Danger zone
      </SectionTitle>
      <Button
        variant="outline"
        className="border-destructive/40 text-destructive hover:bg-destructive/10"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Delete account
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setPassword("");
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-3xl border-border bg-card sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">Delete your account?</DialogTitle>
            <DialogDescription>
              This removes your login, profile and everything linked to it. You can't undo this.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDelete} className="space-y-4">
            <Field label="Password" hint="to confirm it's you">
              <PasswordInput
                required
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={submitting || !password}
              >
                Delete my account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
