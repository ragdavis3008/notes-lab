import Link from "next/link";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import type { SidebarSelection } from "@/components/sidebar";
import {
  listCollections,
  listNoteIdsWithAllTags,
  listNotes,
  listNotesByCollection,
  listTags,
  listTagsByNoteIds,
  listUncollectedNotes,
} from "@/lib/db";
import { NoteCard } from "@/components/note-card";
import { PinIcon } from "@/components/pin-button";
import { SearchBox } from "@/components/search-box";
import { filterHref, normalizeSearch, parseTagIds } from "@/lib/filter-url";
import type { Note, Tag } from "@/lib/types";
import { isUuid } from "@/lib/uuid";

const PREVIEW_LENGTH = 120;

type Params = {
  collection?: string | string[];
  tag?: string | string[];
  q?: string | string[];
};
type SearchParams = Promise<Params>;

function readCollection(params: Params) {
  const raw = params.collection;
  return Array.isArray(raw) ? raw[0] : raw;
}

function preview(content: string | null) {
  if (!content) return "";
  return content.length > PREVIEW_LENGTH
    ? content.slice(0, PREVIEW_LENGTH).trimEnd() + "…"
    : content;
}

function BackToAll() {
  return (
    <Link href="/" className="text-sm underline">
      Back to all notes
    </Link>
  );
}

// Loads the notes (and the heading) for the view chosen by ?collection=.
async function Content({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const collectionParam = readCollection(params);
  // Blank or spaces-only search is "" and shows the normal list.
  const search = normalizeSearch(params.q);

  let title = "All notes";
  let emptyMessage = "No notes yet. Create your first note.";
  let notes;
  let selectedTags: Tag[] = [];
  let tagsByNote = new Map<number, Tag[]>();
  try {
    // Ignore tag ids that match no tag (for example from an edited URL).
    const wantedTagIds = parseTagIds(params.tag);
    if (wantedTagIds.length > 0) {
      selectedTags = (await listTags()).filter((t) => wantedTagIds.includes(t.id));
    }

    if (collectionParam === undefined || collectionParam === "") {
      notes = await listNotes(search);
    } else if (collectionParam === "uncollected") {
      title = "Uncollected";
      emptyMessage = "No uncollected notes.";
      notes = await listUncollectedNotes(search);
    } else {
      // Only accept an id that belongs to an existing collection.
      // Postgres returns lowercase uuids, so lowercase the param first.
      const wantedId = collectionParam.toLowerCase();
      const collection = isUuid(wantedId)
        ? (await listCollections()).find((c) => c.id === wantedId)
        : undefined;
      if (!collection) {
        return (
          <div>
            <h1 className="mb-2 text-2xl font-semibold">Collection not found</h1>
            <p className="mb-4 text-foreground/70">
              This collection doesn&apos;t exist.
            </p>
            <BackToAll />
          </div>
        );
      }
      title = collection.name;
      emptyMessage = "No notes in this collection yet.";
      notes = await listNotesByCollection(collection.id, search);
    }

    // The tag filter narrows the collection's notes: only notes with ALL tags.
    if (selectedTags.length > 0) {
      const withAllTags = await listNoteIdsWithAllTags(selectedTags.map((t) => t.id));
      // Relies on the list already being sorted pinned-first (filter keeps the order).
      notes = notes.filter((n) => withAllTags.has(n.id));
      emptyMessage = "No notes match the selected tags.";
    }
    // The search message wins: it names what the user typed.
    if (search) emptyMessage = `No notes match your search "${search}".`;
    tagsByNote = await listTagsByNoteIds(notes.map((n) => n.id));
  } catch (e) {
    console.error("Loading notes failed:", e);
    return (
      <p className="text-red-600">
        Error loading notes: {e instanceof Error ? e.message : "unknown error"}
      </p>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <Link
          href="/notes/new"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          New note
        </Link>
      </div>
      {selectedTags.length > 0 && (
        <p className="mb-4 text-sm text-foreground/70">
          Tags: {selectedTags.map((t) => t.name).join(", ")}{" "}
          <Link
            href={filterHref(collectionParam || "all", [], search)}
            className="underline"
          >
            Clear tag filter
          </Link>
        </p>
      )}
      <NotesList
        notes={notes}
        tagsByNote={tagsByNote}
        emptyMessage={emptyMessage}
      />
    </>
  );
}

function NotesList({
  notes,
  tagsByNote,
  emptyMessage,
}: {
  notes: Note[];
  tagsByNote: Map<number, Tag[]>;
  emptyMessage: string;
}) {
  if (notes.length === 0) {
    return (
      <p className="break-words rounded-md border border-dashed border-foreground/20 p-8 text-center text-foreground/70">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {notes.map((note) => (
        <NoteCard key={note.id} noteId={note.id} pinned={note.pinned}>
          {/* The pin button is a sibling of the link: a button inside a link is invalid.
              The ::after layer stretches the link over the whole card and draws the focus ring. */}
          <Link
            href={`/notes/${note.id}`}
            className="block p-4 pr-16 outline-none after:absolute after:inset-0 after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-foreground"
          >
            <h2 className="font-medium">
              {note.pinned && (
                <span className="mr-2 inline-flex items-center gap-1 align-middle text-xs font-normal text-foreground/70">
                  <PinIcon filled />
                  Pinned
                </span>
              )}
              {note.title}
            </h2>
            {note.content && (
              <p className="mt-1 whitespace-pre-line text-sm text-foreground/70">
                {preview(note.content)}
              </p>
            )}
            {(tagsByNote.get(note.id) ?? []).length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1">
                {tagsByNote.get(note.id)!.map((tag) => (
                  <li
                    key={tag.id}
                    className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs"
                  >
                    {tag.name}
                  </li>
                ))}
              </ul>
            )}
          </Link>
        </NoteCard>
      ))}
    </ul>
  );
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  // A promise: searchParams may only be read behind Suspense (cacheComponents).
  const selected: Promise<SidebarSelection> = searchParams.then(
    (p) => readCollection(p) || "all",
  );
  const selectedTags: Promise<number[]> = searchParams.then((p) =>
    parseTagIds(p.tag),
  );
  const searchText: Promise<string> = searchParams.then((p) =>
    normalizeSearch(p.q),
  );
  return (
    <AppShell
      selected={selected}
      selectedTags={selectedTags}
      searchText={searchText}
    >
      <Suspense fallback={null}>
        <SearchBox />
      </Suspense>
      <Suspense fallback={<p>Loading notes...</p>}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AppShell>
  );
}
