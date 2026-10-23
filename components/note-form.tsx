"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormState } from "@/app/actions";
import { TagMultiSelect } from "@/components/tag-multi-select";
import type { Collection, Tag } from "@/lib/types";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  collections: Collection[];
  tags: Tag[];
  initialTitle?: string;
  initialContent?: string;
  initialCollectionId?: string | null;
  initialTagIds?: number[];
  submitLabel: string;
};

// Used for both new and existing notes: everything is saved with the button.
export function NoteForm({
  action,
  collections,
  tags,
  initialTitle = "",
  initialContent = "",
  initialCollectionId = null,
  initialTagIds = [],
  submitLabel,
}: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  // Kept in state so the choice survives a failed save (the form resets after it).
  const [collectionId, setCollectionId] = useState(initialCollectionId ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={state?.values?.title ?? initialTitle}
          className="field"
        />
        {state?.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="collection" className="text-sm font-medium">
          Collection
        </label>
        <select
          id="collection"
          name="collection_id"
          value={collectionId}
          onChange={(e) => setCollectionId(e.target.value)}
          className="field"
        >
          <option value="">No collection</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <TagMultiSelect tags={tags} initialSelectedIds={initialTagIds} />
      <div className="flex flex-col gap-1">
        <label htmlFor="content" className="text-sm font-medium">
          Content <span className="text-foreground/50">(optional)</span>
        </label>
        <textarea
          id="content"
          name="content"
          rows={10}
          defaultValue={state?.values?.content ?? initialContent}
          className="field"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
        <Link href="/notes" className="text-sm text-primary hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
