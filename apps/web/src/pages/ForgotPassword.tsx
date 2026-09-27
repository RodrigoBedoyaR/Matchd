import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { authApi, ApiError } from "@/lib/api";
import { Button, Card, Field, Input } from "@/components/Primitives";
import { AuthLayout } from "@/components/account/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  // Only returned by the API outside production — there's no mail provider yet,
  // so in dev we surface the link to keep the flow clickable end-to-end.
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword(email);
      setDevResetUrl(res.devResetUrl ?? null);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // The API builds an absolute URL from its APP_URL; route it in-app by path so
  // it works whatever host/port the web app is actually on.
  const devLink = devResetUrl ? toInAppPath(devResetUrl) : null;

  return (
    <AuthLayout>
      <Card>
        {sent ? (
          <div className="text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-mint text-mint-foreground">
              <MailCheck className="size-6" />
            </span>
            <h1 className="mt-4 text-xl font-extrabold tracking-tight text-foreground">Check your inbox</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              If an account exists for <span className="font-semibold text-foreground">{email}</span>, we've sent a
              reset link.
            </p>
            {devLink ? (
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted p-3 text-left">
                <p className="text-xs font-semibold text-muted-foreground">Dev only: no email is sent yet</p>
                <Link to={devLink} className="mt-1 inline-block text-sm font-bold text-primary hover:underline">
                  Open reset link
                </Link>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-5 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">Forgot your password?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the email you signed up with and we'll send you a link to set a new one.
            </p>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <Field label="Email">
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </Field>
              <Button type="submit" className="w-full" disabled={submitting}>
                Send reset link
              </Button>
            </form>
          </>
        )}
      </Card>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  );
}

function toInAppPath(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
}
