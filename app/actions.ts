"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createNote, deleteNote, NoteNotFoundError, updateNote } from "@/lib/db";

// `values` echoes what the user typed so the form can keep it after an error.
export type FormState =
  | { error?: string; values?: { title: string; content: string } }
  | undefined;

export type DeleteState = { error: string } | undefined;

function readFields(formData: FormData) {
  const rawTitle = String(formData.get("title") ?? "");
  const rawContent = String(formData.get("content") ?? "");
  const title = rawTitle.trim();
  const content = rawContent.trim();
  return {
    title,
    content: content === "" ? null : content,
    values: { title: rawTitle, content: rawContent },
  };
}

function errorMessage(e: unknown, fallback: string) {
  return e instanceof NoteNotFoundError ? e.message : fallback;
}

// redirect() works by throwing, so it must stay outside the try/catch blocks.
export async function createNoteAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { title, content, values } = readFields(formData);
  if (!title) return { error: "Title is required.", values };

  try {
    await createNote({ title, content });
  } catch (e) {
    return { error: errorMessage(e, "Could not save the note. Please try again."), values };
  }
  revalidatePath("/");
  redirect("/");
}

export async function updateNoteAction(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { title, content, values } = readFields(formData);
  if (!title) return { error: "Title is required.", values };

  try {
    await updateNote(id, { title, content });
  } catch (e) {
    return { error: errorMessage(e, "Could not save the note. Please try again."), values };
  }
  revalidatePath("/");
  redirect("/");
}

export async function deleteNoteAction(id: number): Promise<DeleteState> {
  try {
    await deleteNote(id);
  } catch (e) {
    return { error: errorMessage(e, "Could not delete the note. Please try again.") };
  }
  revalidatePath("/");
  redirect("/");
}
