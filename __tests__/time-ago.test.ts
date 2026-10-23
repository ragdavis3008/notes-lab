import { describe, expect, it } from "vitest";
import { timeAgo } from "@/lib/time-ago";

const NOW = Date.parse("2026-10-23T12:00:00Z");

function ago(seconds: number) {
  return timeAgo(new Date(NOW - seconds * 1000).toISOString(), NOW);
}

describe("timeAgo", () => {
  it("says just now for under a minute", () => {
    expect(ago(0)).toBe("just now");
    expect(ago(59)).toBe("just now");
  });

  it("says just now for a date slightly in the future", () => {
    expect(ago(-30)).toBe("just now");
  });

  it("counts minutes and hours", () => {
    expect(ago(5 * 60)).toBe("5 minutes ago");
    expect(ago(3 * 3600)).toBe("3 hours ago");
  });

  it("counts days, and says yesterday for one day", () => {
    expect(ago(24 * 3600)).toBe("yesterday");
    expect(ago(2 * 24 * 3600)).toBe("2 days ago");
  });

  it("counts weeks, months and years", () => {
    expect(ago(14 * 24 * 3600)).toBe("2 weeks ago");
    expect(ago(60 * 24 * 3600)).toBe("2 months ago");
    expect(ago(800 * 24 * 3600)).toBe("2 years ago");
  });

  it("does not crash on an invalid date", () => {
    expect(timeAgo("not a date", NOW)).toBe("recently");
  });
});
