import Link from "next/link";
import { NoteCard } from "@/components/note-card";
import { TagDot } from "@/components/tag-pill";
import { formatDue, formatTimestamp, isOverdue } from "@/lib/due-date";
import { timeAgo } from "@/lib/time-ago";
import type { Note, Tag } from "@/lib/types";

const PREVIEW_LENGTH = 120;

function preview(content: string | null) {
  if (!content) return "";
  return content.length > PREVIEW_LENGTH
    ? content.slice(0, PREVIEW_LENGTH).trimEnd() + "…"
    : content;
}

// The list of note cards. `completedView` is the Completed page: the notes keep the
// order they came in (newest completed first), show when they were completed, and
// are never red for being overdue.
export function NotesList({
  notes,
  tagsByNote,
  emptyMessage,
  today,
  completedView = false,
}: {
  notes: Note[];
  tagsByNote: Map<number, Tag[]>;
  emptyMessage: string;
  today: string;
  completedView?: boolean;
}) {
  if (notes.length === 0) {
    return (
      <p className="break-words rounded-2xl bg-card p-8 text-center text-foreground/70 shadow-sm">
        {emptyMessage}
      </p>
    );
  }

  // The list is already sorted pinned-first, so the two groups keep their order.
  const pinned = completedView ? [] : notes.filter((n) => n.pinned);
  const others = completedView ? notes : notes.filter((n) => !n.pinned);
  // "Notes" is only a heading when it needs to tell the groups apart.
  const groups = [
    { label: "Pinned", items: pinned },
    { label: pinned.length > 0 ? "Notes" : "", items: others },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
      {groups.map((group, i) => (
        <section key={group.label} className={i > 0 ? "border-t border-border" : ""}>
          {group.label && (
            <h2 className="px-4 pb-1 pt-3 text-sm font-bold">{group.label}</h2>
          )}
          <ul className="divide-y divide-border">
            {group.items.map((note) => (
              <NoteCard
                key={note.id}
                noteId={note.id}
                noteTitle={note.title}
                pinned={note.pinned}
                completed={note.completed_at !== null}
              >
                {/* The checkbox and the pin, edit and delete buttons are siblings of the link: a button inside a link is invalid.
                    The ::after layer stretches the link over the whole row and draws the focus ring.
                    pl-12 and pr-28 keep the text clear of those buttons. */}
                <Link
                  href={`/notes/${note.id}`}
                  className="block p-4 pl-12 pr-28 outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-ring"
                >
                  {/* A long title is cut off with "…": after two lines on a phone,
                      after one line from the sm breakpoint up. */}
                  <h3 className="line-clamp-2 break-words font-semibold sm:line-clamp-1">
                    {note.title}
                  </h3>
                  {note.content && (
                    <p className="mt-1 line-clamp-2 whitespace-pre-line break-words text-sm text-foreground/60">
                      {preview(note.content)}
                    </p>
                  )}
                  {/* The row wraps as a whole: the dots stay together (shrink-0), and
                      the due date and "Edited" text move to the next line if needed. */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                    {(tagsByNote.get(note.id) ?? []).length > 0 && (
                      // relative z-10 lifts the dots above the stretched link layer,
                      // so hovering one shows the tag name.
                      <ul className="relative z-10 flex max-w-full shrink-0 flex-wrap gap-1.5">
                        {tagsByNote.get(note.id)!.map((tag) => (
                          <li key={tag.id}>
                            <TagDot color={tag.color} name={tag.name} />
                          </li>
                        ))}
                      </ul>
                    )}
                    {note.due_date && (
                      <span
                        className={
                          !completedView && isOverdue(note.due_date, today)
                            ? "shrink-0 text-xs font-medium text-red-600"
                            : "shrink-0 text-xs text-foreground/70"
                        }
                      >
                        Due {formatDue(note.due_date)}
                      </span>
                    )}
                    {completedView && note.completed_at ? (
                      <span className="ml-auto shrink-0 text-xs text-foreground/50">
                        Completed {formatTimestamp(note.completed_at)}
                      </span>
                    ) : (
                      <span className="ml-auto shrink-0 text-xs text-foreground/50">
                        Edited {timeAgo(note.updated_at ?? note.created_at)}
                      </span>
                    )}
                  </div>
                </Link>
              </NoteCard>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
