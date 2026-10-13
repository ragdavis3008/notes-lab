import { createClient } from "@/lib/supabase/server";
import type { Note } from "@/lib/types";

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
  const { error } = await supabase
    .from("notes")
    .update({
      title: input.title,
      content: input.content,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteNote(id: number): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);

  if (error) throw new Error(error.message);
}
