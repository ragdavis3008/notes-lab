import { createClient } from "@/lib/supabase/server";
import type { Collection, Note } from "@/lib/types";

// Thrown when an update or delete finds no row with the given id.
export class NoteNotFoundError extends Error {
  constructor() {
    super("This note no longer exists.");
  }
}

export async function listNotes(): Promise<Note[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select()
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
): Promise<Note[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select()
    .eq("collection_id", collectionId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// Notes whose collection_id is empty.
export async function listUncollectedNotes(): Promise<Note[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .select()
    .is("collection_id", null)
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
