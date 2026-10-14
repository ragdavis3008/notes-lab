import Link from "next/link";
import { Suspense } from "react";
import { updateNoteAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { CollectionSelect } from "@/components/collection-select";
import { DeleteNoteButton } from "@/components/delete-note-button";
import { NoteForm } from "@/components/note-form";
import { NoteTags } from "@/components/note-tags";
import { PinButton } from "@/components/pin-button";
import { getNote, listCollections, listTagsForNote } from "@/lib/db";

function NoteNotFound() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Note not found</h1>
      <p className="mb-4 text-foreground/70">
        This note doesn&apos;t exist. It may have been deleted.
      </p>
      <Link href="/" className="text-sm underline">
        Back to all notes
      </Link>
    </div>
  );
}

async function NoteEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  if (!/^\d+$/.test(rawId)) return <NoteNotFound />;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id)) return <NoteNotFound />;

  let note, collections, tags;
  try {
    [note, collections, tags] = await Promise.all([
      getNote(id),
      listCollections(),
      listTagsForNote(id),
    ]);
  } catch (e) {
    return (
      <p className="text-red-600">
        Error loading note: {e instanceof Error ? e.message : "unknown error"}
      </p>
    );
  }
  if (!note) return <NoteNotFound />;

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold">Edit note</h1>
        <PinButton noteId={note.id} pinned={note.pinned} showLabel />
      </div>
      <CollectionSelect
        noteId={note.id}
        collections={collections}
        currentCollectionId={note.collection_id}
      />
      <NoteTags noteId={note.id} tags={tags} />
      <NoteForm
        action={updateNoteAction.bind(null, note.id)}
        initialTitle={note.title}
        initialContent={note.content ?? ""}
        submitLabel="Save changes"
      />
      <div className="mt-8 border-t border-foreground/10 pt-6">
        <DeleteNoteButton id={note.id} />
      </div>
    </>
  );
}

export default function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <AppShell activeNote={params}>
      <Suspense fallback={<p>Loading note...</p>}>
        <NoteEditor params={params} />
      </Suspense>
    </AppShell>
  );
}
