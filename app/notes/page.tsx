import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

async function NotesList() {
  const supabase = await createClient();
  const { data: notes, error } = await supabase
    .from("notes")
    .select("id, title, body")
    .order("id");

  if (error) {
    return <p>Error loading notes: {error.message}</p>;
  }

  return (
    <>
      {notes.length === 0 && <p>No notes found.</p>}
      <ul>
        {notes.map((note) => (
          <li key={note.id}>
            <h2>{note.title}</h2>
            <p>{note.body}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function NotesPage() {
  return (
    <main>
      <h1>Notes</h1>
      <Suspense fallback={<p>Loading notes...</p>}>
        <NotesList />
      </Suspense>
    </main>
  );
}
