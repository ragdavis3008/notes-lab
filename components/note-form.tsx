"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/app/actions";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initialTitle?: string;
  initialContent?: string;
  submitLabel: string;
};

export function NoteForm({
  action,
  initialTitle = "",
  initialContent = "",
  submitLabel,
}: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={initialTitle}
          className="rounded-md border border-foreground/20 bg-background px-3 py-2"
        />
        {state?.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="content" className="text-sm font-medium">
          Content <span className="text-foreground/50">(optional)</span>
        </label>
        <textarea
          id="content"
          name="content"
          rows={10}
          defaultValue={initialContent}
          className="rounded-md border border-foreground/20 bg-background px-3 py-2"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {pending ? "Saving..." : submitLabel}
        </button>
        <Link href="/" className="text-sm text-foreground/70 hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
