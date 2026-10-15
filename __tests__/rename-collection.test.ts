import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CollectionNotFoundError,
  DuplicateCollectionError,
  renameCollection,
} from "@/lib/db";

// Fake Supabase client: supports only from().update().eq().select() and
// answers with whatever the test put in `reply`. No network, no real data.
const fake = vi.hoisted(() => ({
  reply: { data: null, error: null } as {
    data: { id: string }[] | null;
    error: { code?: string; message: string } | null;
  },
  // The write the code asked for: table, new values, and the row filter.
  write: null as {
    table: string;
    values: unknown;
    column: string;
    value: unknown;
  } | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => ({
      update: (values: unknown) => ({
        eq: (column: string, value: unknown) => ({
          select: async () => {
            fake.write = { table, values, column, value };
            return fake.reply;
          },
        }),
      }),
    }),
  }),
}));

const ID = "123e4567-e89b-12d3-a456-426614174000";

beforeEach(() => {
  fake.reply = { data: [{ id: ID }], error: null };
  fake.write = null;
});

describe("renameCollection", () => {
  it("saves only the new name on the chosen collection", async () => {
    await renameCollection(ID, "Work");
    expect(fake.write).toEqual({
      table: "collections",
      values: { name: "Work" },
      column: "id",
      value: ID,
    });
  });

  it("rejects a name that another collection already has", async () => {
    fake.reply = {
      data: null,
      error: { code: "23505", message: "duplicate key value" },
    };
    await expect(renameCollection(ID, "Work")).rejects.toBeInstanceOf(
      DuplicateCollectionError,
    );
  });

  it("rejects a collection that was deleted", async () => {
    fake.reply = { data: [], error: null };
    await expect(renameCollection(ID, "Work")).rejects.toBeInstanceOf(
      CollectionNotFoundError,
    );
  });

  it("passes on the message of any other database error", async () => {
    fake.reply = { data: null, error: { code: "08006", message: "connection lost" } };
    await expect(renameCollection(ID, "Work")).rejects.toThrow("connection lost");
  });
});
