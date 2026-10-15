import { describe, expect, it } from "vitest";
import { isUuid } from "@/lib/uuid";

const VALID = "123e4567-e89b-12d3-a456-426614174000";

describe("isUuid", () => {
  it("accepts a lowercase uuid", () => {
    expect(isUuid(VALID)).toBe(true);
  });

  it("accepts uppercase and mixed case", () => {
    expect(isUuid(VALID.toUpperCase())).toBe(true);
    expect(isUuid("123E4567-e89b-12D3-a456-426614174000")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isUuid("")).toBe(false);
  });

  it("rejects values that are too short or too long", () => {
    expect(isUuid(VALID.slice(0, -1))).toBe(false);
    expect(isUuid(VALID + "0")).toBe(false);
  });

  it("rejects a uuid without hyphens", () => {
    expect(isUuid(VALID.replaceAll("-", ""))).toBe(false);
  });

  it("rejects hyphens in the wrong places", () => {
    expect(isUuid("123e4567e-89b-12d3-a456-426614174000")).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(isUuid("123e4567-e89b-12d3-a456-42661417400g")).toBe(false);
  });

  it("rejects surrounding whitespace and newlines", () => {
    expect(isUuid(` ${VALID}`)).toBe(false);
    expect(isUuid(`${VALID} `)).toBe(false);
    expect(isUuid(`${VALID}\n`)).toBe(false);
  });

  it("rejects the special collection filter values", () => {
    expect(isUuid("all")).toBe(false);
    expect(isUuid("uncollected")).toBe(false);
  });

  it("rejects numeric ids", () => {
    expect(isUuid("42")).toBe(false);
  });
});
