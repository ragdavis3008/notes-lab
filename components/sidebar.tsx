import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { CollectionMenu } from "@/components/collection-menu";
import { NewCollectionForm } from "@/components/new-collection-form";
import { TagColorPicker } from "@/components/tag-color-picker";
import { TagDot } from "@/components/tag-pill";
import { requireUser } from "@/lib/auth";
import { listCollections, listNotes, listTags, listTagsByNoteIds } from "@/lib/db";
import { filterHref } from "@/lib/filter-url";
import type { Collection, Note, Tag } from "@/lib/types";

export type SidebarSelection = "all" | "uncollected" | (string & {});

// Promises, because reading searchParams/params has to happen behind Suspense.
type Props = {
  selected: Promise<SidebarSelection>;
  // Ids of the tags chosen in ?tag=.
  selectedTags: Promise<number[]>;
  // Search text from ?q=, kept in every link so the search survives navigation.
  searchText?: Promise<string>;
  // Route params of the note page, so the group holding that note opens.
  activeNote?: Promise<{ id: string }>;
};

const linkBase = "rounded-md px-3 py-2 hover:bg-foreground/5";
const activeLink = "bg-foreground/10 font-medium";
const headingClass = "mt-3 px-3 text-xs font-bold uppercase text-foreground/50";

function NoteLinks({
  notes,
  tagsByNote,
  empty,
}: {
  notes: Note[];
  tagsByNote: Map<number, Tag[]>;
  empty: string;
}) {
  if (notes.length === 0) {
    return <p className="px-3 py-1 text-foreground/60">{empty}</p>;
  }
  return (
    <ul className="flex flex-col">
      {notes.map((note) => {
        const tags = tagsByNote.get(note.id) ?? [];
        return (
          <li key={note.id}>
            <Link
              href={`/notes/${note.id}`}
              className="flex items-center gap-2 rounded-md px-3 py-1 text-foreground/80 hover:bg-foreground/5"
            >
              <span className="min-w-0 flex-1 truncate">{note.title}</span>
              {tags.length > 0 && (
                <span className="flex shrink-0 gap-1">
                  {tags.map((tag) => (
                    <TagDot key={tag.id} color={tag.color} name={tag.name} />
                  ))}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Group({
  label,
  count,
  href,
  selected,
  open,
  notes,
  tagsByNote,
  empty,
  action,
}: {
  label: string;
  // Number of notes in the group, shown after the name.
  count: number;
  href: string;
  selected: boolean;
  open: boolean;
  notes: Note[];
  tagsByNote: Map<number, Tag[]>;
  empty: string;
  // Control shown beside the label. It sits outside the <summary>, so using
  // it never toggles the group.
  action?: ReactNode;
}) {
  return (
    <div className="relative">
      <details open={open} className="group">
        {/* pr-9 keeps the label clear of the ⋯ button, which is as tall as
            this row. See components/collection-menu.tsx. */}
        <summary
          className={`flex cursor-pointer list-none items-center gap-1 ${action ? "pr-9" : ""}`}
        >
          <span
            aria-hidden
            className="w-4 text-center text-foreground/50 transition-transform group-open:rotate-90"
          >
            ›
          </span>
          <Link
            href={href}
            className={`${linkBase} flex min-w-0 flex-1 items-center gap-2 ${selected ? activeLink : ""}`}
          >
            <span className="min-w-0 flex-1 truncate">{label}</span>
            <span className="shrink-0 text-xs text-foreground/50">{count}</span>
          </Link>
        </summary>
        <div className="ml-4">
          <NoteLinks notes={notes} tagsByNote={tagsByNote} empty={empty} />
        </div>
      </details>
      {action}
    </div>
  );
}

function Groups({
  selected,
  tagIds,
  search,
  activeNoteId,
  collections,
  notes,
  tagsByNote,
  loadError,
}: {
  selected: SidebarSelection;
  tagIds: number[];
  search: string;
  activeNoteId: number | null;
  collections: Collection[];
  notes: Note[];
  tagsByNote: Map<number, Tag[]>;
  loadError?: string;
}) {
  if (loadError !== undefined) {
    return <p className="px-3 text-red-600">Error loading collections: {loadError}</p>;
  }

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
            count={inCollection.length}
            href={filterHref(c.id, tagIds, search)}
            selected={selected === c.id}
            open={selected === c.id || holdsActiveNote(inCollection)}
            notes={inCollection}
            tagsByNote={tagsByNote}
            empty="No notes in this collection yet"
            action={<CollectionMenu id={c.id} name={c.name} />}
          />
        );
      })}
      <Group
        label="Uncollected"
        count={uncollected.length}
        href={filterHref("uncollected", tagIds, search)}
        selected={selected === "uncollected"}
        open={selected === "uncollected" || holdsActiveNote(uncollected)}
        notes={uncollected}
        tagsByNote={tagsByNote}
        empty="No uncollected notes"
      />
    </>
  );
}

// Clicking a tag adds it to (or removes it from) the filter, keeping the collection.
function TagList({
  selected,
  tagIds,
  search,
  tags,
  noteCounts,
  loadError,
}: {
  selected: SidebarSelection;
  tagIds: number[];
  search: string;
  tags: Tag[];
  // Tag id -> number of notes with that tag.
  noteCounts: Map<number, number>;
  loadError?: string;
}) {
  if (loadError !== undefined) {
    return <p className="px-3 text-red-600">Error loading tags: {loadError}</p>;
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
            <li key={tag.id} className="flex flex-wrap items-center">
              {/* The colour picker is the tag's one dot: click it to change the colour. */}
              <TagColorPicker tagId={tag.id} tagName={tag.name} color={tag.color} />
              <Link
                href={filterHref(selected, next, search)}
                aria-current={isSelected ? "true" : undefined}
                className={`${linkBase} flex min-w-0 flex-1 items-center gap-2 ${isSelected ? activeLink : ""}`}
              >
                <span className="min-w-0 flex-1 truncate">
                  {isSelected ? "✓ " : ""}
                  {tag.name}
                </span>
                <span className="shrink-0 text-xs text-foreground/50">
                  {noteCounts.get(tag.id) ?? 0}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      {tagIds.length > 0 && (
        <Link
          href={filterHref(selected, [], search)}
          className={`${linkBase} underline`}
        >
          Clear tag filter
        </Link>
      )}
    </>
  );
}

async function Nav({
  selected: selectedPromise,
  selectedTags,
  searchText = Promise.resolve(""),
  activeNote,
}: Props) {
  await requireUser();
  const [selected, urlTagIds, search] = await Promise.all([
    selectedPromise,
    selectedTags,
    searchText,
  ]);

  const params = activeNote ? await activeNote : undefined;
  const activeNoteId = params && /^\d+$/.test(params.id) ? Number(params.id) : null;

  // The headings need both counts, so everything is loaded here, once.
  let collections: Collection[] = [];
  let notes: Note[] = [];
  let tags: Tag[] = [];
  let tagsByNote = new Map<number, Tag[]>();
  let loadError: string | undefined;
  try {
    [collections, notes, tags] = await Promise.all([
      listCollections(),
      listNotes(),
      listTags(),
    ]);
    tagsByNote = await listTagsByNoteIds(notes.map((n) => n.id));
  } catch (e) {
    unstable_rethrow(e);
    console.error("Sidebar failed:", e);
    loadError = e instanceof Error ? e.message : "unknown error";
  }

  // Ignore ids from the URL that match no existing tag, like app/page.tsx does.
  const tagIds = loadError
    ? []
    : urlTagIds.filter((id) => tags.some((t) => t.id === id));

  const noteCounts = new Map<number, number>();
  for (const noteTags of tagsByNote.values()) {
    for (const tag of noteTags) {
      noteCounts.set(tag.id, (noteCounts.get(tag.id) ?? 0) + 1);
    }
  }

  return (
    <nav className="flex flex-col gap-1 text-sm">
      <Link
        href="/notes/new"
        className="rounded-md px-3 py-2 text-foreground/70 hover:bg-foreground/5"
      >
        + New note
      </Link>
      <Link
        href={filterHref("all", tagIds, search)}
        className={`${linkBase} ${selected === "all" ? activeLink : ""}`}
      >
        All notes
      </Link>
      <p className={headingClass}>
        Collections{loadError === undefined ? ` ${collections.length}` : ""}
      </p>
      <Groups
        selected={selected}
        tagIds={tagIds}
        search={search}
        activeNoteId={activeNoteId}
        collections={collections}
        notes={notes}
        tagsByNote={tagsByNote}
        loadError={loadError}
      />
      <NewCollectionForm />
      <p className={headingClass}>
        Tags{loadError === undefined ? ` ${tags.length}` : ""}
      </p>
      <TagList
        selected={selected}
        tagIds={tagIds}
        search={search}
        tags={tags}
        noteCounts={noteCounts}
        loadError={loadError}
      />
    </nav>
  );
}

export function Sidebar(props: Props) {
  return (
    <aside className="w-full shrink-0 border-b border-foreground/10 p-4 sm:w-64 sm:border-b-0 sm:border-r">
      <Link href="/notes" className="mb-4 block text-lg font-semibold sm:mb-6">
        Notes
      </Link>
      <Suspense fallback={<p className="px-3 text-sm">Loading...</p>}>
        <Nav {...props} />
      </Suspense>
    </aside>
  );
}
