import { describe, expect, it } from "vitest";
import {
  MAX_SEARCH_LENGTH,
  filterHref,
  normalizeSearch,
  parseTagIds,
} from "@/lib/filter-url";

describe("parseTagIds", () => {
  it("returns an empty list when the param is missing", () => {
    expect(parseTagIds(undefined)).toEqual([]);
  });

  it("reads a single value", () => {
    expect(parseTagIds("3")).toEqual([3]);
  });

  it("reads repeated values in order", () => {
    expect(parseTagIds(["5", "1", "3"])).toEqual([5, 1, 3]);
  });

  it("removes duplicates", () => {
    expect(parseTagIds(["2", "2", "7", "2"])).toEqual([2, 7]);
    expect(parseTagIds(["2", "02"])).toEqual([2]);
  });

  it("skips values that are not plain non-negative integers", () => {
    expect(
      parseTagIds(["abc", "-1", "1.5", "", "1e3", " 2", "2 ", "+4", "4"]),
    ).toEqual([4]);
  });

  it("skips ids too large to be safe integers", () => {
    const tooBig = String(Number.MAX_SAFE_INTEGER) + "0";
    expect(parseTagIds([tooBig, "9"])).toEqual([9]);
  });

  it("keeps the largest safe integer", () => {
    const max = String(Number.MAX_SAFE_INTEGER);
    expect(parseTagIds(max)).toEqual([Number.MAX_SAFE_INTEGER]);
  });

  it("returns an empty list for an empty array", () => {
    expect(parseTagIds([])).toEqual([]);
  });
});

describe("normalizeSearch", () => {
  it("returns an empty string when the param is missing", () => {
    expect(normalizeSearch(undefined)).toBe("");
  });

  it("returns normal text unchanged", () => {
    expect(normalizeSearch("meeting notes")).toBe("meeting notes");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeSearch("  hello \n")).toBe("hello");
  });

  it("turns blank text into an empty string", () => {
    expect(normalizeSearch("")).toBe("");
    expect(normalizeSearch("   \t ")).toBe("");
  });

  it("uses the first value when the param is repeated", () => {
    expect(normalizeSearch([" first ", "second"])).toBe("first");
  });

  it("returns an empty string for an empty array", () => {
    expect(normalizeSearch([])).toBe("");
  });

  it("keeps text of exactly the maximum length", () => {
    const text = "a".repeat(MAX_SEARCH_LENGTH);
    expect(normalizeSearch(text)).toBe(text);
  });

  it("cuts text longer than the maximum length", () => {
    const result = normalizeSearch("a".repeat(MAX_SEARCH_LENGTH + 50));
    expect(result).toHaveLength(MAX_SEARCH_LENGTH);
  });

  it("trims before cutting to the maximum length", () => {
    const text = "  " + "b".repeat(MAX_SEARCH_LENGTH);
    expect(normalizeSearch(text)).toBe("b".repeat(MAX_SEARCH_LENGTH));
  });
});

describe("filterHref", () => {
  it("links to the bare notes page when nothing is filtered", () => {
    expect(filterHref("all", [])).toBe("/notes");
    expect(filterHref("all", [], "")).toBe("/notes");
  });

  it("adds a collection id", () => {
    const id = "123e4567-e89b-12d3-a456-426614174000";
    expect(filterHref(id, [])).toBe(`/notes?collection=${id}`);
  });

  it("supports the uncollected filter", () => {
    expect(filterHref("uncollected", [])).toBe("/notes?collection=uncollected");
  });

  it("repeats the tag param for each tag", () => {
    expect(filterHref("all", [1, 2, 3])).toBe("/notes?tag=1&tag=2&tag=3");
  });

  it("adds search text, encoding special characters", () => {
    expect(filterHref("all", [], "hello world")).toBe("/notes?q=hello+world");
    expect(filterHref("all", [], "a&b#c")).toBe("/notes?q=a%26b%23c");
  });

  it("combines collection, tags and search in that order", () => {
    expect(filterHref("uncollected", [4, 5], "todo")).toBe(
      "/notes?collection=uncollected&tag=4&tag=5&q=todo",
    );
  });

  it("round-trips through the parsers", () => {
    const href = filterHref("all", [8, 9], "  x y ");
    const params = new URL(href, "http://localhost").searchParams;
    expect(parseTagIds(params.getAll("tag"))).toEqual([8, 9]);
    expect(normalizeSearch(params.get("q") ?? undefined)).toBe("x y");
  });
});
