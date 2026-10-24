import { describe, expect, it } from "vitest";
import { deletesInLabel } from "@/lib/deleted";

const DAY = 24 * 60 * 60 * 1000;
const deletedAt = new Date("2026-10-24T09:00:00.000Z");

// `daysAfter` is how long after the deletion the page is looked at.
function labelAfter(daysAfter: number) {
  return deletesInLabel(deletedAt.toISOString(), new Date(deletedAt.getTime() + daysAfter * DAY));
}

describe("deletesInLabel", () => {
  it("says 30 days right after the note was deleted", () => {
    expect(labelAfter(0)).toBe("Deletes in 30 days");
  });

  it("counts the days that are left", () => {
    expect(labelAfter(18)).toBe("Deletes in 12 days");
    expect(labelAfter(5)).toBe("Deletes in 25 days");
  });

  it("rounds a part of a day up, so the note is never deleted sooner than said", () => {
    expect(labelAfter(17.5)).toBe("Deletes in 13 days");
  });

  it("says tomorrow with a day or less left", () => {
    expect(labelAfter(29)).toBe("Deletes tomorrow");
    expect(labelAfter(29.5)).toBe("Deletes tomorrow");
    expect(labelAfter(28.2)).toBe("Deletes in 2 days");
  });

  it("says today once the 30 days are over", () => {
    expect(labelAfter(30)).toBe("Deletes today");
  });

  it("still says today when the purge is a little late", () => {
    expect(labelAfter(31)).toBe("Deletes today");
  });
});
