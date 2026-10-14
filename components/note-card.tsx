"use client";

import { useState, type ReactNode } from "react";
import { PinButton } from "@/components/pin-button";

type Props = {
  noteId: number;
  pinned: boolean;
  // The card's link. It should stretch over the whole card (see app/page.tsx).
  children: ReactNode;
};

// One list item: the card, plus the pin error shown below it in normal flow.
export function NoteCard({ noteId, pinned, children }: Props) {
  const [error, setError] = useState<string>();

  return (
    <li className="flex flex-col gap-1">
      <div
        className={`relative rounded-md border hover:bg-foreground/5 ${
          pinned ? "border-foreground/40" : "border-foreground/10"
        }`}
      >
        {/* z-10 keeps the pin button above the link stretched over the card. */}
        <div className="absolute right-3 top-3 z-10">
          <PinButton noteId={noteId} pinned={pinned} onError={setError} />
        </div>
        {children}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </li>
  );
}
