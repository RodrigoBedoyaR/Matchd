import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { workerApi } from "@/lib/api";
import {
  APP_NAME,
  CATEGORIES,
  LANGUAGES,
  type Availability,
  type Category,
} from "@/lib/data";
import { Card, Chip, Field, Input, SectionTitle, Textarea } from "@/components/Primitives";
import { AvailabilityPicker } from "@/components/AvailabilityPicker";
import { Switch } from "@/components/ui/switch";
import { OnboardingWizard, StepError, StepFooter } from "@/components/onboarding/OnboardingWizard";

const TOTAL_STEPS = 4;

const STEP_COPY: Record<number, { title: string; sub: string }> = {
  1: { title: "About you", sub: "The basics, so we know where to look." },
  2: { title: "When can you work?", sub: "Toggle the days and times that suit you." },
  3: { title: "What kind of work?", sub: "Pick what you'd enjoy — we'll match you on it." },
  4: { title: "A bit more (optional)", sub: "Optional, but it helps you stand out to businesses." },
};

export default function WorkerOnboarding() {
  const { setWorker } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [city, setCity] = useState("Utrecht");
  const [postalCode, setPostalCode] = useState("");
  const [maxDistanceKm, setMaxDistanceKm] = useState(10);
  // Step 2
  const [availability, setAvailability] = useState<Availability>({});
  // Step 3
  const [interests, setInterests] = useState<Category[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  // Step 4 (optional)
  const [age, setAge] = useState("");
  const [experienceSummary, setExperienceSummary] = useState("");
  const [preferredPay, setPreferredPay] = useState("");
  const [drivingLicence, setDrivingLicence] = useState(false);
  const [bio, setBio] = useState("");

  const hasAvailability = Object.values(availability).some((slots) => (slots?.length ?? 0) > 0);

  // Each step starts at the top of the page (matters on mobile, where steps are long)
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setError(null);
  }, [step]);

  function toggleInterest(cat: Category) {
    setError(null);
    setInterests((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  function toggleLanguage(lang: string) {
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  }

  /** Returns an error message for the given step, or null when it's valid */
  function validate(s: number): string | null {
    if (s === 1) {
      if (!name.trim()) return "Please add your name";
      if (!city.trim()) return "Please add your city";
    }
    // Step 2: availability is encouraged, not required (see the note in the step)
    if (s === 3 && interests.length === 0) return "Pick at least one type of work";
    return null;
  }

  function handleNext() {
    const msg = validate(step);
    if (msg) {
      setError(msg);
      return;
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
    else void submit(true);
  }

  function handleBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  /** `includeExtras` = false for "Skip & finish": step 4 fields are left out */
  async function submit(includeExtras: boolean) {
    // Re-check the required steps in case something slipped through
    for (let s = 1; s < TOTAL_STEPS; s++) {
      const msg = validate(s);
      if (msg) {
        setStep(s);
        toast.error(msg);
        return;
      }
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      city: city.trim(),
      maxDistanceKm,
      availability,
      interests,
      languages,
      drivingLicence: includeExtras ? drivingLicence : false,
      experience:
        includeExtras && experienceSummary.trim().length > 0
          ? [{ category: interests[0], summary: experienceSummary.trim().slice(0, 120) }]
          : [],
    };
    if (postalCode.trim()) payload.postalCode = postalCode.trim();
    if (includeExtras) {
      if (age.trim()) payload.age = Number(age);
      if (preferredPay.trim()) payload.preferredPay = Number(preferredPay);
      if (bio.trim()) payload.bio = bio.trim();
    }

    setSubmitting(true);
    try {
      const res = await workerApi.onboard(payload);
      setWorker(res.worker);
      navigate("/worker/matches");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const copy = STEP_COPY[step];

  return (
    <OnboardingWizard
      step={step}
      total={TOTAL_STEPS}
      title={copy.title}
      sub={copy.sub}
      intro={step === 1 ? `Welcome to ${APP_NAME} — 4 quick steps and we'll show you jobs that fit you.` : undefined}
      onSubmit={handleNext}
      footer={
        <StepFooter
          onBack={step > 1 ? handleBack : undefined}
          primaryLabel={step < TOTAL_STEPS ? "Continue" : "Finish"}
          busy={submitting}
          secondary={step === TOTAL_STEPS ? { label: "Skip & finish", onClick: () => void submit(false) } : undefined}
        />
      }
    >
      {step === 1 ? (
        <Card className="space-y-4">
          <Field label="Your name">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="Jamie Rivera"
              autoComplete="name"
              autoFocus
              required
            />
          </Field>
          <Field label="City">
            <Input
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setError(null);
              }}
              autoComplete="address-level2"
              required
            />
          </Field>
          <Field label="Postal code" hint="optional">
            <Input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="3511 AB"
              autoComplete="postal-code"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Only used to work out distances to jobs — never shown to businesses.
            </p>
          </Field>
          <Field label="How far can you travel?" hint={`up to ${maxDistanceKm} km`}>
            <input
              type="range"
              min={1}
              max={30}
              value={maxDistanceKm}
              onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </Field>
          <StepError>{error}</StepError>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="space-y-4">
          <AvailabilityPicker value={availability} onChange={setAvailability} />
          {/* Friendlier than blocking: let people continue, but explain the trade-off */}
          {!hasAvailability ? (
            <p className="rounded-2xl bg-mint px-4 py-3 text-sm text-mint-foreground">
              No times picked yet — that's okay, but your matches will be weaker. You can always add this later from
              your profile.
            </p>
          ) : null}
        </Card>
      ) : null}

      {step === 3 ? (
        <Card className="space-y-5">
          <div>
            <SectionTitle sub="Pick at least one">Types of work</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Chip key={cat} type="button" selected={interests.includes(cat)} onClick={() => toggleInterest(cat)}>
                  {cat}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <SectionTitle sub="Optional">Languages you speak</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <Chip key={lang} type="button" selected={languages.includes(lang)} onClick={() => toggleLanguage(lang)}>
                  {lang}
                </Chip>
              ))}
            </div>
          </div>
          <StepError>{error}</StepError>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Everything here is optional. Fill in what you like, or skip and finish now.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Age" hint="optional">
              <Input type="number" min={14} max={100} value={age} onChange={(e) => setAge(e.target.value)} />
            </Field>
            <Field label="Preferred hourly pay" hint="optional, €/hour">
              <Input type="number" min={0} max={100} value={preferredPay} onChange={(e) => setPreferredPay(e.target.value)} />
            </Field>
          </div>
          <Field label="Previous experience" hint="optional">
            <Textarea
              value={experienceSummary}
              onChange={(e) => setExperienceSummary(e.target.value)}
              maxLength={120}
              placeholder="e.g. Worked a summer at a local cafe"
              rows={3}
            />
          </Field>
          <Field label="Driving licence" hint="optional">
            <div className="flex h-12 items-center">
              <Switch checked={drivingLicence} onCheckedChange={setDrivingLicence} />
            </div>
          </Field>
          <Field label="Short bio" hint={`optional, ${bio.length}/280`}>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={3} />
          </Field>
        </Card>
      ) : null}
    </OnboardingWizard>
  );
}
