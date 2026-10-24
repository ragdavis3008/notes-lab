"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { deleteNoteAction } from "@/app/actions";
import { CompleteCheckbox } from "@/components/complete-checkbox";
import { ConfirmPanel } from "@/components/confirm-panel";
import { PinButton } from "@/components/pin-button";

type Props = {
  noteId: number;
  noteTitle: string;
  pinned: boolean;
  completed: boolean;
  // The card's link. It should stretch over the whole card (see app/page.tsx).
  children: ReactNode;
};

const iconButton =
  "flex items-center rounded-full p-1.5 text-foreground/40 hover:bg-primary/10 hover:text-primary disabled:opacity-50";

// One list item: the card, plus the pin/delete error shown below it in normal flow.
export function NoteCard({ noteId, noteTitle, pinned, completed, children }: Props) {
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
    // One row of the list panel in app/notes/page.tsx (the panel draws the dividers).
    <li className="flex flex-col">
      <div className="group relative hover:bg-foreground/5">
        {/* z-10 keeps the checkbox above the link stretched over the card. The
            link's pl-12 keeps the text clear of it. */}
        <div className="absolute left-4 top-[1.125rem] z-10">
          <CompleteCheckbox
            noteId={noteId}
            noteTitle={noteTitle}
            completed={completed}
            onError={setError}
          />
        </div>
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
            className="absolute inset-0 z-20 items-center justify-center bg-card p-3"
          />
        )}
      </div>
      {error && (
        <p role="alert" className="px-4 pb-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </li>
  );
}
