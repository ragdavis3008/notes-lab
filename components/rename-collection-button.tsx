"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { renameCollectionAction } from "@/app/actions";

// Opened from the collection's ⋯ menu (components/collection-menu.tsx).
// Its action state lives only while the form is open, so closing and
// reopening starts with no old error or rejected value.
export function RenameForm({
  id,
  name,
  onClose,
}: {
  id: string;
  name: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    renameCollectionAction.bind(null, id),
    undefined,
  );

  // Safety net: the action already revalidates, but asking the router to
  // refetch after every successful save guarantees the sidebar shows it.
  useEffect(() => {
    if (state?.saved) {
      router.refresh();
      onClose();
    }
  }, [state?.saved, router, onClose]);

  return (
    <form
      action={formAction}
      onKeyDown={(e) => {
        // Closing mid-save would hide an error from the server.
        if (e.key === "Escape" && !pending) onClose();
      }}
      className="absolute inset-x-0 top-0 z-10 flex flex-col gap-1 rounded-xl bg-card p-1.5 shadow-lg ring-1 ring-foreground/5"
    >
      <div className="flex items-center gap-1">
        <label htmlFor={`rename-${id}`} className="sr-only">
          New name for collection {name}
        </label>
        <input
          id={`rename-${id}`}
          name="name"
          autoFocus
          onFocus={(e) => e.currentTarget.select()}
          defaultValue={state?.value ?? name}
          className="min-w-0 flex-1 rounded-lg bg-muted px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-2 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="px-1 text-xs text-foreground/70 hover:underline disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {state?.error && (
        <p role="alert" className="px-1 text-xs text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
