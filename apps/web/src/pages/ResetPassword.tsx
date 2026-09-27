import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { authApi, ApiError } from "@/lib/api";
import { homeFor, useAuth } from "@/context/AuthContext";
import { Button, Card, Field } from "@/components/Primitives";
import { AuthLayout } from "@/components/account/AuthLayout";
import { PasswordInput } from "@/components/account/PasswordInput";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const { signInWithToken } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [invalidLink, setInvalidLink] = useState(!token);

  const mismatch = confirm.length > 0 && password !== confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (password.length < 8) return toast.error("Use at least 8 characters.");
    if (password !== confirm) return toast.error("The passwords don't match.");
    setSubmitting(true);
    try {
      const res = await authApi.resetPassword(token, password);
      await signInWithToken(res.token);
      toast.success("Password updated. You're logged in.");
      navigate(homeFor(res.user.role), { replace: true });
    } catch (err) {
      // 400 = the token is unknown, used or expired
      if (err instanceof ApiError && err.status === 400 && /invalid|expired/i.test(err.message)) {
        setInvalidLink(true);
      } else {
        toast.error(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
      }
      setSubmitting(false);
    }
  }

  if (invalidLink) {
    return (
      <AuthLayout>
        <Card className="text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <KeyRound className="size-6" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold tracking-tight text-foreground">This link doesn't work</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Reset links can only be used once and expire after a while. Request a new one and we'll send it right over.
          </p>
          <Link
            to="/forgot-password"
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
          >
            Request a new link
          </Link>
        </Card>
        <p className="mt-5 text-center text-sm">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to log in
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick something you haven't used here before.</p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Field label="New password">
            <PasswordInput
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              placeholder="Type it again"
            />
          </Field>
          {mismatch ? <p className="text-sm font-medium text-destructive">The passwords don't match.</p> : null}
          <Button type="submit" className="w-full" disabled={submitting || mismatch}>
            Update password
          </Button>
        </form>
      </Card>
    </AuthLayout>
  );
}
