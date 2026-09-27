import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { businessApi } from "@/lib/api";
import {
  CATEGORIES,
  DAYS,
  EXPERIENCE_LEVELS,
  LANGUAGES,
  formatDays,
  formatPay,
  type Category,
  type Day,
} from "@/lib/data";
import { Shell } from "@/components/Shell";
import { Button, Card, Chip, Field, Input, SectionTitle, Textarea } from "@/components/Primitives";
import { ScreeningQuestionsInput, cleanQuestions } from "@/components/business/ScreeningQuestionsInput";
import { EditQuestionsDialog } from "@/components/business/EditQuestionsDialog";

const emptyForm = {
  title: "",
  category: undefined as Category | undefined,
  days: [] as Day[],
  startTime: "09:00",
  endTime: "17:00",
  recurring: true,
  hourlyPay: "",
  area: "",
  requiredLanguages: [] as string[],
  experienceLevel: undefined as (typeof EXPERIENCE_LEVELS)[number] | undefined,
  description: "",
  requirements: "",
  tasks: "",
  offers: "",
  screeningQuestions: [] as string[],
};

function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function BusinessJobs() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const jobsQuery = useQuery({ queryKey: ["business", "jobs"], queryFn: businessApi.jobs });
  const jobs = jobsQuery.data?.jobs ?? [];

  const toggleActive = useMutation({
    mutationFn: ({ jobId, active }: { jobId: string; active: boolean }) => businessApi.setJobActive(jobId, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["business", "jobs"] }),
  });

  function toggleDay(day: Day) {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  }

  function toggleLanguage(lang: string) {
    setForm((f) => ({
      ...f,
      requiredLanguages: f.requiredLanguages.includes(lang)
        ? f.requiredLanguages.filter((l) => l !== lang)
        : [...f.requiredLanguages, lang],
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.category || !form.days.length || !form.area.trim() || !form.experienceLevel || !form.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    const hourlyPay = Number(form.hourlyPay);
    if (!Number.isFinite(hourlyPay) || hourlyPay < 0) {
      toast.error("Enter a valid hourly pay");
      return;
    }
    setSubmitting(true);
    try {
      await businessApi.createJob({
        title: form.title.trim(),
        category: form.category,
        hourlyPay,
        days: form.days,
        startTime: form.startTime,
        endTime: form.endTime,
        area: form.area.trim(),
        city: "Utrecht",
        requiredLanguages: form.requiredLanguages,
        requirements: splitLines(form.requirements),
        tasks: splitLines(form.tasks),
        offers: splitLines(form.offers),
        description: form.description.trim(),
        recurring: form.recurring,
        experienceLevel: form.experienceLevel,
        screeningQuestions: cleanQuestions(form.screeningQuestions),
      });
      toast.success("Job posted");
      setForm(emptyForm);
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["business", "jobs"] });
    } catch {
      toast.error("Could not post the job");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell
      role="business"
      title="Your jobs"
      subtitle="Post shifts and manage the ones you already have live."
      action={
        <Button variant={formOpen ? "outline" : "accent"} onClick={() => setFormOpen((v) => !v)}>
          {formOpen ? "Cancel" : "Post a shift"}
        </Button>
      }
    >
      {formOpen && (
        <Card className="mb-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Weekend barista"
                required
              />
            </Field>

            <Field label="Category">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Chip key={c} type="button" selected={form.category === c} onClick={() => setForm((f) => ({ ...f, category: c }))}>
                    {c}
                  </Chip>
                ))}
              </div>
            </Field>

            <Field label="Days">
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <Chip key={d.key} type="button" selected={form.days.includes(d.key)} onClick={() => toggleDay(d.key)}>
                    {d.short}
                  </Chip>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Start time">
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  required
                />
              </Field>
              <Field label="End time">
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  required
                />
              </Field>
            </div>

            <Field label="Schedule">
              <div className="flex gap-2">
                <Chip type="button" selected={form.recurring} onClick={() => setForm((f) => ({ ...f, recurring: true }))}>
                  Recurring
                </Chip>
                <Chip type="button" selected={!form.recurring} onClick={() => setForm((f) => ({ ...f, recurring: false }))}>
                  One-off
                </Chip>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Hourly pay (€)">
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  value={form.hourlyPay}
                  onChange={(e) => setForm((f) => ({ ...f, hourlyPay: e.target.value }))}
                  placeholder="14.50"
                  required
                />
              </Field>
              <Field label="Area">
                <Input
                  value={form.area}
                  onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                  placeholder="Centrum"
                  required
                />
              </Field>
            </div>

            <Field label="Required languages" hint="optional">
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <Chip key={l} type="button" selected={form.requiredLanguages.includes(l)} onClick={() => toggleLanguage(l)}>
                    {l}
                  </Chip>
                ))}
              </div>
            </Field>

            <Field label="Experience level">
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <Chip
                    key={lvl}
                    type="button"
                    selected={form.experienceLevel === lvl}
                    onClick={() => setForm((f) => ({ ...f, experienceLevel: lvl }))}
                  >
                    {lvl}
                  </Chip>
                ))}
              </div>
            </Field>

            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe the role"
                rows={3}
                required
              />
            </Field>

            <Field label="Requirements" hint="one per line, optional">
              <Textarea
                value={form.requirements}
                onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
                placeholder={"Must be 18+\nAvailable weekends"}
                rows={3}
              />
            </Field>

            <Field label="Tasks" hint="one per line, optional">
              <Textarea
                value={form.tasks}
                onChange={(e) => setForm((f) => ({ ...f, tasks: e.target.value }))}
                placeholder={"Take orders\nPrepare drinks"}
                rows={3}
              />
            </Field>

            <Field label="What you offer" hint="one per line, optional">
              <Textarea
                value={form.offers}
                onChange={(e) => setForm((f) => ({ ...f, offers: e.target.value }))}
                placeholder={"Free lunch\nFlexible hours"}
                rows={3}
              />
            </Field>

            {/* Not a <Field>: that wraps children in a <label>, which misbehaves with several inputs. */}
            <div>
              <span className="text-sm font-semibold text-foreground">Screening questions</span>
              <span className="ml-2 text-xs text-muted-foreground">optional</span>
              <div className="mt-2">
                <ScreeningQuestionsInput
                  value={form.screeningQuestions}
                  onChange={(screeningQuestions) => setForm((f) => ({ ...f, screeningQuestions }))}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Posting..." : "Post job"}
            </Button>
          </form>
        </Card>
      )}

      <SectionTitle>Your posted jobs</SectionTitle>
      {jobsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : jobs.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">You haven't posted any jobs yet.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {jobs.map((job) => (
            <Card key={job.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{job.title}</h3>
                  <p className="text-sm text-muted-foreground">{job.category}</p>
                </div>
                <span
                  className={
                    job.active
                      ? "rounded-full bg-mint px-2.5 py-1 text-xs font-bold text-mint-foreground"
                      : "rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground"
                  }
                >
                  {job.active ? "Active" : "Closed"}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">{formatPay(job.hourlyPay)}/hr</p>
              <p className="text-sm text-muted-foreground">
                {formatDays(job.days)} · {job.startTime}–{job.endTime}
              </p>
              <div className="rounded-2xl bg-muted/60 p-3">
                {job.screeningQuestions.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-muted-foreground">Screening questions</p>
                    <ol className="mt-1 mb-2 list-decimal space-y-0.5 pl-4 text-sm text-foreground">
                      {job.screeningQuestions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ol>
                  </>
                )}
                <EditQuestionsDialog job={job} />
              </div>
              <div className="mt-auto flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={toggleActive.isPending}
                  onClick={() => toggleActive.mutate({ jobId: job.id, active: !job.active })}
                >
                  {job.active ? "Close" : "Reopen"}
                </Button>
                <Link to={`/business/candidates?jobId=${job.id}`} className="flex-1">
                  <Button variant="soft" size="sm" className="w-full">
                    View candidates
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Shell>
  );
}
