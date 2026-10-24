"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  CollectionNotFoundError,
  createCollection,
  createNote,
  createTag,
  deleteCollection,
  deleteNote,
  deleteTag,
  DuplicateCollectionError,
  DuplicateTagError,
  NoteNotFoundError,
  renameCollection,
  renameTag,
  setNoteCompleted,
  setNotePinned,
  setNoteTags,
  setTagColor,
  TagNotFoundError,
  updateNote,
} from "@/lib/db";
import { parseCollectionName } from "@/lib/collection-name";
import { parseDueDate } from "@/lib/due-date";
import { isTagColor } from "@/lib/tag-colors";
import { parseTagName } from "@/lib/tag-name";
import { isUuid } from "@/lib/uuid";

// `values` echoes what the user typed so the form can keep it after an error.
export type FormState =
  | { error?: string; values?: { title: string; content: string; dueDate: string } }
  | undefined;

export type DeleteState = { error: string } | undefined;

// Server actions are public endpoints, so everything the form sent is checked
// here. An empty collection_id means "No collection". A bad collection or tag id
// comes back as `error` instead of being passed on to the database.
function readFields(formData: FormData) {
  const rawTitle = String(formData.get("title") ?? "");
  const rawContent = String(formData.get("content") ?? "");
  const title = rawTitle.trim();
  const content = rawContent.trim();
  const rawDueDate = String(formData.get("due_date") ?? "");
  const values = { title: rawTitle, content: rawContent, dueDate: rawDueDate };

  // An empty due date means none; anything else must be a real YYYY-MM-DD date.
  const dueDate = parseDueDate(rawDueDate);
  if (dueDate === undefined) return { error: "That due date is not valid.", values };

  const rawCollectionId = String(formData.get("collection_id") ?? "");
  if (rawCollectionId !== "" && !isUuid(rawCollectionId)) {
    return { error: "That collection is not valid.", values };
  }

  const tagIds: number[] = [];
  for (const raw of formData.getAll("tag_id")) {
    const id = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : NaN;
    if (!Number.isSafeInteger(id)) return { error: "That tag is not valid.", values };
    tagIds.push(id);
  }

  const newTags = [
    ...new Set(
      formData
        .getAll("new_tag")
        .map((raw) => String(raw).trim().toLowerCase())
        .filter((name) => name !== ""),
    ),
  ];

  return {
    title,
    content: content === "" ? null : content,
    collectionId: rawCollectionId === "" ? null : rawCollectionId,
    dueDate,
    tagIds: [...new Set(tagIds)],
    newTags,
    values,
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
  const fields = readFields(formData);
  if ("error" in fields) return { error: fields.error, values: fields.values };
  const { title, content, collectionId, dueDate, tagIds, newTags, values } = fields;
  if (!title) return { error: "Title is required.", values };

  let noteId: number | undefined;
  try {
    noteId = await createNote({ title, content, collectionId, dueDate });
    await setNoteTags(noteId, tagIds, newTags);
  } catch (e) {
    console.error("createNoteAction failed:", e);
    // There are no transactions, so undo the half-saved note. Otherwise the user
    // would fix the error, press Create again and end up with two notes.
    if (noteId !== undefined) {
      try {
        await deleteNote(noteId);
      } catch (undoError) {
        console.error("createNoteAction could not undo the note:", undoError);
      }
    }
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
  const fields = readFields(formData);
  if ("error" in fields) return { error: fields.error, values: fields.values };
  const { title, content, collectionId, dueDate, tagIds, newTags, values } = fields;
  if (!title) return { error: "Title is required.", values };

  try {
    await updateNote(id, { title, content, collectionId, dueDate });
    await setNoteTags(id, tagIds, newTags);
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

export async function createTagAction(
  _prev: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  await requireUser();
  const raw = String(formData.get("name") ?? "");
  const name = raw.trim().toLowerCase();
  if (name === "") return { error: "Tag name is required.", value: raw };

  try {
    await createTag(name);
  } catch (e) {
    console.error("createTagAction failed:", e);
    return { error: "Could not create the tag. Please try again.", value: raw };
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

export type CompleteState = { error: string } | undefined;

export async function setNoteCompletedAction(
  noteId: number,
  completed: boolean,
): Promise<CompleteState> {
  await requireUser();
  // Server actions are public endpoints, so check what the client sent.
  if (!Number.isSafeInteger(noteId) || typeof completed !== "boolean") {
    return { error: "Could not change the note. Please try again." };
  }

  try {
    await setNoteCompleted(noteId, completed);
  } catch (e) {
    console.error("setNoteCompletedAction failed:", e);
    return { error: errorMessage(e, "Could not change the note. Please try again.") };
  }
  revalidatePath("/", "layout");
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

export async function renameTagAction(
  id: number,
  _prev: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  await requireUser();
  const raw = String(formData.get("name") ?? "");
  // Server actions are public endpoints, so check what the client sent.
  if (!Number.isSafeInteger(id)) return { error: "That tag is not valid.", value: raw };

  const parsed = parseTagName(raw);
  if ("error" in parsed) return { error: parsed.error, value: raw };

  try {
    await renameTag(id, parsed.name);
  } catch (e) {
    // A duplicate name or a deleted tag is expected, not a failure worth logging.
    if (e instanceof DuplicateTagError || e instanceof TagNotFoundError) {
      return { error: e.message, value: raw };
    }
    console.error("renameTagAction failed:", e);
    return { error: "Could not rename the tag. Please try again.", value: raw };
  }
  // The sidebar is on every page, so refresh the whole layout.
  revalidatePath("/", "layout");
  return { saved: Date.now() };
}

export type DeleteTagState = { error: string } | undefined;

// The tag's notes are kept: the database removes the tag from them.
export async function deleteTagAction(id: number): Promise<DeleteTagState> {
  await requireUser();
  // Server actions are public endpoints, so check what the client sent.
  if (!Number.isSafeInteger(id)) return { error: "That tag is not valid." };

  try {
    await deleteTag(id);
  } catch (e) {
    console.error("deleteTagAction failed:", e);
    return { error: errorMessage(e, "Could not delete the tag. Please try again.") };
  }
  // The sidebar is on every page, so refresh the whole layout.
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
