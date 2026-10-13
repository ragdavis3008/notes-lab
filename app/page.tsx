import Link from "next/link";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { listNotes } from "@/lib/db";

const PREVIEW_LENGTH = 120;

function preview(content: string | null) {
  if (!content) return "";
  return content.length > PREVIEW_LENGTH
    ? content.slice(0, PREVIEW_LENGTH).trimEnd() + "…"
    : content;
}

async function NotesList() {
  let notes;
  try {
    notes = await listNotes();
  } catch (e) {
    return (
      <p className="text-red-600">
        Error loading notes: {e instanceof Error ? e.message : "unknown error"}
      </p>
    );
  }

  if (notes.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-foreground/20 p-8 text-center text-foreground/70">
        No notes yet. Create your first note.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {notes.map((note) => (
        <li key={note.id}>
          <Link
            href={`/notes/${note.id}`}
            className="block rounded-md border border-foreground/10 p-4 hover:bg-foreground/5"
          >
            <h2 className="font-medium">{note.title}</h2>
            {note.content && (
              <p className="mt-1 whitespace-pre-line text-sm text-foreground/70">
                {preview(note.content)}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">All notes</h1>
        <Link
          href="/notes/new"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          New note
        </Link>
      </div>
      <Suspense fallback={<p>Loading notes...</p>}>
        <NotesList />
      </Suspense>
    </AppShell>
  );
}
