"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { TagDot } from "@/components/tag-pill";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Tag } from "@/lib/types";

type Props = {
  tags: Tag[];
  initialSelectedIds: number[];
};

// Part of the note form: nothing is saved here. The choices travel with the form
// as hidden fields: `tag_id` for each selected existing tag and `new_tag` for each
// tag typed in below, which the server creates when the note is saved.
export function TagMultiSelect({ tags, initialSelectedIds }: Props) {
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);
  const [newNames, setNewNames] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  const selectedTags = tags.filter((t) => selectedIds.includes(t.id));
  const nothingSelected = selectedTags.length === 0 && newNames.length === 0;

  function toggleTag(id: number, checked: boolean) {
    setSelectedIds((ids) =>
      checked ? [...ids, id] : ids.filter((existing) => existing !== id),
    );
  }

  function addDraft() {
    const name = draft.trim().toLowerCase();
    if (name === "") return;
    // Tag names are saved in lowercase, so a typed name can match an existing tag.
    const existing = tags.find((t) => t.name === name);
    if (existing) {
      setSelectedIds((ids) => (ids.includes(existing.id) ? ids : [...ids, existing.id]));
    } else {
      setNewNames((names) => (names.includes(name) ? names : [...names, name]));
    }
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="tags" className="text-sm font-medium">
        Tags <span className="text-foreground/50">(optional)</span>
      </label>
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="tag_id" value={id} />
      ))}
      {newNames.map((name) => (
        <input key={name} type="hidden" name="new_tag" value={name} />
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            id="tags"
            type="button"
            className="field flex min-h-10 items-center justify-between gap-2 text-left"
          >
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {nothingSelected && <span className="text-foreground/60">No tags</span>}
              {selectedTags.map((tag) => (
                <span key={tag.id} className="flex items-center gap-1.5 text-sm">
                  <TagDot color={tag.color} />
                  {tag.name}
                </span>
              ))}
              {newNames.map((name) => (
                <span key={name} className="flex items-center gap-1.5 text-sm">
                  <TagDot color="gray" />
                  {name}
                </span>
              ))}
            </span>
            <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-foreground/60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-[var(--radix-dropdown-menu-trigger-width)]"
        >
          {tags.length === 0 && newNames.length === 0 && (
            <p className="px-2 py-1.5 text-sm text-foreground/60">
              No tags yet. Add one below.
            </p>
          )}
          {tags.map((tag) => (
            <DropdownMenuCheckboxItem
              key={tag.id}
              checked={selectedIds.includes(tag.id)}
              onCheckedChange={(checked) => toggleTag(tag.id, checked)}
              // Keep the menu open so several tags can be picked in a row.
              onSelect={(e) => e.preventDefault()}
            >
              <span className="flex items-center gap-2">
                <TagDot color={tag.color} />
                {tag.name}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
          {/* Tags typed in below, not saved yet. Unticking one drops it. */}
          {newNames.map((name) => (
            <DropdownMenuCheckboxItem
              key={name}
              checked
              onCheckedChange={() =>
                setNewNames((names) => names.filter((n) => n !== name))
              }
              onSelect={(e) => e.preventDefault()}
            >
              <span className="flex items-center gap-2">
                <TagDot color="gray" />
                {name} <span className="text-foreground/60">(new)</span>
              </span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="mt-1 flex items-center gap-2">
        <input
          aria-label="New tag name"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter adds the tag instead of submitting the whole note form.
            if (e.key === "Enter") {
              e.preventDefault();
              addDraft();
            }
          }}
          placeholder="Add a tag"
          className="field flex-1"
        />
        <button
          type="button"
          onClick={addDraft}
          className="shrink-0 rounded-full bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/20"
        >
          Add
        </button>
      </div>
      <p className="text-xs text-foreground/60">Saved with the note</p>
    </div>
  );
}
