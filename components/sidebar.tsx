import Link from "next/link";
import { Suspense } from "react";
import { NewCollectionForm } from "@/components/new-collection-form";
import { listCollections, listNotes } from "@/lib/db";
import type { Note } from "@/lib/types";

export type SidebarSelection = "all" | "uncollected" | (string & {});

// Promises, because reading searchParams/params has to happen behind Suspense.
type Props = {
  selected: Promise<SidebarSelection>;
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
  activeNote,
}: {
  selected: SidebarSelection;
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
            href={`/?collection=${c.id}`}
            selected={selected === c.id}
            open={selected === c.id || holdsActiveNote(inCollection)}
            notes={inCollection}
            empty="No notes in this collection yet"
          />
        );
      })}
      <Group
        label="Uncollected"
        href="/?collection=uncollected"
        selected={selected === "uncollected"}
        open={selected === "uncollected" || holdsActiveNote(uncollected)}
        notes={uncollected}
        empty="No uncollected notes"
      />
    </>
  );
}

async function Nav({ selected: selectedPromise, activeNote }: Props) {
  const selected = await selectedPromise;
  return (
    <nav className="flex flex-col gap-1 text-sm">
      <Link
        href="/"
        className={`${linkBase} ${selected === "all" ? activeLink : ""}`}
      >
        All notes
      </Link>
      <p className="mt-3 px-3 text-xs font-medium uppercase text-foreground/50">
        Collections
      </p>
      <Groups selected={selected} activeNote={activeNote} />
      <NewCollectionForm />
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
