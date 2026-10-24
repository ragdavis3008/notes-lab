import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteNoteAction, restoreNoteAction } from "@/app/actions";

// Fake Supabase client: a query builder that records every call made on it and,
// when awaited, answers with whatever the test put in `reply`. No network, no data.
type Call = [method: string, args: unknown[]];
const fake = vi.hoisted(() => ({
  reply: { data: null, error: null } as {
    data: { id: number }[] | null;
    error: { code?: string; message: string } | null;
  },
  tables: [] as string[],
  // One list of calls per query.
  queries: [] as Call[][],
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      fake.tables.push(table);
      const calls: Call[] = [];
      fake.queries.push(calls);
      const builder: Record<string, unknown> = {
        then: (resolve: (value: unknown) => unknown) => resolve(fake.reply),
      };
      for (const method of ["select", "update", "delete", "eq", "is", "not"]) {
        builder[method] = (...args: unknown[]) => {
          calls.push([method, args]);
          return builder;
        };
      }
      return builder;
    },
  }),
}));

const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath }));

const redirect = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect }));

// Pretend someone is signed in; the real check asks the Supabase Auth server.
const requireUser = vi.hoisted(() => vi.fn(async () => ({ id: "user-1" })));
vi.mock("@/lib/auth", () => ({ requireUser }));

function updatePayload(): Record<string, unknown> {
  const update = fake.queries[0].find(([method]) => method === "update");
  return update?.[1][0] as Record<string, unknown>;
}

beforeEach(() => {
  fake.reply = { data: [{ id: 7 }], error: null };
  fake.tables = [];
  fake.queries = [];
  revalidatePath.mockClear();
  redirect.mockClear();
  requireUser.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("deleteNoteAction", () => {
  it("checks the user on the server before anything else", async () => {
    await deleteNoteAction(7, false);
    expect(requireUser).toHaveBeenCalledTimes(1);
  });

  // The note is moved to Deleted, not removed: the row stays and gets deleted_at.
  it("sets deleted_at on the note instead of deleting the row", async () => {
    const state = await deleteNoteAction(7, false);
    expect(state).toBeUndefined();
    expect(fake.tables).toEqual(["notes"]);
    expect(fake.queries[0].some(([method]) => method === "delete")).toBe(false);
    expect(typeof updatePayload().deleted_at).toBe("string");
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("leaves updated_at alone, like pinning", async () => {
    await deleteNoteAction(7, false);
    expect(updatePayload()).not.toHaveProperty("updated_at");
  });

  it("goes to the list only when asked to", async () => {
    await deleteNoteAction(7, false);
    expect(redirect).not.toHaveBeenCalled();
    await deleteNoteAction(7);
    expect(redirect).toHaveBeenCalledWith("/notes");
  });

  it("tells the user when the note is already gone", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fake.reply = { data: [], error: null };
    const state = await deleteNoteAction(7, false);
    expect(state).toEqual({ error: "This note no longer exists." });
  });
});

describe("restoreNoteAction", () => {
  it("checks the user on the server before anything else", async () => {
    await restoreNoteAction(7);
    expect(requireUser).toHaveBeenCalledTimes(1);
  });

  it("clears deleted_at and nothing else, so the collection, tags, pin and completed state stay", async () => {
    const state = await restoreNoteAction(7);
    expect(state).toBeUndefined();
    expect(fake.tables).toEqual(["notes"]);
    expect(updatePayload()).toEqual({ deleted_at: null });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("rejects an id that is not a whole number without touching the database", async () => {
    const state = await restoreNoteAction(Number.NaN);
    expect(state).toEqual({ error: "Could not restore the note. Please try again." });
    expect(fake.tables).toEqual([]);
  });

  it("tells the user when the note is gone", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fake.reply = { data: [], error: null };
    const state = await restoreNoteAction(7);
    expect(state).toEqual({ error: "This note no longer exists." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
