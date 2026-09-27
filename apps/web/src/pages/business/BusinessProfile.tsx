import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { businessApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Shell } from "@/components/Shell";
import { Button, Card, Field, Input, Textarea } from "@/components/Primitives";

export default function BusinessProfile() {
  const { business, setBusiness } = useAuth();
  const [name, setName] = useState(business?.name ?? "");
  const [industry, setIndustry] = useState(business?.industry ?? "");
  const [area, setArea] = useState(business?.area ?? "");
  const [city, setCity] = useState(business?.city ?? "");
  const [description, setDescription] = useState(business?.description ?? "");
  const [emoji, setEmoji] = useState(business?.emoji ?? "");
  const [submitting, setSubmitting] = useState(false);

  if (!business) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await businessApi.updateProfile({
        name: name.trim(),
        industry: industry.trim(),
        area: area.trim(),
        city: city.trim(),
        description: description.trim() || undefined,
        emoji: emoji.trim() || undefined,
      });
      setBusiness(res.business);
      toast.success("Profile updated");
    } catch {
      toast.error("Could not update your profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell role="business" title="Business profile" subtitle="Keep your details up to date so candidates know who they're working with.">
      <Card>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <Field label="Business name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Industry">
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Area / neighborhood">
              <Input value={area} onChange={(e) => setArea(e.target.value)} required />
            </Field>
            <Field label="City">
              <Input value={city} onChange={(e) => setCity(e.target.value)} required />
            </Field>
          </div>
          <Field label="Emoji" hint="optional">
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={8} />
          </Field>
          <Field label="Description" hint="optional">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </Field>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </Card>
    </Shell>
  );
}
