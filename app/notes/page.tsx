import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import type { SidebarSelection } from "@/components/sidebar";
import { requireUser } from "@/lib/auth";
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
import { SearchBox } from "@/components/search-box";
import { TagDot } from "@/components/tag-pill";
import { filterHref, normalizeSearch, parseTagIds } from "@/lib/filter-url";
import { timeAgo } from "@/lib/time-ago";
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
    <Link href="/notes" className="text-sm text-primary hover:underline">
      Back to all notes
    </Link>
  );
}

// Loads the notes (and the heading) for the view chosen by ?collection=.
async function Content({ searchParams }: { searchParams: SearchParams }) {
  // Also checked here: a layout check does not re-run on every navigation.
  await requireUser();
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
            <h1 className="mb-2 text-2xl font-bold">Collection not found</h1>
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
    unstable_rethrow(e);
    console.error("Loading notes failed:", e);
    return (
      <p className="text-red-600">
        Error loading notes: {e instanceof Error ? e.message : "unknown error"}
      </p>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="min-w-0 break-words text-3xl font-bold tracking-tight">{title}</h1>
        <Link
          href="/notes/new"
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          New note
        </Link>
      </div>
      {selectedTags.length > 0 && (
        <p className="mb-4 text-sm text-foreground/70">
          Tags: {selectedTags.map((t) => t.name).join(", ")}{" "}
          <Link
            href={filterHref(collectionParam || "all", [], search)}
            className="text-primary hover:underline"
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
      <p className="break-words rounded-2xl bg-card p-8 text-center text-foreground/70 shadow-sm">
        {emptyMessage}
      </p>
    );
  }

  // The list is already sorted pinned-first, so the two groups keep their order.
  const pinned = notes.filter((n) => n.pinned);
  const others = notes.filter((n) => !n.pinned);
  // "Notes" is only a heading when it needs to tell the groups apart.
  const groups = [
    { label: "Pinned", items: pinned },
    { label: pinned.length > 0 ? "Notes" : "", items: others },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
      {groups.map((group, i) => (
        <section key={group.label} className={i > 0 ? "border-t border-border" : ""}>
          {group.label && (
            <h2 className="px-4 pb-1 pt-3 text-sm font-bold">{group.label}</h2>
          )}
          <ul className="divide-y divide-border">
            {group.items.map((note) => (
              <NoteCard
                key={note.id}
                noteId={note.id}
                noteTitle={note.title}
                pinned={note.pinned}
              >
                {/* The pin, edit and delete buttons are siblings of the link: a button inside a link is invalid.
                    The ::after layer stretches the link over the whole row and draws the focus ring.
                    pr-28 keeps the text clear of those three buttons. */}
                <Link
                  href={`/notes/${note.id}`}
                  className="block p-4 pr-28 outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                >
                  {/* truncate: a long title is cut off with "…" after one line. */}
                  <h3 className="truncate font-semibold">{note.title}</h3>
                  {note.content && (
                    <p className="mt-1 whitespace-pre-line break-words text-sm text-foreground/60">
                      {preview(note.content)}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    {(tagsByNote.get(note.id) ?? []).length > 0 && (
                      // relative z-10 lifts the dots above the stretched link layer,
                      // so hovering one shows the tag name.
                      <ul className="relative z-10 flex flex-wrap gap-1.5">
                        {tagsByNote.get(note.id)!.map((tag) => (
                          <li key={tag.id}>
                            <TagDot color={tag.color} name={tag.name} />
                          </li>
                        ))}
                      </ul>
                    )}
                    <span className="ml-auto shrink-0 text-xs text-foreground/50">
                      Edited {timeAgo(note.updated_at ?? note.created_at)}
                    </span>
                  </div>
                </Link>
              </NoteCard>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function NotesPage({ searchParams }: { searchParams: SearchParams }) {
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
