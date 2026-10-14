"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setNotePinnedAction } from "@/app/actions";

type Props = {
  noteId: number;
  pinned: boolean;
  showLabel?: boolean;
};

export function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 17v5" />
      <path d="M9 3h6l-1 7 3 3v2H7v-2l3-3-1-7z" />
    </svg>
  );
}

export function PinButton({ noteId, pinned, showLabel = false }: Props) {
  // Flips at once; goes back to the real value if the save fails.
  const [shownPinned, setShownPinned] = useOptimistic(pinned);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !shownPinned;
    setError(undefined);
    startTransition(async () => {
      setShownPinned(next);
      const result = await setNotePinnedAction(noteId, next);
      if (result?.error) setError(result.error);
    });
  }

  const label = shownPinned ? "Unpin note" : "Pin note";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={shownPinned}
        aria-label={label}
        title={label}
        className="flex items-center gap-1.5 rounded-md border border-foreground/20 px-2 py-1 text-sm hover:bg-foreground/10 disabled:opacity-50"
      >
        <PinIcon filled={shownPinned} />
        {showLabel && <span>{shownPinned ? "Unpin" : "Pin"}</span>}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
