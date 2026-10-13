import { createNoteAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { NoteForm } from "@/components/note-form";

export default function NewNotePage() {
  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">New note</h1>
      <NoteForm action={createNoteAction} submitLabel="Create note" />
    </AppShell>
  );
}
