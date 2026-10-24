import type { TagColor } from "@/lib/tag-colors";

// Matches the `notes` table in docs/database-schema.md.
export type Note = {
  id: number; // int8
  created_at: string;
  title: string;
  content: string | null;
  updated_at: string | null;
  collection_id: string | null; // uuid
  pinned: boolean; // pinned notes are listed first
  due_date: string | null; // date only, YYYY-MM-DD
  completed_at: string | null; // null = not completed
  deleted_at: string | null; // null = not deleted; otherwise the note is in Deleted
};

// Matches the `tags` table in docs/database-schema.md.
export type Tag = {
  id: number; // int8
  created_at: string;
  name: string; // trimmed, lowercase
  color: TagColor; // one of the eight palette names, default 'gray'
};

// Matches the `note_tags` join table. It has no id column.
export type NoteTag = {
  note_id: number; // int8
  tag_id: number; // int8
  created_at: string;
};

// Matches the `collections` table in docs/database-schema.md.
export type Collection = {
  id: string; // uuid
  created_at: string;
  name: string;
};
