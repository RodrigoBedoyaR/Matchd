import type { ReactNode } from "react";
import type { ScreeningAnswer } from "@/lib/data";

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="shrink-0 text-sm font-semibold text-primary">
      Edit
    </button>
  );
}

function Block({ title, onEdit, children }: { title: string; onEdit?: () => void; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        {onEdit ? <EditButton onClick={onEdit} /> : null}
      </div>
      {children}
    </div>
  );
}

// The worker's note + screening answers, as the business sees them. Used in
// the apply review step (with Edit links) and in the applications list.
export function ApplicationAnswers({
  note,
  answers,
  onEdit,
}: {
  note?: string;
  answers: ScreeningAnswer[];
  onEdit?: () => void;
}) {
  return (
    <div className="space-y-4">
      <Block title="Your note" onEdit={onEdit}>
        {note?.trim() ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{note}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">No note added.</p>
        )}
      </Block>
      {answers.map((a, i) => (
        <Block key={i} title={a.question} onEdit={onEdit}>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{a.answer}</p>
        </Block>
      ))}
    </div>
  );
}
