import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { NotesList } from "@/components/notes-list";
import { requireUser } from "@/lib/auth";
import { listCompletedNotes, listTagsByNoteIds } from "@/lib/db";
import { todayString } from "@/lib/due-date";
import type { Note, Tag } from "@/lib/types";

async function Content() {
  // Also checked here: a layout check does not re-run on every navigation.
  await requireUser();
  // After requireUser(), so Next.js does not warn about the clock being read while
  // prerendering.
  const today = todayString();

  let notes: Note[];
  let tagsByNote: Map<number, Tag[]>;
  try {
    notes = await listCompletedNotes();
    tagsByNote = await listTagsByNoteIds(notes.map((n) => n.id));
  } catch (e) {
    unstable_rethrow(e);
    console.error("Loading completed notes failed:", e);
    return (
      <p className="text-red-600">
        Error loading notes: {e instanceof Error ? e.message : "unknown error"}
      </p>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Completed</h1>
      <NotesList
        notes={notes}
        tagsByNote={tagsByNote}
        emptyMessage="No completed notes yet. Tick the circle on a note to complete it."
        today={today}
        completedView
      />
    </>
  );
}

export default function CompletedPage() {
  return (
    <AppShell selected={Promise.resolve("completed")}>
      <Suspense fallback={<p>Loading notes...</p>}>
        <Content />
      </Suspense>
    </AppShell>
  );
}
