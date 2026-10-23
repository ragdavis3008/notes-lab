import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { createNoteAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { NoteForm } from "@/components/note-form";
import { requireUser } from "@/lib/auth";
import { listCollections, listTags } from "@/lib/db";

async function NewNoteForm() {
  // Also checked here: a layout check does not re-run on every navigation.
  await requireUser();

  let collections, tags;
  try {
    [collections, tags] = await Promise.all([listCollections(), listTags()]);
  } catch (e) {
    unstable_rethrow(e);
    return (
      <p className="text-red-600">
        Error loading the form: {e instanceof Error ? e.message : "unknown error"}
      </p>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">New note</h1>
      <NoteForm
        action={createNoteAction}
        collections={collections}
        tags={tags}
        submitLabel="Create note"
      />
    </>
  );
}

export default function NewNotePage() {
  return (
    <AppShell>
      <Suspense fallback={<p>Loading...</p>}>
        <NewNoteForm />
      </Suspense>
    </AppShell>
  );
}
