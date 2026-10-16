import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCollectionAction } from "@/app/actions";

// Fake Supabase client: supports only from().insert() and answers with
// whatever the test put in `reply`. No network, no real data.
const fake = vi.hoisted(() => ({
  reply: { error: null } as { error: { code?: string; message: string } | null },
  inserted: [] as { table: string; values: unknown }[],
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => ({
      insert: async (values: unknown) => {
        fake.inserted.push({ table, values });
        return fake.reply;
      },
    }),
  }),
}));

const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath }));

// Signed in by default; a test can make it throw like redirect("/auth/login").
const requireUser = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth", () => ({ requireUser }));

function form(name: string) {
  const data = new FormData();
  data.set("name", name);
  return data;
}

beforeEach(() => {
  fake.reply = { error: null };
  fake.inserted = [];
  revalidatePath.mockClear();
  requireUser.mockReset();
  requireUser.mockResolvedValue({ id: "user-1" });
});

describe("createCollectionAction when signed out", () => {
  it("redirects to login and saves nothing", async () => {
    requireUser.mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(
      createCollectionAction(undefined, form("Work")),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(fake.inserted).toEqual([]);
  });
});

describe("createCollectionAction", () => {
  it("asks for a name when the text is blank and keeps what was typed", async () => {
    const state = await createCollectionAction(undefined, form("   "));
    expect(state).toEqual({
      error: "Collection name is required.",
      value: "   ",
    });
    expect(fake.inserted).toEqual([]);
  });

  it("says the name exists when another collection has it, and keeps the typed name", async () => {
    fake.reply = {
      error: { code: "23505", message: "duplicate key value" },
    };
    const state = await createCollectionAction(undefined, form(" WORK "));
    expect(state).toEqual({
      error: "A collection with this name already exists.",
      value: " WORK ",
    });
  });

  it("saves the trimmed name, reports success and refreshes every page", async () => {
    const state = await createCollectionAction(undefined, form("  Work  "));
    expect(state).toEqual({ saved: expect.any(Number) });
    expect(fake.inserted).toEqual([
      { table: "collections", values: { name: "Work" } },
    ]);
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });
});
