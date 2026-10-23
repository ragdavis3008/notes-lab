"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  addTagToNote,
  CollectionNotFoundError,
  createCollection,
  createNote,
  deleteCollection,
  deleteNote,
  DuplicateCollectionError,
  NoteNotFoundError,
  removeTagFromNote,
  renameCollection,
  setNoteCollection,
  setNotePinned,
  setTagColor,
  TagNotFoundError,
  updateNote,
} from "@/lib/db";
import { parseCollectionName } from "@/lib/collection-name";
import { isTagColor } from "@/lib/tag-colors";
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
  return e instanceof NoteNotFoundError ||
    e instanceof CollectionNotFoundError ||
    e instanceof TagNotFoundError
    ? e.message
    : fallback;
}

// Server actions are public endpoints, so each one starts with requireUser().
// redirect() works by throwing, so it must stay outside the try/catch blocks.
export async function createNoteAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const { title, content, values } = readFields(formData);
  if (!title) return { error: "Title is required.", values };

  try {
    await createNote({ title, content });
  } catch (e) {
    console.error("createNoteAction failed:", e);
    return { error: errorMessage(e, "Could not save the note. Please try again."), values };
  }
  revalidatePath("/", "layout");
  redirect("/notes");
}

export async function updateNoteAction(
  id: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const { title, content, values } = readFields(formData);
  if (!title) return { error: "Title is required.", values };

  try {
    await updateNote(id, { title, content });
  } catch (e) {
    console.error("updateNoteAction failed:", e);
    return { error: errorMessage(e, "Could not save the note. Please try again."), values };
  }
  revalidatePath("/", "layout");
  redirect("/notes");
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
  await requireUser();
  const raw = String(formData.get("name") ?? "");
  const parsed = parseCollectionName(raw);
  if ("error" in parsed) return { error: parsed.error, value: raw };

  try {
    await createCollection(parsed.name);
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

export async function renameCollectionAction(
  id: string,
  _prev: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  await requireUser();
  const raw = String(formData.get("name") ?? "");
  // Server actions are public endpoints, so check what the client sent.
  if (!isUuid(id)) return { error: "That collection is not valid.", value: raw };

  const parsed = parseCollectionName(raw);
  if ("error" in parsed) return { error: parsed.error, value: raw };

  try {
    await renameCollection(id, parsed.name);
  } catch (e) {
    // A duplicate name or a deleted collection is expected, not a failure
    // worth logging.
    if (
      e instanceof DuplicateCollectionError ||
      e instanceof CollectionNotFoundError
    ) {
      return { error: e.message, value: raw };
    }
    console.error("renameCollectionAction failed:", e);
    return { error: "Could not rename the collection. Please try again.", value: raw };
  }
  // The sidebar is on every page, so refresh the whole layout.
  revalidatePath("/", "layout");
  return { saved: Date.now() };
}

export type DeleteCollectionState = { error: string } | undefined;

// The collection's notes are kept: the database moves them to "Uncollected".
export async function deleteCollectionAction(
  id: string,
): Promise<DeleteCollectionState> {
  await requireUser();
  // Server actions are public endpoints, so check what the client sent.
  if (!isUuid(id)) return { error: "That collection is not valid." };

  try {
    await deleteCollection(id);
  } catch (e) {
    console.error("deleteCollectionAction failed:", e);
    return { error: errorMessage(e, "Could not delete the collection. Please try again.") };
  }
  // The sidebar is on every page, so refresh the whole layout.
  revalidatePath("/", "layout");
}

// An empty collectionId means "No collection".
export async function setNoteCollectionAction(
  noteId: number,
  collectionId: string,
): Promise<SetCollectionState> {
  await requireUser();
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

export type PinState = { error: string } | undefined;

export async function setNotePinnedAction(
  noteId: number,
  pinned: boolean,
): Promise<PinState> {
  await requireUser();
  // Server actions are public endpoints, so check what the client sent.
  if (!Number.isSafeInteger(noteId) || typeof pinned !== "boolean") {
    return { error: "Could not change the pin. Please try again." };
  }

  try {
    await setNotePinned(noteId, pinned);
  } catch (e) {
    console.error("setNotePinnedAction failed:", e);
    return { error: errorMessage(e, "Could not change the pin. Please try again.") };
  }
  revalidatePath("/", "layout");
}

// Always set: `ok` on success, `error` on any failure.
export type TagState = { ok: true } | { error: string };

export async function addTagToNoteAction(
  noteId: number,
  name: string,
): Promise<TagState> {
  await requireUser();
  if (name.trim() === "") return { error: "Tag name is required." };

  try {
    await addTagToNote(noteId, name);
  } catch (e) {
    console.error("addTagToNoteAction failed:", e);
    return { error: errorMessage(e, "Could not add the tag. Please try again.") };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeTagFromNoteAction(
  noteId: number,
  tagId: number,
): Promise<TagState> {
  await requireUser();
  try {
    await removeTagFromNote(noteId, tagId);
  } catch (e) {
    console.error("removeTagFromNoteAction failed:", e);
    return { error: errorMessage(e, "Could not remove the tag. Please try again.") };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export type TagColorState = { error: string } | undefined;

export async function setTagColorAction(
  tagId: number,
  color: string,
): Promise<TagColorState> {
  await requireUser();
  // Server actions are public endpoints, so check what the client sent.
  if (!Number.isSafeInteger(tagId) || !isTagColor(color)) {
    return { error: "That colour is not valid." };
  }

  try {
    await setTagColor(tagId, color);
  } catch (e) {
    console.error("setTagColorAction failed:", e);
    return { error: errorMessage(e, "Could not change the colour. Please try again.") };
  }
  revalidatePath("/", "layout");
}

// The note page leaves for the list after a delete. The list passes
// redirectToList = false, so the current filters and search stay in the URL.
export async function deleteNoteAction(
  id: number,
  redirectToList = true,
): Promise<DeleteState> {
  await requireUser();
  try {
    await deleteNote(id);
  } catch (e) {
    console.error("deleteNoteAction failed:", e);
    return { error: errorMessage(e, "Could not delete the note. Please try again.") };
  }
  revalidatePath("/", "layout");
  if (redirectToList) redirect("/notes");
}
