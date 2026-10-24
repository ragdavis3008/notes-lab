import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setNoteCompletedAction,
  setNotePinnedAction,
  updateNoteAction,
} from "@/app/actions";

// Server actions are public endpoints, so a deleted note must not be changeable
// through them: the update only matches rows whose deleted_at is null, and a note
// that matches nothing is reported as gone, like a missing one.
type Call = [method: string, args: unknown[]];
const fake = vi.hoisted(() => ({
  reply: { data: null, error: null } as {
    data: { id: number }[] | null;
    error: { code?: string; message: string } | null;
  },
  queries: [] as Call[][],
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => {
      const calls: Call[] = [];
      fake.queries.push(calls);
      const builder: Record<string, unknown> = {
        then: (resolve: (value: unknown) => unknown) => resolve(fake.reply),
      };
      for (const method of ["select", "update", "delete", "eq", "is", "not", "in", "insert"]) {
        builder[method] = (...args: unknown[]) => {
          calls.push([method, args]);
          return builder;
        };
      }
      return builder;
    },
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: () => {
    throw new Error("NEXT_REDIRECT");
  },
}));
vi.mock("@/lib/auth", () => ({ requireUser: vi.fn(async () => ({ id: "user-1" })) }));

const onlyLiveNotes: Call = ["is", ["deleted_at", null]];

function noteForm() {
  const form = new FormData();
  form.set("title", "Title");
  return form;
}

beforeEach(() => {
  fake.reply = { data: [{ id: 7 }], error: null };
  fake.queries = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("a deleted note cannot be changed through the server actions", () => {
  it("pinning only matches notes that are not deleted", async () => {
    expect(await setNotePinnedAction(7, true)).toBeUndefined();
    expect(fake.queries[0]).toContainEqual(onlyLiveNotes);
  });

  it("pinning a deleted note reports it as gone", async () => {
    fake.reply = { data: [], error: null };
    expect(await setNotePinnedAction(7, true)).toEqual({ error: "This note no longer exists." });
  });

  it("completing only matches notes that are not deleted", async () => {
    expect(await setNoteCompletedAction(7, true)).toBeUndefined();
    expect(fake.queries[0]).toContainEqual(onlyLiveNotes);
  });

  it("completing a deleted note reports it as gone", async () => {
    fake.reply = { data: [], error: null };
    expect(await setNoteCompletedAction(7, true)).toEqual({
      error: "This note no longer exists.",
    });
  });

  it("editing only matches notes that are not deleted", async () => {
    await expect(updateNoteAction(7, undefined, noteForm())).rejects.toThrow("NEXT_REDIRECT");
    expect(fake.queries[0]).toContainEqual(onlyLiveNotes);
  });

  it("editing a deleted note reports it as gone and saves nothing else", async () => {
    fake.reply = { data: [], error: null };
    const state = await updateNoteAction(7, undefined, noteForm());
    expect(state?.error).toBe("This note no longer exists.");
    // Only the note update ran: the tags were not touched.
    expect(fake.queries).toHaveLength(1);
  });
});
