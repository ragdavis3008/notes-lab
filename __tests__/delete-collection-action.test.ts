import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteCollectionAction } from "@/app/actions";

// Fake Supabase client: supports only from().delete().eq().select() and
// answers with whatever the test put in `reply`. No network, no real data.
const fake = vi.hoisted(() => ({
  reply: { data: null, error: null } as {
    data: { id: string }[] | null;
    error: { code?: string; message: string } | null;
  },
  // Table names passed to from(), one entry per call.
  tables: [] as string[],
  deletes: 0,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      fake.tables.push(table);
      return {
        delete: () => ({
          eq: () => ({
            select: async () => {
              fake.deletes += 1;
              return fake.reply;
            },
          }),
        }),
      };
    },
  }),
}));

const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath }));

// Pretend someone is signed in; the real check asks the Supabase Auth server.
const requireUser = vi.hoisted(() => vi.fn(async () => ({ id: "user-1" })));
vi.mock("@/lib/auth", () => ({ requireUser }));

const ID = "123e4567-e89b-12d3-a456-426614174000";

beforeEach(() => {
  fake.reply = { data: [{ id: ID }], error: null };
  fake.tables = [];
  fake.deletes = 0;
  revalidatePath.mockClear();
  requireUser.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("deleteCollectionAction", () => {
  it("checks the user on the server before anything else", async () => {
    await deleteCollectionAction(ID);
    expect(requireUser).toHaveBeenCalledTimes(1);
  });

  it("deletes only from the collections table and refreshes every page", async () => {
    const state = await deleteCollectionAction(ID);
    expect(state).toBeUndefined();
    expect(fake.tables).toEqual(["collections"]);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("rejects an id that is not a uuid without deleting anything", async () => {
    const state = await deleteCollectionAction("42");
    expect(state).toEqual({ error: "That collection is not valid." });
    expect(fake.deletes).toBe(0);
  });

  it("tells the user to reload when the collection is already gone", async () => {
    fake.reply = { data: [], error: null };
    const state = await deleteCollectionAction(ID);
    expect(state).toEqual({
      error: "This collection no longer exists. Reload the page.",
    });
  });

  it("shows a general error and does not refresh when deleting fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fake.reply = { data: null, error: { code: "08006", message: "connection lost" } };
    const state = await deleteCollectionAction(ID);
    expect(state).toEqual({
      error: "Could not delete the collection. Please try again.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
