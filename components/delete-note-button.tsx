"use client";

import { useState, useTransition } from "react";
import { deleteNoteAction } from "@/app/actions";

export function DeleteNoteButton({ id }: { id: number }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-full bg-red-600/10 px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-600/20"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-red-600/10 p-4 text-sm">
      <span>Move this note to Deleted? It will be removed after 30 days.</span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await deleteNoteAction(id);
            if (result?.error) setError(result.error);
          })
        }
        className="rounded-full bg-red-600 px-4 py-1.5 text-white disabled:opacity-50"
      >
        {pending ? "Moving..." : "Move to Deleted"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirming(false)}
        className="text-foreground/70 hover:underline"
      >
        Cancel
      </button>
      {error && (
        <p role="alert" className="basis-full text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
