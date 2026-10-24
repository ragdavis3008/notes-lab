"use client";

import { MoreHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { deleteTagAction } from "@/app/actions";
import { ConfirmPanel } from "@/components/confirm-panel";
import { RenameTagForm } from "@/components/rename-tag-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Sits at the right end of a tag's row in the sidebar, outside its link, so
// clicking it never changes the tag filter. Works like the collection menu.
export function TagMenu({ id, name }: { id: number; name: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"menu" | "rename" | "delete">("menu");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  // Stable identity, so RenameTagForm's effect only re-runs when a save happens.
  const close = useCallback(() => {
    setMode("menu");
    setError(undefined);
  }, []);

  function confirmDelete() {
    startTransition(async () => {
      setError(undefined);
      const result = await deleteTagAction(id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      // The tag may be part of the filter in the URL. It no longer exists, so take
      // it out and keep the collection, the other tags and the search.
      const tagParams = searchParams.getAll("tag");
      if (tagParams.includes(String(id))) {
        const next = new URLSearchParams(searchParams);
        next.delete("tag");
        for (const value of tagParams) {
          if (value !== String(id)) next.append("tag", value);
        }
        const query = next.toString();
        router.push(query ? `/notes?${query}` : "/notes");
      }
    });
  }

  if (mode === "rename") {
    return <RenameTagForm id={id} name={name} onClose={close} />;
  }

  if (mode === "delete") {
    return (
      <ConfirmPanel
        message="Delete this tag? It will be removed from its notes."
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
        aria-label={`Actions for tag ${name}`}
        // h-9 matches the height of a tag row in the sidebar (py-2 plus text-sm
        // line height). The row reserves this button's width with pr-9 in
        // components/sidebar.tsx; change both together.
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
