import { describe, expect, it } from "vitest";
import { toTsQuery } from "@/lib/search-query";

describe("toTsQuery", () => {
  it("turns one word into a prefix match", () => {
    expect(toTsQuery("meet")).toBe("meet:*");
  });

  it("joins several words with &", () => {
    expect(toTsQuery("meet notes")).toBe("meet:* & notes:*");
  });

  it("lowercases the words", () => {
    expect(toTsQuery("Meet NOTES")).toBe("meet:* & notes:*");
  });

  it("ignores leading, trailing and repeated whitespace", () => {
    expect(toTsQuery("  meet \t\n  notes  ")).toBe("meet:* & notes:*");
  });

  it("returns null for empty or whitespace-only text", () => {
    expect(toTsQuery("")).toBeNull();
    expect(toTsQuery("   ")).toBeNull();
  });

  it("returns null when only punctuation is left", () => {
    expect(toTsQuery("???")).toBeNull();
    expect(toTsQuery("&|!()<>:*'\\")).toBeNull();
  });

  it("treats tsquery operators as word separators", () => {
    expect(toTsQuery("a&b")).toBe("a:* & b:*");
    expect(toTsQuery("a|b")).toBe("a:* & b:*");
    expect(toTsQuery("!a")).toBe("a:*");
    expect(toTsQuery("(a)<->b")).toBe("a:* & b:*");
    expect(toTsQuery("a:*")).toBe("a:*");
    expect(toTsQuery("it's")).toBe("it:* & s:*");
    expect(toTsQuery("a\\b")).toBe("a:* & b:*");
  });

  it("cannot be used to inject query syntax", () => {
    expect(toTsQuery("'; drop table notes; --")).toBe(
      "drop:* & table:* & notes:*",
    );
  });

  it("splits on hyphens and underscores", () => {
    expect(toTsQuery("to-do")).toBe("to:* & do:*");
    expect(toTsQuery("snake_case")).toBe("snake:* & case:*");
  });

  it("keeps digits", () => {
    expect(toTsQuery("2026 plan b2")).toBe("2026:* & plan:* & b2:*");
  });

  it("keeps accented and non-latin letters", () => {
    expect(toTsQuery("Café")).toBe("café:*");
    expect(toTsQuery("日本語 ノート")).toBe("日本語:* & ノート:*");
  });

  it("keeps combining marks attached to their letters", () => {
    const decomposed = "café"; // e + combining acute accent
    expect(toTsQuery(decomposed)).toBe(`${decomposed}:*`);
  });

  it("drops emoji", () => {
    expect(toTsQuery("🎉 party")).toBe("party:*");
    expect(toTsQuery("🎉")).toBeNull();
  });
});
