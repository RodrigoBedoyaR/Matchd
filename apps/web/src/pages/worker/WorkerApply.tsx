import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Check, PartyPopper, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { Shell } from "@/components/Shell";
import { Button, Card, Chip, SectionTitle, buttonBase } from "@/components/Primitives";
import { Checkbox } from "@/components/ui/checkbox";
import { ApplyStepper } from "@/components/apply/ApplyStepper";
import { ApplicationAnswers } from "@/components/apply/ApplicationAnswers";
import { CountedTextarea } from "@/components/apply/CountedTextarea";
import { JobSummaryCard } from "@/components/apply/JobSummaryCard";
import { StickyActionBar } from "@/components/apply/StickyActionBar";
import { availabilityLines, fitGaps } from "@/components/apply/fit";
import { useAuth } from "@/context/AuthContext";
import { ApiError, workerApi } from "@/lib/api";
import { APPLICATION_NOTE_MAX, SCREENING_ANSWER_MAX, type Job, type WorkerProfile } from "@/lib/data";
import { cn } from "@/lib/utils";

const STEPS = ["Check the fit", "Say hello", "Review"] as const;

const NOTE_SUGGESTIONS = [
  "I live nearby and can start right away.",
  "I'm reliable and happy to pick up extra shifts.",
  "I enjoy working with people and learn quickly.",
];

export default function WorkerApply() {
  const { jobId } = useParams<{ jobId: string }>();
  const queryClient = useQueryClient();
  const { worker } = useAuth();

  const jobQuery = useQuery({
    queryKey: ["worker", "job", jobId],
    queryFn: () => workerApi.jobDetail(jobId!),
    enabled: !!jobId,
  });
  const applicationsQuery = useQuery({ queryKey: ["worker", "applications"], queryFn: workerApi.applications });

  // Form state lives here (not per step) so Back/Continue never loses input.
  const [step, setStep] = useState(0);
  const [confirmedGaps, setConfirmedGaps] = useState(false);
  const [note, setNote] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const job = jobQuery.data?.job;
  const questions = job?.screeningQuestions ?? [];
  const { gaps, scheduleGap } = useMemo(() => fitGaps(job?.match), [job?.match]);
  const existingApplication = applicationsQuery.data?.applications.find((a) => a.jobId === jobId);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step, submitted]);

  const apply = useMutation({
    mutationFn: () =>
      workerApi.apply(jobId!, {
        note: note.trim() || undefined,
        answers: questions.map((q) => ({ question: q, answer: (answers[q] ?? "").trim() })),
        confirmedScheduleGaps: scheduleGap && confirmedGaps,
      }),
    onSuccess: () => {
      setSubmitted(true);
      void queryClient.invalidateQueries({ queryKey: ["worker", "applications"] });
    },
    onError: (err) => {
      // 409 = the job closed while the worker was filling this in; refetch so
      // the page switches to the "no longer accepting" state.
      if (err instanceof ApiError && err.status === 409) {
        void queryClient.invalidateQueries({ queryKey: ["worker", "job", jobId] });
      }
      toast.error(err instanceof Error ? err.message : "Couldn't send your application");
    },
  });

  const cancelTo = `/worker/jobs/${jobId}`;
  const cancelLink = (
    <Link to={cancelTo} className="inline-flex items-center gap-1 pt-1.5 text-sm font-semibold text-muted-foreground">
      <X className="size-4" /> Cancel
    </Link>
  );

  if (jobQuery.isLoading || applicationsQuery.isLoading) {
    return (
      <Shell role="worker" title="Apply">
        <p className="text-sm text-muted-foreground">Loading job…</p>
      </Shell>
    );
  }

  if (!job) {
    return (
      <Shell role="worker" title="Apply">
        <Notice title="We couldn't load this job">
          It may have been removed.{" "}
          <Link to="/worker/matches" className="font-semibold text-primary">
            Back to matches
          </Link>
        </Notice>
      </Shell>
    );
  }

  if (submitted) {
    return (
      <Shell role="worker" title="Application sent">
        <SuccessScreen job={job} />
      </Shell>
    );
  }

  if (existingApplication) {
    return (
      <Shell role="worker" title="Apply">
        <Notice title="You've already applied to this job" icon={<Check className="size-6" />}>
          You'll find its status under Applications.
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to={`/worker/applications?open=${existingApplication.id}`}
              className={cn(buttonBase, "h-12 bg-primary px-5 text-primary-foreground shadow-soft")}
            >
              View my application
            </Link>
            <Link to={cancelTo} className={cn(buttonBase, "h-12 border border-border bg-card px-5 text-foreground")}>
              Back to job
            </Link>
          </div>
        </Notice>
      </Shell>
    );
  }

  if (!job.active) {
    return (
      <Shell role="worker" title="Apply">
        <Notice title="No longer accepting applications" icon={<AlertTriangle className="size-6" />}>
          {job.business?.name ?? "The business"} has closed this vacancy.{" "}
          <Link to="/worker/matches" className="font-semibold text-primary">
            See other matches
          </Link>
        </Notice>
      </Shell>
    );
  }

  const answersComplete = questions.every((q) => (answers[q] ?? "").trim().length > 0);
  // Only a schedule gap blocks: the business needs to know you'll really show up.
  // Other gaps (distance, language…) are shown as information.
  const canContinue = step === 0 ? !scheduleGap || confirmedGaps : step === 1 ? answersComplete : true;
  const isLast = step === STEPS.length - 1;

  function insertSuggestion(text: string) {
    setNote((prev) => {
      const next = prev.trim() ? `${prev.trimEnd()} ${text}` : text;
      return next.slice(0, APPLICATION_NOTE_MAX);
    });
  }

  function next() {
    if (!canContinue) return;
    if (isLast) apply.mutate();
    else setStep((s) => s + 1);
  }

  return (
    <Shell role="worker" title="Apply" subtitle={`${job.title} · ${job.business?.name ?? ""}`} action={cancelLink}>
      <div className="mx-auto max-w-2xl">
        <ApplyStepper steps={STEPS} current={step} />

        {step === 0 && (
          <>
            <JobSummaryCard job={job} />
            <Card>
              <SectionTitle>How you fit</SectionTitle>
              {job.match ? (
                <ul className="mb-4 space-y-2">
                  {job.match.reasons.map((r, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      {r.ok ? (
                        <Check className="size-4 shrink-0 text-primary" />
                      ) : (
                        <X className="size-4 shrink-0 text-accent" />
                      )}
                      <span className={r.ok ? "text-foreground" : "text-muted-foreground"}>{r.label}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {gaps.length === 0 ? (
                <div className="flex items-start gap-3 rounded-2xl bg-mint p-4 text-mint-foreground">
                  <Sparkles className="mt-0.5 size-5 shrink-0" />
                  <p className="text-sm font-semibold">
                    Great news — this job fits you on every point. Let's say hello!
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-accent/40 bg-accent/10 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <AlertTriangle className="size-4 shrink-0 text-accent" />
                    {scheduleGap ? "Heads up: the hours don't fully match your availability" : "A few things to check"}
                  </p>
                  <ul className="mt-2 space-y-1 pl-6 text-sm text-foreground">
                    {gaps.map((g, i) => (
                      <li key={i} className="list-disc">
                        {g.label}
                      </li>
                    ))}
                  </ul>
                  {scheduleGap ? (
                    <p className="mt-2 pl-6 text-sm text-muted-foreground">
                      This job needs you on {job.days.length === 1 ? "this day" : "these days"}, {job.startTime}–
                      {job.endTime}.
                    </p>
                  ) : null}
                  {scheduleGap ? (
                    <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl bg-card p-3">
                      <Checkbox
                        checked={confirmedGaps}
                        onCheckedChange={(v) => setConfirmedGaps(v === true)}
                        className="size-5"
                      />
                      <span className="text-sm font-semibold text-foreground">I can work these times anyway</span>
                    </label>
                  ) : (
                    <p className="mt-2 pl-6 text-sm text-muted-foreground">
                      You can still apply — the business will see how you match.
                    </p>
                  )}
                </div>
              )}
            </Card>
          </>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Card>
              <SectionTitle sub="Optional — a short, friendly line goes a long way.">
                A note to {job.business?.name ?? "the business"}
              </SectionTitle>
              <CountedTextarea
                value={note}
                max={APPLICATION_NOTE_MAX}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Hi! I'd love to join your team because…"
                aria-label="Note to the business"
              />
              <p className="mb-2 mt-1 text-xs font-semibold text-muted-foreground">Tap to add</p>
              <div className="flex flex-wrap gap-2">
                {NOTE_SUGGESTIONS.map((s) => (
                  <Chip key={s} onClick={() => insertSuggestion(s)} disabled={note.includes(s)} className="py-2 text-left">
                    + {s}
                  </Chip>
                ))}
              </div>
            </Card>

            {questions.length > 0 && (
              <Card>
                <SectionTitle
                  sub={`${job.business?.name ?? "The business"} asks ${questions.length === 1 ? "one quick question" : `${questions.length} quick questions`}. Required.`}
                >
                  Quick {questions.length === 1 ? "question" : "questions"}
                </SectionTitle>
                <div className="space-y-4">
                  {questions.map((q, i) => (
                    <div key={q}>
                      <label htmlFor={`answer-${i}`} className="text-sm font-semibold text-foreground">
                        {q} <span className="text-accent">*</span>
                      </label>
                      <div className="mt-2">
                        <CountedTextarea
                          id={`answer-${i}`}
                          value={answers[q] ?? ""}
                          max={SCREENING_ANSWER_MAX}
                          required
                          onChange={(e) => setAnswers((prev) => ({ ...prev, [q]: e.target.value }))}
                          className="min-h-24"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This is what {job.business?.name ?? "the business"} will see. Your exact address and postal code stay
              private.
            </p>

            <Card>
              <div className="mb-3 flex items-center justify-between gap-3">
                <SectionTitle>Your profile</SectionTitle>
                <Link to="/worker/profile" className="mb-3 shrink-0 text-sm font-semibold text-primary">
                  Edit profile
                </Link>
              </div>
              {worker ? <ProfilePreview worker={worker} /> : <p className="text-sm text-muted-foreground">Loading profile…</p>}
            </Card>

            {scheduleGap && confirmedGaps ? (
              <Card className="flex items-start justify-between gap-3">
                <p className="text-sm text-foreground">
                  <Check className="mr-1.5 inline size-4 text-primary" />
                  You confirmed you can work {job.startTime}–{job.endTime} on the job's days.
                </p>
                <button type="button" onClick={() => setStep(0)} className="shrink-0 text-sm font-semibold text-primary">
                  Edit
                </button>
              </Card>
            ) : null}

            <Card>
              <SectionTitle>Your message</SectionTitle>
              <ApplicationAnswers
                note={note}
                answers={questions.map((q) => ({ question: q, answer: answers[q] ?? "" }))}
                onEdit={() => setStep(1)}
              />
            </Card>
          </div>
        )}

        <StickyActionBar>
          {step === 0 ? (
            <Link to={cancelTo} className={cn(buttonBase, "h-12 border border-border bg-card px-5 text-foreground")}>
              Cancel
            </Link>
          ) : (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={apply.isPending}>
              <ArrowLeft className="size-4" /> Back
            </Button>
          )}
          <Button
            variant={isLast ? "accent" : "primary"}
            className="flex-1 md:flex-none md:ml-auto md:min-w-48"
            onClick={next}
            disabled={!canContinue || apply.isPending}
          >
            {isLast
              ? apply.isPending
                ? "Sending…"
                : "Send application"
              : step === 1 && questions.length === 0 && !note.trim()
                ? "Skip for now"
                : "Continue"}
          </Button>
        </StickyActionBar>
      </div>
    </Shell>
  );
}

/* ------------------------------ sub-sections ------------------------------- */

function Notice({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <Card className="mx-auto max-w-lg py-10 text-center">
      {icon ? (
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-mint text-mint-foreground">
          {icon}
        </div>
      ) : null}
      <p className="text-lg font-bold text-foreground">{title}</p>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </Card>
  );
}

function ProfileRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-sm text-foreground">{children}</div>
    </div>
  );
}

function ProfilePreview({ worker }: { worker: WorkerProfile }) {
  const availability = availabilityLines(worker.availability);
  return (
    <div className="space-y-3">
      <div>
        <p className="text-lg font-bold text-foreground">{worker.name}</p>
        <p className="text-sm text-muted-foreground">{worker.city}</p>
      </div>
      {worker.bio ? <p className="text-sm leading-relaxed text-foreground">{worker.bio}</p> : null}
      <ProfileRow label="Languages">{worker.languages.join(", ") || "—"}</ProfileRow>
      <ProfileRow label="Interests">{worker.interests.join(", ") || "—"}</ProfileRow>
      <ProfileRow label="Experience">
        {worker.experience.length ? (
          <ul className="space-y-1">
            {worker.experience.map((e, i) => (
              <li key={i}>
                <span className="font-semibold">{e.category}</span>
                {e.summary ? ` — ${e.summary}` : ""}
              </li>
            ))}
          </ul>
        ) : (
          "No experience listed yet"
        )}
      </ProfileRow>
      <ProfileRow label="Availability">
        {availability.length ? (
          <div className="flex flex-wrap gap-1.5">
            {availability.map((line) => (
              <span key={line} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                {line}
              </span>
            ))}
          </div>
        ) : (
          "Not set"
        )}
      </ProfileRow>
    </div>
  );
}

function SuccessScreen({ job }: { job: Job }) {
  const business = job.business?.name ?? "The business";
  const steps = [
    `${business} reviews your application — usually within a few days.`,
    "You'll see status updates under Applications.",
    "If they're interested, they'll invite you to an interview.",
  ];
  return (
    <div className="mx-auto max-w-lg">
      <Card className="py-10 text-center">
        <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-mint text-mint-foreground">
          <PartyPopper className="size-10" />
        </div>
        <p className="text-2xl font-extrabold tracking-tight text-foreground">You're in the running!</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your application for <span className="font-semibold text-foreground">{job.title}</span> is on its way to{" "}
          {business}.
        </p>
      </Card>

      <Card className="mt-4">
        <SectionTitle>What happens next</SectionTitle>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-foreground">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          to="/worker/applications"
          className={cn(buttonBase, "h-12 flex-1 bg-primary px-5 text-primary-foreground shadow-soft")}
        >
          View my applications
        </Link>
        <Link
          to="/worker/matches"
          className={cn(buttonBase, "h-12 flex-1 border border-border bg-card px-5 text-foreground hover:bg-muted")}
        >
          Back to matches
        </Link>
      </div>
    </div>
  );
}
