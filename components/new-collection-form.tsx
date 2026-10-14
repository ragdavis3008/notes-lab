"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { createCollectionAction } from "@/app/actions";

export function NewCollectionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createCollectionAction,
    undefined,
  );

  // Safety net: the action already revalidates, but asking the router to
  // refetch after every successful save guarantees the sidebar shows it.
  useEffect(() => {
    if (state?.saved) router.refresh();
  }, [state?.saved, router]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md px-3 py-2 text-left text-sm text-foreground/70 hover:bg-foreground/5"
      >
        + New collection
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 px-1">
      <label htmlFor="collection-name" className="sr-only">
        Collection name
      </label>
      <input
        // A new key after a successful save clears the input.
        key={state?.saved ?? "form"}
        id="collection-name"
        name="name"
        placeholder="Collection name"
        autoFocus
        defaultValue={state?.value ?? ""}
        className="rounded-md border border-foreground/20 bg-background px-2 py-1 text-sm"
      />
      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-foreground px-3 py-1 text-sm font-medium text-background disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-foreground/70 hover:underline"
        >
          Close
        </button>
      </div>
    </form>
  );
}
