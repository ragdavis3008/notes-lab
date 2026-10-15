import { describe, expect, it } from "vitest";
import { TAG_COLORS, isTagColor } from "@/lib/tag-colors";

describe("isTagColor", () => {
  it("has the eight palette colours", () => {
    expect(TAG_COLORS).toEqual([
      "gray",
      "red",
      "orange",
      "yellow",
      "green",
      "blue",
      "purple",
      "pink",
    ]);
  });

  it.each(TAG_COLORS)("accepts %s", (color) => {
    expect(isTagColor(color)).toBe(true);
  });

  it("rejects names with the wrong case", () => {
    expect(isTagColor("Red")).toBe(false);
    expect(isTagColor("BLUE")).toBe(false);
  });

  it("rejects unknown colours and empty text", () => {
    expect(isTagColor("teal")).toBe(false);
    expect(isTagColor("")).toBe(false);
    expect(isTagColor(" red")).toBe(false);
  });

  it("rejects values that are not strings", () => {
    expect(isTagColor(undefined)).toBe(false);
    expect(isTagColor(null)).toBe(false);
    expect(isTagColor(42)).toBe(false);
    expect(isTagColor({})).toBe(false);
    expect(isTagColor(["red"])).toBe(false);
  });

  it("rejects inherited object property names", () => {
    expect(isTagColor("toString")).toBe(false);
    expect(isTagColor("constructor")).toBe(false);
    expect(isTagColor("__proto__")).toBe(false);
  });
});
