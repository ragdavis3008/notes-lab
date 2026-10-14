"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CollectionNotFoundError,
  createCollection,
  createNote,
  deleteNote,
  DuplicateCollectionError,
  NoteNotFoundError,
  setNoteCollection,
  updateNote,
} from "@/lib/db";
import { isUuid } from "@/lib/uuid";

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
  return e instanceof NoteNotFoundError || e instanceof CollectionNotFoundError
    ? e.message
    : fallback;
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
    console.error("createNoteAction failed:", e);
    return { error: errorMessage(e, "Could not save the note. Please try again."), values };
  }
  revalidatePath("/", "layout");
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
    console.error("updateNoteAction failed:", e);
    return { error: errorMessage(e, "Could not save the note. Please try again."), values };
  }
  revalidatePath("/", "layout");
  redirect("/");
}

// `saved` changes on every success so the form knows to clear its input.
export type CollectionFormState =
  | { error?: string; value?: string; saved?: number }
  | undefined;

export type SetCollectionState = { error: string } | undefined;

export async function createCollectionAction(
  _prev: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  const raw = String(formData.get("name") ?? "");
  const name = raw.trim();
  if (!name) return { error: "Collection name is required.", value: raw };

  try {
    await createCollection(name);
  } catch (e) {
    // A duplicate name is expected user input, not a failure worth logging.
    if (e instanceof DuplicateCollectionError) {
      return { error: e.message, value: raw };
    }
    console.error("createCollectionAction failed:", e);
    return { error: "Could not create the collection. Please try again.", value: raw };
  }
  // The sidebar is on every page, so refresh the whole layout.
  revalidatePath("/", "layout");
  return { saved: Date.now() };
}

// An empty collectionId means "No collection".
export async function setNoteCollectionAction(
  noteId: number,
  collectionId: string,
): Promise<SetCollectionState> {
  if (collectionId !== "" && !isUuid(collectionId)) {
    return { error: "That collection is not valid." };
  }

  try {
    await setNoteCollection(noteId, collectionId === "" ? null : collectionId);
  } catch (e) {
    console.error("setNoteCollectionAction failed:", e);
    return { error: errorMessage(e, "Could not change the collection. Please try again.") };
  }
  revalidatePath("/", "layout");
}

export async function deleteNoteAction(id: number): Promise<DeleteState> {
  try {
    await deleteNote(id);
  } catch (e) {
    console.error("deleteNoteAction failed:", e);
    return { error: errorMessage(e, "Could not delete the note. Please try again.") };
  }
  revalidatePath("/", "layout");
  redirect("/");
}
