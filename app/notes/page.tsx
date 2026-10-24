import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { cache, Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { DueFilterChips } from "@/components/due-filter-chips";
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
import { NotesList } from "@/components/notes-list";
import { SearchBox } from "@/components/search-box";
import {
  isDueWithin7Days,
  isOverdue,
  parseDueFilter,
  todayString,
  type DueFilter,
} from "@/lib/due-date";
import { filterHref, normalizeSearch, parseTagIds } from "@/lib/filter-url";
import type { Note, Tag } from "@/lib/types";
import { isUuid } from "@/lib/uuid";

type Params = {
  collection?: string | string[];
  tag?: string | string[];
  q?: string | string[];
  due?: string | string[];
};
type SearchParams = Promise<Params>;

function readCollection(params: Params) {
  const raw = params.collection;
  return Array.isArray(raw) ? raw[0] : raw;
}

function BackToAll() {
  return (
    <Link href="/notes" className="text-sm text-primary hover:underline">
      Back to all notes
    </Link>
  );
}

type Loaded =
  | { found: false }
  | {
      found: true;
      title: string;
      emptyMessage: string;
      // Narrowed by collection, search and tags, but not yet by the due date chip.
      notes: Note[];
      selectedTags: Tag[];
    };

// Loads the notes for the collection, search and tag filters in the URL. Cached for
// one request, so the due date chips and the list share one set of queries.
const loadNotes = cache(async (params: Params): Promise<Loaded> => {
  const collectionParam = readCollection(params);
  // Blank or spaces-only search is "" and shows the normal list.
  const search = normalizeSearch(params.q);

  let title = "All notes";
  let emptyMessage = "No notes yet. Create your first note.";
  let notes;
  let selectedTags: Tag[] = [];

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
    if (!collection) return { found: false };
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
  return { found: true, title, emptyMessage, notes, selectedTags };
});

// The three due date chips above the search bar. Each chip keeps the collection,
// tag and search filters and counts the notes in that view.
async function DueChips({ searchParams }: { searchParams: SearchParams }) {
  await requireUser();
  const params = await searchParams;
  // After requireUser() and searchParams, so Next.js does not warn about the clock
  // being read while prerendering.
  const today = todayString();

  let loaded;
  try {
    loaded = await loadNotes(params);
  } catch (e) {
    unstable_rethrow(e);
    // Content shows the error; the chips simply stay away.
    return null;
  }
  if (!loaded.found) return null;

  const collection = readCollection(params) || "all";
  const tagIds = loaded.selectedTags.map((t) => t.id);
  const search = normalizeSearch(params.q);
  const current = parseDueFilter(params.due);
  const chips: { filter: DueFilter; label: string; count: number }[] = [
    {
      filter: "overdue",
      label: "Overdue",
      count: loaded.notes.filter((n) => isOverdue(n.due_date, today)).length,
    },
    {
      filter: "week",
      label: "Due in 7 days",
      count: loaded.notes.filter((n) => isDueWithin7Days(n.due_date, today)).length,
    },
    { filter: "all", label: "All", count: loaded.notes.length },
  ];

  return (
    <DueFilterChips
      chips={chips.map((c) => ({
        label: c.label,
        count: c.count,
        href: filterHref(collection, tagIds, search, c.filter),
        selected: c.filter === current,
      }))}
    />
  );
}

// Loads the notes (and the heading) for the view chosen by ?collection=.
async function Content({ searchParams }: { searchParams: SearchParams }) {
  // Also checked here: a layout check does not re-run on every navigation.
  await requireUser();
  const params = await searchParams;
  const collectionParam = readCollection(params);
  const search = normalizeSearch(params.q);
  // After requireUser() and searchParams (see DueChips).
  const today = todayString();
  const due = parseDueFilter(params.due);

  let title;
  let emptyMessage;
  let notes: Note[];
  let selectedTags: Tag[];
  let tagsByNote = new Map<number, Tag[]>();
  try {
    const loaded = await loadNotes(params);
    if (!loaded.found) {
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
    ({ title, emptyMessage, notes, selectedTags } = loaded);

    // The due date chip narrows the view further. Its message wins, but the
    // search message still names what the user typed.
    if (due === "overdue") {
      notes = notes.filter((n) => isOverdue(n.due_date, today));
      if (!search) emptyMessage = "No overdue notes.";
    } else if (due === "week") {
      notes = notes.filter((n) => isDueWithin7Days(n.due_date, today));
      if (!search) emptyMessage = "No notes are due in the next 7 days.";
    }
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
            href={filterHref(collectionParam || "all", [], search, due)}
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
        today={today}
      />
    </>
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
        <DueChips searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={null}>
        <SearchBox />
      </Suspense>
      <Suspense fallback={<p>Loading notes...</p>}>
        <Content searchParams={searchParams} />
      </Suspense>
    </AppShell>
  );
}
