// Matches the `notes` table in docs/database-schema.md.
export type Note = {
  id: number; // int8
  created_at: string;
  title: string;
  content: string | null;
  updated_at: string | null;
  collection_id: string | null; // uuid
};
