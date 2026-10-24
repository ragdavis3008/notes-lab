import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { DeletedNotesList } from "@/components/deleted-notes-list";
import { requireUser } from "@/lib/auth";
import { listDeletedNotes, listTagsByNoteIds } from "@/lib/db";
import type { Note, Tag } from "@/lib/types";

async function Content() {
  // Also checked here: a layout check does not re-run on every navigation.
  await requireUser();
  // After requireUser(), so Next.js does not warn about the clock being read while
  // prerendering.
  const now = new Date();

  let notes: Note[];
  let tagsByNote: Map<number, Tag[]>;
  try {
    notes = await listDeletedNotes();
    tagsByNote = await listTagsByNoteIds(notes.map((n) => n.id));
  } catch (e) {
    unstable_rethrow(e);
    console.error("Loading deleted notes failed:", e);
    return (
      <p className="text-red-600">
        Error loading notes: {e instanceof Error ? e.message : "unknown error"}
      </p>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Deleted</h1>
      <DeletedNotesList
        notes={notes}
        tagsByNote={tagsByNote}
        emptyMessage="No deleted notes. Notes you delete wait here for 30 days before they are removed."
        now={now}
      />
    </>
  );
}

export default function DeletedPage() {
  return (
    <AppShell selected={Promise.resolve("deleted")}>
      <Suspense fallback={<p>Loading notes...</p>}>
        <Content />
      </Suspense>
    </AppShell>
  );
}
