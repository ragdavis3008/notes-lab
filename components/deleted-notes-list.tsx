import { DeletedNoteCard } from "@/components/deleted-note-card";
import { TagDot } from "@/components/tag-pill";
import { deletesInLabel } from "@/lib/deleted";
import type { Note, Tag } from "@/lib/types";

// The Deleted page's list, in the order it came in (most recently deleted first).
// Titles are plain text, not links: a deleted note cannot be opened.
export function DeletedNotesList({
  notes,
  tagsByNote,
  emptyMessage,
  now,
}: {
  notes: Note[];
  tagsByNote: Map<number, Tag[]>;
  emptyMessage: string;
  now: Date;
}) {
  if (notes.length === 0) {
    return (
      <p className="break-words rounded-2xl bg-card p-8 text-center text-foreground/70 shadow-sm">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-sm">
      {notes.map((note) => (
        <DeletedNoteCard key={note.id} noteId={note.id} noteTitle={note.title}>
          <h3 className="line-clamp-2 break-words font-semibold sm:line-clamp-1">
            {note.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            {(tagsByNote.get(note.id) ?? []).length > 0 && (
              <ul className="flex max-w-full shrink-0 flex-wrap gap-1.5">
                {tagsByNote.get(note.id)!.map((tag) => (
                  <li key={tag.id}>
                    <TagDot color={tag.color} name={tag.name} />
                  </li>
                ))}
              </ul>
            )}
            {note.deleted_at && (
              <span className="ml-auto shrink-0 text-xs text-foreground/50">
                {deletesInLabel(note.deleted_at, now)}
              </span>
            )}
          </div>
        </DeletedNoteCard>
      ))}
    </ul>
  );
}
