"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { createCollectionAction } from "@/app/actions";

export function NewCollectionForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary/10"
      >
        + New collection
      </button>
    );
  }

  return <CollectionNameForm onClose={() => setOpen(false)} />;
}

// Its action state lives only while the form is open, so closing and
// reopening starts with no old error or rejected value.
function CollectionNameForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createCollectionAction,
    undefined,
  );

  // Safety net: the action already revalidates, but asking the router to
  // refetch after every successful save guarantees the sidebar shows it.
  useEffect(() => {
    if (state?.saved) router.refresh();
  }, [state?.saved, router]);

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
        className="rounded-lg bg-card px-3 py-1.5 text-sm shadow-sm outline-none ring-1 ring-foreground/10 focus-visible:ring-2 focus-visible:ring-ring"
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
          className="rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-foreground/70 hover:underline"
        >
          Close
        </button>
      </div>
    </form>
  );
}
