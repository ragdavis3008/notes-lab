import { Suspense } from "react";
import { createNoteAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { NoteForm } from "@/components/note-form";
import { requireUser } from "@/lib/auth";

async function NewNoteForm() {
  // Also checked here: a layout check does not re-run on every navigation.
  await requireUser();
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">New note</h1>
      <NoteForm action={createNoteAction} submitLabel="Create note" />
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
