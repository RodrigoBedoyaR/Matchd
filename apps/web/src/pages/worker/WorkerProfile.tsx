import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { workerApi } from "@/lib/api";
import { CATEGORIES, LANGUAGES, type Availability, type Category } from "@/lib/data";
import { Shell } from "@/components/Shell";
import { Button, Card, Chip, Field, Input, SectionTitle, Textarea } from "@/components/Primitives";
import { AvailabilityPicker } from "@/components/AvailabilityPicker";
import { Switch } from "@/components/ui/switch";

export default function WorkerProfile() {
  const { worker, setWorker } = useAuth();

  const [name, setName] = useState(worker?.name ?? "");
  const [city, setCity] = useState(worker?.city ?? "");
  const [maxDistanceKm, setMaxDistanceKm] = useState(worker?.maxDistanceKm ?? 10);
  const [availability, setAvailability] = useState<Availability>(worker?.availability ?? {});
  const [interests, setInterests] = useState<Category[]>(worker?.interests ?? []);

  const [age, setAge] = useState(worker?.age != null ? String(worker.age) : "");
  const [postalCode, setPostalCode] = useState(worker?.postalCode ?? "");
  const [languages, setLanguages] = useState<string[]>(worker?.languages ?? []);
  const [experienceSummary, setExperienceSummary] = useState(worker?.experience?.[0]?.summary ?? "");
  const [preferredPay, setPreferredPay] = useState(worker?.preferredPay != null ? String(worker.preferredPay) : "");
  const [drivingLicence, setDrivingLicence] = useState(worker?.drivingLicence ?? false);
  const [bio, setBio] = useState(worker?.bio ?? "");

  const updateMutation = useMutation({
    mutationFn: (patch: Record<string, unknown>) => workerApi.updateProfile(patch),
    onSuccess: (res) => {
      setWorker(res.worker);
      toast.success("Profile updated");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't update profile"),
  });

  function toggleInterest(cat: Category) {
    setInterests((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  function toggleLanguage(lang: string) {
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please add your name");
    if (!city.trim()) return toast.error("Please add your city");
    if (interests.length === 0) return toast.error("Pick at least one type of work");

    const patch: Record<string, unknown> = {
      name: name.trim(),
      city: city.trim(),
      maxDistanceKm,
      availability,
      interests,
      languages,
      drivingLicence,
      experience:
        experienceSummary.trim().length > 0
          ? [{ category: interests[0], summary: experienceSummary.trim().slice(0, 120) }]
          : [],
      age: age.trim() ? Number(age) : undefined,
      postalCode: postalCode.trim() || undefined,
      preferredPay: preferredPay.trim() ? Number(preferredPay) : undefined,
      bio: bio.trim() || undefined,
    };
    updateMutation.mutate(patch);
  }

  if (!worker) return null;

  return (
    <Shell role="worker" title="Your profile" subtitle="Keep this up to date so your matches stay accurate.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="space-y-4">
          <SectionTitle>The basics</SectionTitle>
          <Field label="Your name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="City">
            <Input value={city} onChange={(e) => setCity(e.target.value)} required />
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
        </Card>

        <Card className="space-y-4">
          <SectionTitle sub="Toggle the days and times you can work">Your availability</SectionTitle>
          <AvailabilityPicker value={availability} onChange={setAvailability} />
        </Card>

        <Card className="space-y-4">
          <SectionTitle sub="Pick at least one">What kind of work interests you?</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Chip key={cat} type="button" selected={interests.includes(cat)} onClick={() => toggleInterest(cat)}>
                {cat}
              </Chip>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle sub="Optional, but helps you stand out">A bit more about you</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Age" hint="optional">
              <Input type="number" min={14} max={100} value={age} onChange={(e) => setAge(e.target.value)} />
            </Field>
            <Field label="Postal code" hint="optional">
              <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </Field>
          </div>
          <Field label="Languages you speak" hint="optional">
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <Chip key={lang} type="button" selected={languages.includes(lang)} onClick={() => toggleLanguage(lang)}>
                  {lang}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Previous experience" hint="optional">
            <Textarea
              value={experienceSummary}
              onChange={(e) => setExperienceSummary(e.target.value)}
              maxLength={120}
              rows={3}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preferred hourly pay" hint="optional, €/hour">
              <Input type="number" min={0} max={100} value={preferredPay} onChange={(e) => setPreferredPay(e.target.value)} />
            </Field>
            <Field label="Driving licence">
              <div className="flex h-12 items-center">
                <Switch checked={drivingLicence} onCheckedChange={setDrivingLicence} />
              </div>
            </Field>
          </div>
          <Field label="Short bio" hint={`optional, ${bio.length}/280`}>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={3} />
          </Field>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </Shell>
  );
}
