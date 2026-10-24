"use client";

import { MoreHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { deleteCollectionAction } from "@/app/actions";
import { ConfirmPanel } from "@/components/confirm-panel";
import { RenameForm } from "@/components/rename-collection-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Sits next to a collection's name, outside the group's toggle button and link
// (components/collapsible-group.tsx), so clicking it never opens or closes the
// group and never navigates.
export function CollectionMenu({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"menu" | "rename" | "delete">("menu");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  // Stable identity, so RenameForm's effect only re-runs when a save happens.
  const close = useCallback(() => {
    setMode("menu");
    setError(undefined);
  }, []);

  function confirmDelete() {
    startTransition(async () => {
      setError(undefined);
      const result = await deleteCollectionAction(id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      // The open view was this collection, which no longer exists: go back to
      // all notes but keep the tag filter and search.
      if (searchParams.get("collection")?.toLowerCase() === id) {
        const next = new URLSearchParams(searchParams);
        next.delete("collection");
        const query = next.toString();
        router.push(query ? `/notes?${query}` : "/notes");
      }
    });
  }

  if (mode === "rename") {
    return <RenameForm id={id} name={name} onClose={close} />;
  }

  if (mode === "delete") {
    return (
      <ConfirmPanel
        message="Delete this collection? Its notes will move to Uncollected."
        pending={pending}
        error={error}
        onConfirm={confirmDelete}
        onCancel={close}
        className="absolute inset-x-0 top-0 z-10 rounded-xl bg-card p-3 shadow-lg ring-1 ring-foreground/5"
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for collection ${name}`}
        // h-9 matches the height of a collection row in the sidebar (py-2 plus
        // text-sm line height). The row reserves this button's width with pr-9
        // in components/sidebar.tsx; change both together.
        className="absolute right-1 top-0 flex h-9 w-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-foreground/5 hover:text-primary"
      >
        <MoreHorizontal aria-hidden size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => setMode("rename")}>Rename</DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => setMode("delete")}
          className="text-red-600 focus:text-red-600"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
