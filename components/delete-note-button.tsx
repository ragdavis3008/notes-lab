"use client";

import { useState, useTransition } from "react";
import { deleteNoteAction } from "@/app/actions";

export function DeleteNoteButton({ id }: { id: number }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-red-600/40 px-4 py-2 text-sm text-red-600"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-md border border-red-600/40 p-3 text-sm">
      <span>Delete this note? This cannot be undone.</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => deleteNoteAction(id))}
        className="rounded-md bg-red-600 px-3 py-1.5 text-white disabled:opacity-50"
      >
        {pending ? "Deleting..." : "Yes, delete"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirming(false)}
        className="text-foreground/70 hover:underline"
      >
        Cancel
      </button>
    </div>
  );
}
