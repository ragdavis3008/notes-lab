"use client";

import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useState } from "react";
import { renameCollectionAction } from "@/app/actions";

// Sits next to a collection's name, outside the group's <summary>, so clicking
// it never opens or closes the group and never navigates.
export function RenameCollectionButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [editing, setEditing] = useState(false);
  // Stable identity, so RenameForm's effect only re-runs when a save happens.
  const close = useCallback(() => setEditing(false), []);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Rename collection ${name}`}
        // h-9 matches the height of a collection row in the sidebar (py-2 plus
        // text-sm line height). The row reserves this button's width with pr-16
        // in components/sidebar.tsx; change both together.
        className="absolute right-1 top-0 flex h-9 items-center rounded-md px-2 text-xs text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
      >
        Rename
      </button>
    );
  }

  return <RenameForm id={id} name={name} onClose={close} />;
}

// Its action state lives only while the form is open, so closing and
// reopening starts with no old error or rejected value.
function RenameForm({
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
      className="absolute inset-x-0 top-0 z-10 flex flex-col gap-1 rounded-md border border-foreground/20 bg-background p-1 shadow-sm"
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
          className="min-w-0 flex-1 rounded-md border border-foreground/20 bg-background px-2 py-1 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background disabled:opacity-50"
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
