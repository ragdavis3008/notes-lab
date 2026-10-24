import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteTagAction } from "@/app/actions";

// Fake Supabase client: supports only from().delete().eq().select() and
// answers with whatever the test put in `reply`. No network, no real data.
const fake = vi.hoisted(() => ({
  reply: { data: null, error: null } as {
    data: { id: number }[] | null;
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

beforeEach(() => {
  fake.reply = { data: [{ id: 7 }], error: null };
  fake.tables = [];
  fake.deletes = 0;
  revalidatePath.mockClear();
  requireUser.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("deleteTagAction", () => {
  it("checks the user on the server before anything else", async () => {
    await deleteTagAction(7);
    expect(requireUser).toHaveBeenCalledTimes(1);
  });

  // The database removes the tag's note_tags rows itself (ON DELETE CASCADE) and
  // never touches the notes, so the app only deletes the tags row.
  it("deletes only from the tags table and refreshes every page", async () => {
    const state = await deleteTagAction(7);
    expect(state).toBeUndefined();
    expect(fake.tables).toEqual(["tags"]);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("rejects an id that is not a whole number without deleting anything", async () => {
    const state = await deleteTagAction(Number.NaN);
    expect(state).toEqual({ error: "That tag is not valid." });
    expect(fake.deletes).toBe(0);
  });

  it("tells the user to reload when the tag is already gone", async () => {
    fake.reply = { data: [], error: null };
    const state = await deleteTagAction(7);
    expect(state).toEqual({ error: "This tag no longer exists. Reload the page." });
  });

  it("shows a general error and does not refresh when deleting fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fake.reply = { data: null, error: { code: "08006", message: "connection lost" } };
    const state = await deleteTagAction(7);
    expect(state).toEqual({ error: "Could not delete the tag. Please try again." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
