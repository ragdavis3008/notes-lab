"use client";

import { useEffect, useState, useTransition } from "react";
import { setNoteCollectionAction } from "@/app/actions";
import type { Collection } from "@/lib/types";

type Props = {
  noteId: number;
  collections: Collection[];
  currentCollectionId: string | null;
};

export function CollectionSelect({
  noteId,
  collections,
  currentCollectionId,
}: Props) {
  const [value, setValue] = useState(currentCollectionId ?? "");
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  // "Saved" is only shown for a moment.
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [saved]);

  function onChange(next: string) {
    const previous = value;
    setValue(next);
    setError(undefined);
    setSaved(false);
    startTransition(async () => {
      const result = await setNoteCollectionAction(noteId, next);
      if (result?.error) {
        setValue(previous);
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <div className="mb-6 flex flex-col gap-1">
      <label htmlFor="collection" className="text-sm font-medium">
        Collection
      </label>
      <div className="flex items-center gap-3">
        <select
          id="collection"
          value={value}
          disabled={pending}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border border-foreground/20 bg-background px-3 py-2"
        >
          <option value="">No collection</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {pending && <span className="text-sm text-foreground/70">Saving...</span>}
        {saved && !pending && (
          <span role="status" className="text-sm text-green-600">
            Saved
          </span>
        )}
      </div>
      <p className="text-xs text-foreground/60">Saves automatically</p>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
