import { Plus, X } from "lucide-react";
import { MAX_SCREENING_QUESTIONS } from "@/lib/data";
import { Button, Input } from "@/components/Primitives";

// Mirrors the 160-char limit enforced by the shared zod schema.
export const SCREENING_QUESTION_MAX_LENGTH = 160;

const SUGGESTIONS = [
  "Do you have a food hygiene certificate?",
  "When could you start?",
  "Have you worked in a similar role before?",
];

/** Trim, drop empties — what the API expects. */
export function cleanQuestions(questions: string[]): string[] {
  return questions.map((q) => q.trim()).filter(Boolean);
}

/**
 * Controlled editor for a job's screening questions (max 2). Shared by the
 * create-job form and the "Edit questions" dialog.
 */
export function ScreeningQuestionsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const canAdd = value.length < MAX_SCREENING_QUESTIONS;
  const taken = new Set(value.map((q) => q.trim().toLowerCase()));
  const suggestions = SUGGESTIONS.filter((s) => !taken.has(s.toLowerCase()));

  function update(index: number, text: string) {
    onChange(value.map((q, i) => (i === index ? text : q)));
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function add(text = "") {
    if (!canAdd) return;
    // Fill an empty slot before appending a new one.
    const emptyIndex = value.findIndex((q) => !q.trim());
    if (text && emptyIndex !== -1) update(emptyIndex, text);
    else onChange([...value, text]);
  }

  return (
    <div className="space-y-3">
      {value.map((q, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={q}
            maxLength={SCREENING_QUESTION_MAX_LENGTH}
            onChange={(e) => update(i, e.target.value)}
            placeholder={`Question ${i + 1}`}
            aria-label={`Screening question ${i + 1}`}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={`Remove question ${i + 1}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      {canAdd && (
        <>
          <Button type="button" variant="outline" size="sm" onClick={() => add()}>
            <Plus className="h-4 w-4" />
            Add a question
          </Button>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => add(s)}
                  className="rounded-full bg-mint px-3 py-1.5 text-left text-xs font-medium text-mint-foreground transition-colors hover:bg-mint/70"
                >
                  + {s}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground">Applicants answer these when they apply. Keep them short.</p>
    </div>
  );
}
