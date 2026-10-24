import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renameTagAction } from "@/app/actions";

// Fake Supabase client: supports only from().update().eq().select() and
// answers with whatever the test put in `reply`. No network, no real data.
const fake = vi.hoisted(() => ({
  reply: { data: null, error: null } as {
    data: { id: number }[] | null;
    error: { code?: string; message: string } | null;
  },
  // Table names passed to from(), one entry per call.
  tables: [] as string[],
  // The values passed to update(), one entry per write.
  updated: [] as unknown[],
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      fake.tables.push(table);
      return {
        update: (values: unknown) => ({
          eq: () => ({
            select: async () => {
              fake.updated.push(values);
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

function form(name: string) {
  const data = new FormData();
  data.set("name", name);
  return data;
}

beforeEach(() => {
  fake.reply = { data: [{ id: 7 }], error: null };
  fake.tables = [];
  fake.updated = [];
  revalidatePath.mockClear();
  requireUser.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("renameTagAction", () => {
  it("checks the user on the server before anything else", async () => {
    await renameTagAction(7, undefined, form("work"));
    expect(requireUser).toHaveBeenCalledTimes(1);
  });

  it("asks for a name when the text is blank and keeps what was typed", async () => {
    const state = await renameTagAction(7, undefined, form("   "));
    expect(state).toEqual({ error: "Tag name is required.", value: "   " });
    expect(fake.updated).toEqual([]);
  });

  it("says the name is taken when another tag has it, and keeps the typed name", async () => {
    fake.reply = { data: null, error: { code: "23505", message: "duplicate key value" } };
    const state = await renameTagAction(7, undefined, form(" WORK "));
    expect(state).toEqual({
      error: "A tag with this name already exists.",
      value: " WORK ",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("tells the user to reload when the tag was deleted elsewhere", async () => {
    fake.reply = { data: [], error: null };
    const state = await renameTagAction(7, undefined, form("work"));
    expect(state).toEqual({
      error: "This tag no longer exists. Reload the page.",
      value: "work",
    });
  });

  it("shows a general error and does not refresh when saving fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fake.reply = { data: null, error: { code: "08006", message: "connection lost" } };
    const state = await renameTagAction(7, undefined, form("work"));
    expect(state).toEqual({
      error: "Could not rename the tag. Please try again.",
      value: "work",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects an id that is not a whole number without saving anything", async () => {
    const state = await renameTagAction(1.5, undefined, form("work"));
    expect(state).toEqual({ error: "That tag is not valid.", value: "work" });
    expect(fake.updated).toEqual([]);
  });

  it("saves only the trimmed lowercase name, so the colour stays, then refreshes every page", async () => {
    const state = await renameTagAction(7, undefined, form("  Work  "));
    expect(state).toEqual({ saved: expect.any(Number) });
    expect(fake.tables).toEqual(["tags"]);
    expect(fake.updated).toEqual([{ name: "work" }]);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
