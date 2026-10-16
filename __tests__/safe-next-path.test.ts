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

  it("rejects control characters that browsers strip from URLs", () => {
    expect(safeNextPath("/\t/evil.example")).toBe("/notes");
    expect(safeNextPath("/\n/evil.example")).toBe("/notes");
    expect(safeNextPath("/\r/evil.example")).toBe("/notes");
    expect(safeNextPath("/%09/evil.example")).toBe("/notes");
    expect(safeNextPath("/%0a/evil.example")).toBe("/notes");
    expect(safeNextPath("/notes\u0000")).toBe("/notes");
  });

  it("rejects encoded slashes and backslashes", () => {
    expect(safeNextPath("/%2Fevil.example")).toBe("/notes");
    expect(safeNextPath("/%2fevil.example")).toBe("/notes");
    expect(safeNextPath("/%5Cevil.example")).toBe("/notes");
    expect(safeNextPath("/%5cevil.example")).toBe("/notes");
  });

  it("rejects malformed percent-encoding", () => {
    expect(safeNextPath("/%E0%A4%A")).toBe("/notes");
  });

  it("keeps harmless encoded characters", () => {
    expect(safeNextPath("/notes?q=a%20b")).toBe("/notes?q=a%20b");
  });
});
