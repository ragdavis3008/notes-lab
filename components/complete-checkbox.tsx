"use client";

import { Check } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { setNoteCompletedAction } from "@/app/actions";

type Props = {
  noteId: number;
  noteTitle: string;
  completed: boolean;
  // The parent shows the error (called with undefined to clear it).
  onError: (message: string | undefined) => void;
};

// Round checkbox that saves as soon as it is clicked.
export function CompleteCheckbox({ noteId, noteTitle, completed, onError }: Props) {
  // Flips at once; goes back to the real value if the save fails.
  const [shownCompleted, setShownCompleted] = useOptimistic(completed);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !shownCompleted;
    onError(undefined);
    startTransition(async () => {
      setShownCompleted(next);
      const result = await setNoteCompletedAction(noteId, next);
      if (result?.error) onError(result.error);
    });
  }

  return (
    <span className="relative flex h-5 w-5">
      <input
        id={`complete-note-${noteId}`}
        type="checkbox"
        checked={shownCompleted}
        onChange={toggle}
        disabled={pending}
        aria-label={`Complete note ${noteTitle}`}
        title={shownCompleted ? "Mark as not completed" : "Mark as completed"}
        className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border-2 border-foreground/30 hover:border-primary checked:border-primary checked:bg-primary disabled:opacity-50"
      />
      <Check
        aria-hidden
        strokeWidth={3}
        className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100"
      />
    </span>
  );
}
