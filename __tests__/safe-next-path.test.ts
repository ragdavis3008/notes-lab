import { describe, expect, it, vi } from "vitest";

// lib/auth.ts imports the server client, which needs Next.js request cookies.
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { safeNextPath } from "@/lib/auth";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/notes")).toBe("/notes");
    expect(safeNextPath("/notes/5?x=1")).toBe("/notes/5?x=1");
  });

  it("falls back to /notes when missing or empty", () => {
    expect(safeNextPath(null)).toBe("/notes");
    expect(safeNextPath("")).toBe("/notes");
  });

  it("rejects other websites", () => {
    expect(safeNextPath("https://evil.example")).toBe("/notes");
    expect(safeNextPath("//evil.example")).toBe("/notes");
    expect(safeNextPath("/\\evil.example")).toBe("/notes");
    expect(safeNextPath("evil.example")).toBe("/notes");
  });
});
