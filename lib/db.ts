import { createClient } from "@/lib/supabase/server";
import type { Collection, Note, NoteTag, Tag } from "@/lib/types";

// Thrown when an update or delete finds no row with the given id.
export class NoteNotFoundError extends Error {
  constructor() {
    super("This note no longer exists.");
  }
}

// Builds the `.or()` filter that matches `search` in the title or the content,
// ignoring capitals. The text is escaped twice so it is always searched for
// literally:
// 1. LIKE layer: \ % _ are escaped. PostgREST also treats * like %, and that
//    cannot be escaped, so * becomes _ (any one character, which includes *).
// 2. Filter layer: the pattern is put in double quotes with \ and " escaped, so
//    , ( ) and quotes cannot end the condition or add another one.
function searchFilter(search: string): string {
  const likeSafe = search
    .replace(/[\\%_]/g, "\\$&")
    .replace(/\*/g, "_");
  const quoted = `"%${likeSafe.replace(/[\\"]/g, "\\$&")}%"`;
  return `title.ilike.${quoted},content.ilike.${quoted}`;
}

// `search` is trimmed text; empty or missing means no search.
export async function listNotes(search?: string): Promise<Note[]> {
  const supabase = await createClient();
  let query = supabase.from("notes").select();
  if (search) query = query.or(searchFilter(search));
  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// Returns null when no note has this id.
export async function getNote(id: number): Promise<Note | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select()
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createNote(input: {
  title: string;
  content: string | null;
}): Promise<void> {
  const supabase = await createClient();
  // collection_id is not sent, so it stays null.
  const { error } = await supabase.from("notes").insert({
    title: input.title,
    content: input.content,
  });

  if (error) throw new Error(error.message);
}

export async function updateNote(
  id: number,
  input: { title: string; content: string | null },
): Promise<void> {
  const supabase = await createClient();
  // select() returns the changed rows, so an empty result means no row matched.
  const { data, error } = await supabase
    .from("notes")
    .update({
      title: input.title,
      content: input.content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  if (data.length === 0) throw new NoteNotFoundError();
}

// Thrown when a collection with this name already exists. The unique index is
// case-insensitive, so "Work" and "work" count as the same name.
export class DuplicateCollectionError extends Error {
  constructor() {
    super("A collection with this name already exists.");
  }
}

// Thrown when the chosen collection was deleted (foreign key violation).
export class CollectionNotFoundError extends Error {
  constructor() {
    super("This collection no longer exists. Reload the page.");
  }
}

export async function listCollections(): Promise<Collection[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .select()
    .order("name", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function createCollection(name: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("collections").insert({ name });

  // 23505 = Postgres unique_violation (collections_name_key).
  if (error?.code === "23505") throw new DuplicateCollectionError();
  if (error) throw new Error(error.message);
}

export async function listNotesByCollection(
  collectionId: string,
  search?: string,
): Promise<Note[]> {
  const supabase = await createClient();
  let query = supabase.from("notes").select().eq("collection_id", collectionId);
  if (search) query = query.or(searchFilter(search));
  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// Notes whose collection_id is empty.
export async function listUncollectedNotes(search?: string): Promise<Note[]> {
  const supabase = await createClient();
  let query = supabase.from("notes").select().is("collection_id", null);
  if (search) query = query.or(searchFilter(search));
  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// Pass null to take the note out of its collection.
export async function setNoteCollection(
  noteId: number,
  collectionId: string | null,
): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .update({
      collection_id: collectionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId)
    .select("id");

  // 23503 = Postgres foreign_key_violation (collection_id points to nothing).
  if (error?.code === "23503") throw new CollectionNotFoundError();
  if (error) throw new Error(error.message);
  if (data.length === 0) throw new NoteNotFoundError();
}

export async function deleteNote(id: number): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  if (data.length === 0) throw new NoteNotFoundError();
}

// Tags are joined to notes in code (select/eq/in), not with embedded selects.

export async function listTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .select()
    .order("name", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function listTagsForNote(noteId: number): Promise<Tag[]> {
  const supabase = await createClient();
  const { data: links, error } = await supabase
    .from("note_tags")
    .select()
    .eq("note_id", noteId);

  if (error) throw new Error(error.message);
  const noteTags = links as NoteTag[];
  if (noteTags.length === 0) return [];

  const { data: tags, error: tagsError } = await supabase
    .from("tags")
    .select()
    .in("id", noteTags.map((l) => l.tag_id))
    .order("name", { ascending: true });

  if (tagsError) throw new Error(tagsError.message);
  return tags;
}

// Tags for many notes at once (note cards): two queries, not one per card.
export async function listTagsByNoteIds(
  noteIds: number[],
): Promise<Map<number, Tag[]>> {
  const result = new Map<number, Tag[]>();
  if (noteIds.length === 0) return result;

  const supabase = await createClient();
  const { data: links, error } = await supabase
    .from("note_tags")
    .select()
    .in("note_id", noteIds);

  if (error) throw new Error(error.message);
  const noteTags = links as NoteTag[];
  if (noteTags.length === 0) return result;

  const tags = await listTags(); // already sorted by name
  const linked = new Map<number, Set<number>>(); // note id -> tag ids
  for (const link of noteTags) {
    const ids = linked.get(link.note_id) ?? new Set<number>();
    ids.add(link.tag_id);
    linked.set(link.note_id, ids);
  }
  for (const [noteId, ids] of linked) {
    result.set(noteId, tags.filter((t) => ids.has(t.id)));
  }
  return result;
}

// Ids of notes that have ALL of the given tags. The `in` filter alone means
// "any of them", so count the matching tags per note and keep full matches.
export async function listNoteIdsWithAllTags(
  tagIds: number[],
): Promise<Set<number>> {
  if (tagIds.length === 0) return new Set();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("note_tags")
    .select()
    .in("tag_id", tagIds);

  if (error) throw new Error(error.message);
  const wanted = new Set(tagIds);
  const matches = new Map<number, Set<number>>();
  for (const link of data as NoteTag[]) {
    const found = matches.get(link.note_id) ?? new Set<number>();
    found.add(link.tag_id);
    matches.set(link.note_id, found);
  }
  const ids = new Set<number>();
  for (const [noteId, found] of matches) {
    if (found.size === wanted.size) ids.add(noteId);
  }
  return ids;
}

// Tag names are trimmed and lowercase. Reuses an existing tag with that name.
// Adding a tag the note already has is not an error.
export async function addTagToNote(
  noteId: number,
  rawName: string,
): Promise<void> {
  const name = rawName.trim().toLowerCase();
  const supabase = await createClient();

  async function findTag(): Promise<Tag | null> {
    const { data, error } = await supabase
      .from("tags")
      .select()
      .eq("name", name)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  let tag = await findTag();
  if (!tag) {
    const { data, error } = await supabase
      .from("tags")
      .insert({ name })
      .select();
    // 23505 = unique_violation: another request created it first, so reuse it.
    if (error?.code === "23505") {
      tag = await findTag();
    } else if (error) {
      throw new Error(error.message);
    } else {
      tag = data[0] ?? null;
    }
  }
  if (!tag) throw new Error("Could not find or create the tag.");

  const { error } = await supabase
    .from("note_tags")
    .insert({ note_id: noteId, tag_id: tag.id });

  // 23505 = the note already has this tag; nothing to do.
  if (error?.code === "23505") return;
  // 23503 = foreign_key_violation (the note was deleted).
  if (error?.code === "23503") throw new NoteNotFoundError();
  if (error) throw new Error(error.message);
}

// Deletes only the note_tags row; the tag itself stays in the tags table.
export async function removeTagFromNote(
  noteId: number,
  tagId: number,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("note_tags")
    .delete()
    .eq("note_id", noteId)
    .eq("tag_id", tagId);

  if (error) throw new Error(error.message);
}
