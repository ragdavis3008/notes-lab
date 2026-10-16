import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renameCollectionAction } from "@/app/actions";

// Fake Supabase client: supports only from().update().eq().select() and
// answers with whatever the test put in `reply`. No network, no real data.
const fake = vi.hoisted(() => ({
  reply: { data: null, error: null } as {
    data: { id: string }[] | null;
    error: { code?: string; message: string } | null;
  },
  writes: 0,
  // The values passed to update(), one entry per write.
  updated: [] as unknown[],
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      update: (values: unknown) => ({
        eq: () => ({
          select: async () => {
            fake.updated.push(values);
            fake.writes += 1;
            return fake.reply;
          },
        }),
      }),
    }),
  }),
}));

const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath }));

// Pretend someone is signed in; the real check asks the Supabase Auth server.
vi.mock("@/lib/auth", () => ({ requireUser: async () => ({ id: "user-1" }) }));

const ID = "123e4567-e89b-12d3-a456-426614174000";

function form(name: string) {
  const data = new FormData();
  data.set("name", name);
  return data;
}

beforeEach(() => {
  fake.reply = { data: [{ id: ID }], error: null };
  fake.writes = 0;
  fake.updated = [];
  revalidatePath.mockClear();
});

// The vitest config does not set restoreMocks, so put console.error back here.
afterEach(() => {
  vi.restoreAllMocks();
});

describe("renameCollectionAction", () => {
  it("asks for a name when the text is blank and keeps what was typed", async () => {
    const state = await renameCollectionAction(ID, undefined, form("   "));
    expect(state).toEqual({
      error: "Collection name is required.",
      value: "   ",
    });
    expect(fake.writes).toBe(0);
  });

  it("says the name exists when another collection has it, and keeps the typed name", async () => {
    fake.reply = {
      data: null,
      error: { code: "23505", message: "duplicate key value" },
    };
    const state = await renameCollectionAction(ID, undefined, form(" WORK "));
    expect(state).toEqual({
      error: "A collection with this name already exists.",
      value: " WORK ",
    });
  });

  it("tells the user to reload when the collection was deleted elsewhere", async () => {
    fake.reply = { data: [], error: null };
    const state = await renameCollectionAction(ID, undefined, form("Work"));
    expect(state).toEqual({
      error: "This collection no longer exists. Reload the page.",
      value: "Work",
    });
  });

  it("shows a general error, keeps the name and does not refresh when saving fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fake.reply = { data: null, error: { code: "08006", message: "connection lost" } };
    const state = await renameCollectionAction(ID, undefined, form("Work"));
    expect(state).toEqual({
      error: "Could not rename the collection. Please try again.",
      value: "Work",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects an id that is not a uuid without saving anything", async () => {
    const state = await renameCollectionAction("42", undefined, form("Work"));
    expect(state).toEqual({
      error: "That collection is not valid.",
      value: "Work",
    });
    expect(fake.writes).toBe(0);
  });

  it("saves the trimmed name, reports success and refreshes every page after a rename", async () => {
    const state = await renameCollectionAction(ID, undefined, form("  Work  "));
    expect(state).toEqual({ saved: expect.any(Number) });
    expect(fake.updated).toEqual([{ name: "Work" }]);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
