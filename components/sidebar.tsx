import Link from "next/link";
import { Suspense } from "react";
import { NewCollectionForm } from "@/components/new-collection-form";
import { listCollections, listNotes, listTags } from "@/lib/db";
import { filterHref } from "@/lib/filter-url";
import type { Note } from "@/lib/types";

export type SidebarSelection = "all" | "uncollected" | (string & {});

// Promises, because reading searchParams/params has to happen behind Suspense.
type Props = {
  selected: Promise<SidebarSelection>;
  // Ids of the tags chosen in ?tag=.
  selectedTags: Promise<number[]>;
  // Route params of the note page, so the group holding that note opens.
  activeNote?: Promise<{ id: string }>;
};

const linkBase = "rounded-md px-3 py-2 hover:bg-foreground/5";
const activeLink = "bg-foreground/10 font-medium";

function NoteLinks({ notes, empty }: { notes: Note[]; empty: string }) {
  if (notes.length === 0) {
    return <p className="px-3 py-1 text-foreground/60">{empty}</p>;
  }
  return (
    <ul className="flex flex-col">
      {notes.map((note) => (
        <li key={note.id}>
          <Link
            href={`/notes/${note.id}`}
            className="block truncate rounded-md px-3 py-1 text-foreground/80 hover:bg-foreground/5"
          >
            {note.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Group({
  label,
  href,
  selected,
  open,
  notes,
  empty,
}: {
  label: string;
  href: string;
  selected: boolean;
  open: boolean;
  notes: Note[];
  empty: string;
}) {
  return (
    <details open={open} className="group">
      <summary className="flex cursor-pointer list-none items-center gap-1">
        <span
          aria-hidden
          className="w-4 text-center text-foreground/50 transition-transform group-open:rotate-90"
        >
          ›
        </span>
        <Link
          href={href}
          className={`${linkBase} min-w-0 flex-1 truncate ${selected ? activeLink : ""}`}
        >
          {label}
        </Link>
      </summary>
      <div className="ml-4">
        <NoteLinks notes={notes} empty={empty} />
      </div>
    </details>
  );
}

async function Groups({
  selected,
  tagIds,
  activeNote,
}: {
  selected: SidebarSelection;
  tagIds: number[];
  activeNote?: Promise<{ id: string }>;
}) {
  let collections, notes;
  try {
    [collections, notes] = await Promise.all([listCollections(), listNotes()]);
  } catch (e) {
    return (
      <p className="px-3 text-red-600">
        Error loading collections: {e instanceof Error ? e.message : "unknown error"}
      </p>
    );
  }

  const params = activeNote ? await activeNote : undefined;
  const activeNoteId = params && /^\d+$/.test(params.id) ? Number(params.id) : null;
  const holdsActiveNote = (list: Note[]) =>
    activeNoteId !== null && list.some((n) => n.id === activeNoteId);

  const uncollected = notes.filter((n) => n.collection_id === null);

  return (
    <>
      {collections.length === 0 && (
        <p className="px-3 py-1 text-foreground/60">No collections yet</p>
      )}
      {collections.map((c) => {
        const inCollection = notes.filter((n) => n.collection_id === c.id);
        return (
          <Group
            key={c.id}
            label={c.name}
            href={filterHref(c.id, tagIds)}
            selected={selected === c.id}
            open={selected === c.id || holdsActiveNote(inCollection)}
            notes={inCollection}
            empty="No notes in this collection yet"
          />
        );
      })}
      <Group
        label="Uncollected"
        href={filterHref("uncollected", tagIds)}
        selected={selected === "uncollected"}
        open={selected === "uncollected" || holdsActiveNote(uncollected)}
        notes={uncollected}
        empty="No uncollected notes"
      />
    </>
  );
}

// Clicking a tag adds it to (or removes it from) the filter, keeping the collection.
async function TagList({
  selected,
  tagIds,
}: {
  selected: SidebarSelection;
  tagIds: number[];
}) {
  let tags;
  try {
    tags = await listTags();
  } catch (e) {
    console.error("TagList failed:", e);
    return (
      <p className="px-3 text-red-600">
        Error loading tags: {e instanceof Error ? e.message : "unknown error"}
      </p>
    );
  }

  if (tags.length === 0) {
    return <p className="px-3 py-1 text-foreground/60">No tags yet</p>;
  }
  return (
    <>
      <p className="px-3 py-1 text-xs text-foreground/60">
        Select several to see notes with all of them.
      </p>
      <ul className="flex flex-col">
        {tags.map((tag) => {
          const isSelected = tagIds.includes(tag.id);
          const next = isSelected
            ? tagIds.filter((id) => id !== tag.id)
            : [...tagIds, tag.id];
          return (
            <li key={tag.id}>
              <Link
                href={filterHref(selected, next)}
                aria-current={isSelected ? "true" : undefined}
                className={`${linkBase} block truncate ${isSelected ? activeLink : ""}`}
              >
                {isSelected ? "✓ " : ""}
                {tag.name}
              </Link>
            </li>
          );
        })}
      </ul>
      {tagIds.length > 0 && (
        <Link href={filterHref(selected, [])} className={`${linkBase} underline`}>
          Clear tag filter
        </Link>
      )}
    </>
  );
}

async function Nav({
  selected: selectedPromise,
  selectedTags,
  activeNote,
}: Props) {
  const [selected, tagIds] = await Promise.all([selectedPromise, selectedTags]);
  return (
    <nav className="flex flex-col gap-1 text-sm">
      <Link
        href={filterHref("all", tagIds)}
        className={`${linkBase} ${selected === "all" ? activeLink : ""}`}
      >
        All notes
      </Link>
      <p className="mt-3 px-3 text-xs font-medium uppercase text-foreground/50">
        Collections
      </p>
      <Groups selected={selected} tagIds={tagIds} activeNote={activeNote} />
      <NewCollectionForm />
      <p className="mt-3 px-3 text-xs font-medium uppercase text-foreground/50">
        Tags
      </p>
      <TagList selected={selected} tagIds={tagIds} />
    </nav>
  );
}

export function Sidebar(props: Props) {
  return (
    <aside className="w-full shrink-0 border-b border-foreground/10 p-4 sm:w-64 sm:border-b-0 sm:border-r">
      <Link href="/" className="mb-4 block text-lg font-semibold sm:mb-6">
        Notes
      </Link>
      <Suspense fallback={<p className="px-3 text-sm">Loading...</p>}>
        <Nav {...props} />
      </Suspense>
    </aside>
  );
}
