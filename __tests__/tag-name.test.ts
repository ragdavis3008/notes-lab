import { describe, expect, it } from "vitest";
import { parseTagName } from "@/lib/tag-name";

describe("parseTagName", () => {
  it("trims the name and saves it in lowercase", () => {
    expect(parseTagName("  Work Stuff  ")).toEqual({ name: "work stuff" });
  });

  it("asks for a name when the text is empty or only spaces", () => {
    expect(parseTagName("")).toEqual({ error: "Tag name is required." });
    expect(parseTagName("   ")).toEqual({ error: "Tag name is required." });
  });
});
