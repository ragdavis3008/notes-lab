"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { deleteNoteAction } from "@/app/actions";
import { ConfirmPanel } from "@/components/confirm-panel";
import { PinButton } from "@/components/pin-button";

type Props = {
  noteId: number;
  noteTitle: string;
  pinned: boolean;
  // The card's link. It should stretch over the whole card (see app/page.tsx).
  children: ReactNode;
};

const iconButton =
  "flex items-center rounded-md border border-foreground/20 px-2 py-1 text-sm hover:bg-foreground/10 disabled:opacity-50";

// One list item: the card, plus the pin/delete error shown below it in normal flow.
export function NoteCard({ noteId, noteTitle, pinned, children }: Props) {
  const [error, setError] = useState<string>();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      setError(undefined);
      // false: stay on this list, so the filters and search in the URL are kept.
      const result = await deleteNoteAction(noteId, false);
      if (result?.error) {
        setError(result.error);
        setConfirming(false);
      }
    });
  }

  return (
    <li className="flex flex-col gap-1">
      <div
        className={`group relative rounded-md border hover:bg-foreground/5 ${
          pinned ? "border-foreground/40" : "border-foreground/10"
        }`}
      >
        {/* z-10 keeps the buttons above the link stretched over the card. On a
            device that can hover, edit and delete appear when the card is hovered
            or has keyboard focus; on a phone they are always visible. */}
        <div className="absolute right-3 top-3 z-10 flex items-start gap-1">
          <div className="flex gap-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
            <Link
              href={`/notes/${noteId}`}
              aria-label={`Edit note ${noteTitle}`}
              title="Edit note"
              className={iconButton}
            >
              <Pencil aria-hidden size={16} />
            </Link>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label={`Delete note ${noteTitle}`}
              title="Delete note"
              className={iconButton}
            >
              <Trash2 aria-hidden size={16} />
            </button>
          </div>
          <PinButton noteId={noteId} pinned={pinned} onError={setError} />
        </div>
        {children}
        {confirming && (
          <ConfirmPanel
            message="Delete this note?"
            pending={pending}
            onConfirm={confirmDelete}
            onCancel={() => setConfirming(false)}
            className="absolute inset-0 z-20 items-center justify-center rounded-md bg-background p-3"
          />
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </li>
  );
}
