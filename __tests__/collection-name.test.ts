import { describe, expect, it } from "vitest";
import { parseCollectionName } from "@/lib/collection-name";

describe("parseCollectionName", () => {
  it("returns the name without surrounding spaces", () => {
    expect(parseCollectionName("  Work  ")).toEqual({ name: "Work" });
  });

  it("asks for a name when the text is empty or only spaces", () => {
    const required = { error: "Collection name is required." };
    expect(parseCollectionName("")).toEqual(required);
    expect(parseCollectionName("   \t ")).toEqual(required);
  });
});
