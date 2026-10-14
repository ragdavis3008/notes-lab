"use client";

import { useEffect, useState, useTransition } from "react";
import {
  addTagToNoteAction,
  removeTagFromNoteAction,
  type TagState,
} from "@/app/actions";
import { TAG_COLOR_CLASSES } from "@/lib/tag-colors";
import type { Tag } from "@/lib/types";

type Props = {
  noteId: number;
  tags: Tag[];
};

export function NoteTags({ noteId, tags }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  // "Saved" is only shown for a moment.
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [saved]);

  function run(action: () => Promise<TagState>, onOk?: () => void) {
    setError(undefined);
    setSaved(false);
    startTransition(async () => {
      let result: TagState;
      try {
        result = await action();
      } catch (e) {
        console.error("Tag action failed:", e);
        setError("Something went wrong. Please try again.");
        return;
      }
      // Only an explicit ok counts as saved.
      if ("ok" in result) {
        onOk?.();
        setSaved(true);
      } else {
        setError(result.error);
      }
    });
  }

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    run(() => addTagToNoteAction(noteId, name), () => setName(""));
  }

  return (
    <div className="mb-6 flex flex-col gap-1">
      <label htmlFor="new-tag" className="text-sm font-medium">
        Tags
      </label>
      {tags.length === 0 ? (
        <p className="text-sm text-foreground/60">No tags yet.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className={`flex items-center gap-1 rounded-full py-1 pl-3 pr-1 text-sm ${TAG_COLOR_CLASSES[tag.color].pill}`}
            >
              {tag.name}
              <button
                type="button"
                disabled={pending}
                aria-label={`Remove tag ${tag.name}`}
                onClick={() => run(() => removeTagFromNoteAction(noteId, tag.id))}
                className="rounded-full px-2 hover:bg-foreground/20 disabled:opacity-50"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onAdd} className="mt-1 flex items-center gap-3">
        <input
          id="new-tag"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
          placeholder="Add a tag"
          className="rounded-md border border-foreground/20 bg-background px-3 py-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-foreground/20 px-3 py-2 text-sm disabled:opacity-50"
        >
          Add
        </button>
        {pending && <span className="text-sm text-foreground/70">Saving...</span>}
        {saved && !pending && (
          <span role="status" className="text-sm text-green-600">
            Saved
          </span>
        )}
      </form>
      <p className="text-xs text-foreground/60">Saves automatically</p>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
