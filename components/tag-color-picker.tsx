"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setTagColorAction } from "@/app/actions";
import { TAG_COLOR_CLASSES, TAG_COLORS, type TagColor } from "@/lib/tag-colors";

type Props = {
  tagId: number;
  tagName: string;
  color: TagColor;
};

// Meant to sit in a flex-wrap row: the swatches and the error take a full line below.
export function TagColorPicker({ tagId, tagName, color }: Props) {
  // Changes at once; goes back to the real value if the save fails.
  const [shownColor, setShownColor] = useOptimistic(color);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function choose(next: TagColor) {
    setOpen(false);
    if (next === shownColor) return;
    setError(undefined);
    startTransition(async () => {
      setShownColor(next);
      try {
        const result = await setTagColorAction(tagId, next);
        if (result?.error) setError(result.error);
      } catch (e) {
        console.error("Tag colour change failed:", e);
        setError("Could not change the colour. Please try again.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        aria-expanded={open}
        aria-label={`Change colour of tag ${tagName}, currently ${shownColor}`}
        title="Change colour"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-foreground/10 disabled:opacity-50"
      >
        <span
          aria-hidden
          className={`h-3.5 w-3.5 rounded-full ring-1 ring-foreground/30 ${TAG_COLOR_CLASSES[shownColor].dot}`}
        />
      </button>
      {open && (
        <div
          role="group"
          aria-label={`Colours for tag ${tagName}`}
          className="flex w-full flex-wrap gap-1.5 px-3 pb-1"
        >
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => choose(c)}
              aria-pressed={c === shownColor}
              aria-label={c}
              title={c}
              className={`h-5 w-5 rounded-full ${TAG_COLOR_CLASSES[c].dot} ${
                c === shownColor
                  ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                  : "hover:ring-2 hover:ring-foreground/40"
              }`}
            />
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="w-full px-3 text-xs text-red-600">
          {error}
        </p>
      )}
    </>
  );
}
