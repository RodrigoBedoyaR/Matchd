import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { businessApi } from "@/lib/api";
import type { Job } from "@/lib/data";
import { Button } from "@/components/Primitives";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScreeningQuestionsInput, cleanQuestions } from "./ScreeningQuestionsInput";

/** "Edit questions" button + dialog for an already-posted job. */
export function EditQuestionsDialog({ job }: { job: Job }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState<string[]>(job.screeningQuestions);

  const save = useMutation({
    mutationFn: () => businessApi.setScreeningQuestions(job.id, cleanQuestions(questions)),
    onSuccess: () => {
      toast.success("Questions updated");
      queryClient.invalidateQueries({ queryKey: ["business", "jobs"] });
      setOpen(false);
    },
    onError: () => toast.error("Could not update the questions"),
  });

  function handleOpenChange(next: boolean) {
    // Start from the saved questions each time the dialog opens.
    if (next) setQuestions(job.screeningQuestions);
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button type="button" className="text-xs font-semibold text-primary underline-offset-2 hover:underline">
          {job.screeningQuestions.length ? "Edit questions" : "Add screening questions"}
        </button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] rounded-3xl border-0 bg-card sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle>Screening questions</DialogTitle>
          <DialogDescription>
            For "{job.title}". Changes apply to new applicants only — people who already applied keep the questions
            they answered.
          </DialogDescription>
        </DialogHeader>
        <ScreeningQuestionsInput value={questions} onChange={setQuestions} />
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Saving..." : "Save questions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
