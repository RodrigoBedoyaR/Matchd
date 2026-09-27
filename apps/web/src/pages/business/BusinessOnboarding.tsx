import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { businessApi } from "@/lib/api";
import { APP_NAME } from "@/lib/data";
import { useAuth } from "@/context/AuthContext";
import { Card, Field, Input, Textarea } from "@/components/Primitives";
import { OnboardingWizard, StepError, StepFooter } from "@/components/onboarding/OnboardingWizard";

const TOTAL_STEPS = 2;

const STEP_COPY: Record<number, { title: string; sub: string }> = {
  1: { title: "Tell us about your business", sub: "The basics candidates will see first." },
  2: { title: "Where are you based?", sub: "We'll use this to match you with the right local candidates." },
};

export default function BusinessOnboarding() {
  const { setBusiness } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [emoji, setEmoji] = useState("");
  // Step 2
  const [area, setArea] = useState("");
  const [city, setCity] = useState("Utrecht");
  const [description, setDescription] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setError(null);
  }, [step]);

  /** Returns an error message for the given step, or null when it's valid */
  function validate(s: number): string | null {
    if (s === 1 && (!name.trim() || !industry.trim())) return "Please add your business name and industry";
    if (s === 2 && (!area.trim() || !city.trim())) return "Please add your area and city";
    return null;
  }

  function handleNext() {
    const msg = validate(step);
    if (msg) {
      setError(msg);
      return;
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
    else void submit();
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await businessApi.onboard({
        name: name.trim(),
        industry: industry.trim(),
        area: area.trim(),
        city: city.trim(),
        description: description.trim() || undefined,
        emoji: emoji.trim() || undefined,
      });
      setBusiness(res.business);
      toast.success("Business profile created");
      navigate("/business/jobs");
    } catch {
      toast.error("Could not create your business profile");
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
      intro={step === 1 ? `Welcome to ${APP_NAME} — 2 quick steps and you're ready to post jobs.` : undefined}
      onSubmit={handleNext}
      footer={
        <StepFooter
          onBack={step > 1 ? () => setStep(1) : undefined}
          primaryLabel={step < TOTAL_STEPS ? "Continue" : "Finish"}
          busy={submitting}
        />
      }
    >
      {step === 1 ? (
        <Card className="space-y-5">
          <Field label="Business name">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="Coffee Corner Utrecht"
              autoComplete="organization"
              autoFocus
              required
            />
          </Field>
          <Field label="Industry">
            <Input
              value={industry}
              onChange={(e) => {
                setIndustry(e.target.value);
                setError(null);
              }}
              placeholder="Hospitality"
              required
            />
          </Field>
          <Field label="Emoji" hint="optional">
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="☕" maxLength={8} />
          </Field>
          <StepError>{error}</StepError>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Area / neighborhood">
              <Input
                value={area}
                onChange={(e) => {
                  setArea(e.target.value);
                  setError(null);
                }}
                placeholder="Centrum"
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
          </div>
          <Field label="Description" hint="optional">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes your business a great place to work?"
              rows={4}
            />
          </Field>
          <StepError>{error}</StepError>
        </Card>
      ) : null}
    </OnboardingWizard>
  );
}
