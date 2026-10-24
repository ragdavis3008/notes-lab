"use client";

import { useState, useTransition, type ReactNode } from "react";
import { restoreNoteAction } from "@/app/actions";

// One list item on the Deleted page: the note's text (children) and a Restore
// button. A deleted note cannot be opened, pinned, completed or edited, and there is
// no way to delete it for good here.
export function DeletedNoteCard({
  noteId,
  noteTitle,
  children,
}: {
  noteId: number;
  noteTitle: string;
  children: ReactNode;
}) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function restore() {
    startTransition(async () => {
      setError(undefined);
      const result = await restoreNoteAction(noteId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <li className="flex flex-col">
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">{children}</div>
        <button
          type="button"
          onClick={restore}
          disabled={pending}
          aria-label={`Restore note ${noteTitle}`}
          className="shrink-0 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
        >
          {pending ? "Restoring..." : "Restore"}
        </button>
      </div>
      {error && (
        <p role="alert" className="px-4 pb-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </li>
  );
}
