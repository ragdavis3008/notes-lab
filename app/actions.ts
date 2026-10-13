"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNote, deleteNote, updateNote } from "@/lib/db";

export type FormState = { error?: string } | undefined;

function readFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  return { title, content: content === "" ? null : content };
}

export async function createNoteAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { title, content } = readFields(formData);
  if (!title) return { error: "Title is required." };

  await createNote({ title, content });
  revalidatePath("/");
  redirect("/");
}

export async function updateNoteAction(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { title, content } = readFields(formData);
  if (!title) return { error: "Title is required." };

  await updateNote(id, { title, content });
  revalidatePath("/");
  redirect("/");
}

export async function deleteNoteAction(id: number) {
  await deleteNote(id);
  revalidatePath("/");
  redirect("/");
}
