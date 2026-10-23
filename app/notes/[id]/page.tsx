import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { updateNoteAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { DeleteNoteButton } from "@/components/delete-note-button";
import { NoteForm } from "@/components/note-form";
import { PinButton } from "@/components/pin-button";
import { requireUser } from "@/lib/auth";
import { getNote, listCollections, listTags, listTagsForNote } from "@/lib/db";

function NoteNotFound() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Note not found</h1>
      <p className="mb-4 text-foreground/70">
        This note doesn&apos;t exist. It may have been deleted.
      </p>
      <Link href="/notes" className="text-sm underline">
        Back to all notes
      </Link>
    </div>
  );
}

async function NoteEditor({ params }: { params: Promise<{ id: string }> }) {
  // Also checked here: a layout check does not re-run on every navigation.
  await requireUser();
  const { id: rawId } = await params;
  if (!/^\d+$/.test(rawId)) return <NoteNotFound />;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id)) return <NoteNotFound />;

  let note, collections, allTags, noteTags;
  try {
    [note, collections, allTags, noteTags] = await Promise.all([
      getNote(id),
      listCollections(),
      listTags(),
      listTagsForNote(id),
    ]);
  } catch (e) {
    unstable_rethrow(e);
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
      <NoteForm
        action={updateNoteAction.bind(null, note.id)}
        collections={collections}
        tags={allTags}
        initialTitle={note.title}
        initialContent={note.content ?? ""}
        initialCollectionId={note.collection_id}
        initialTagIds={noteTags.map((t) => t.id)}
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
