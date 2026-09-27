import { DAYS, SLOTS, type Availability, type Day, type Slot } from "@/lib/data";
import { cn } from "@/lib/utils";

export function AvailabilityPicker({
  value,
  onChange,
}: {
  value: Availability;
  onChange: (next: Availability) => void;
}) {
  function toggle(day: Day, slot: Slot) {
    const current = value[day] ?? [];
    const next = current.includes(slot) ? current.filter((s) => s !== slot) : [...current, slot];
    onChange({ ...value, [day]: next });
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[3.2rem_repeat(3,1fr)] gap-2 px-1">
        <span />
        {SLOTS.map((s) => (
          <span key={s.key} className="text-center text-xs font-semibold text-muted-foreground">
            {s.label}
          </span>
        ))}
      </div>
      {DAYS.map((d) => (
        <div key={d.key} className="grid grid-cols-[3.2rem_repeat(3,1fr)] items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{d.short}</span>
          {SLOTS.map((s) => {
            const on = (value[d.key] ?? []).includes(s.key);
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={on}
                aria-label={`${d.long} ${s.label}`}
                onClick={() => toggle(d.key as Day, s.key as Slot)}
                className={cn(
                  "h-11 rounded-2xl border text-xs font-semibold transition-colors",
                  on
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40",
                )}
              >
                {on ? "✓" : s.hint.split("–")[0]}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
