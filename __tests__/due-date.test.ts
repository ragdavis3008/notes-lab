import { describe, expect, it } from "vitest";
import {
  addDays,
  formatDue,
  isDateString,
  isDueWithin7Days,
  isOverdue,
  parseDisplayDate,
  parseDueDate,
  parseDueFilter,
  todayString,
} from "@/lib/due-date";

const TODAY = "2026-10-23";

describe("isDateString", () => {
  it("accepts real dates", () => {
    expect(isDateString("2026-10-23")).toBe(true);
    expect(isDateString("2028-02-29")).toBe(true);
  });

  it("rejects impossible dates and other formats", () => {
    expect(isDateString("2026-02-30")).toBe(false);
    expect(isDateString("2027-02-29")).toBe(false);
    expect(isDateString("2026-13-01")).toBe(false);
    expect(isDateString("23/10/2026")).toBe(false);
    expect(isDateString("2026-1-5")).toBe(false);
    expect(isDateString("")).toBe(false);
  });
});

describe("todayString and addDays", () => {
  it("formats the local date", () => {
    expect(todayString(new Date(2026, 9, 3, 23, 59))).toBe("2026-10-03");
  });

  it("moves across month and year ends", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("isOverdue", () => {
  it("is true only for dates before today", () => {
    expect(isOverdue("2026-10-22", TODAY)).toBe(true);
    expect(isOverdue(TODAY, TODAY)).toBe(false);
    expect(isOverdue("2026-10-24", TODAY)).toBe(false);
  });

  it("is false when there is no due date", () => {
    expect(isOverdue(null, TODAY)).toBe(false);
  });
});

describe("isDueWithin7Days", () => {
  it("includes today and day 7, nothing outside", () => {
    expect(isDueWithin7Days(TODAY, TODAY)).toBe(true);
    expect(isDueWithin7Days("2026-10-30", TODAY)).toBe(true);
    expect(isDueWithin7Days("2026-10-31", TODAY)).toBe(false);
    expect(isDueWithin7Days("2026-10-22", TODAY)).toBe(false);
  });

  it("is false when there is no due date", () => {
    expect(isDueWithin7Days(null, TODAY)).toBe(false);
  });
});

describe("formatDue", () => {
  it("writes dd/mm/yyyy", () => {
    expect(formatDue("2026-10-28")).toBe("28/10/2026");
    expect(formatDue("2026-01-05")).toBe("05/01/2026");
    expect(formatDue("2026-09-01")).toBe("01/09/2026");
  });
});

describe("parseDisplayDate", () => {
  it("turns dd/mm/yyyy into YYYY-MM-DD", () => {
    expect(parseDisplayDate("28/10/2026")).toBe("2026-10-28");
    expect(parseDisplayDate("05/01/2026")).toBe("2026-01-05");
    expect(parseDisplayDate("29/02/2028")).toBe("2028-02-29");
  });

  it("accepts one-digit days and months and ignores surrounding spaces", () => {
    expect(parseDisplayDate("5/1/2026")).toBe("2026-01-05");
    expect(parseDisplayDate("  28/10/2026 ")).toBe("2026-10-28");
  });

  it("treats empty text as no date", () => {
    expect(parseDisplayDate("")).toBeNull();
    expect(parseDisplayDate("   ")).toBeNull();
  });

  it("returns undefined for dates that do not exist", () => {
    expect(parseDisplayDate("31/02/2026")).toBeUndefined();
    expect(parseDisplayDate("29/02/2026")).toBeUndefined();
    expect(parseDisplayDate("00/10/2026")).toBeUndefined();
    expect(parseDisplayDate("10/13/2026")).toBeUndefined();
  });

  it("returns undefined for text in another format", () => {
    expect(parseDisplayDate("2026-10-28")).toBeUndefined();
    expect(parseDisplayDate("28-10-2026")).toBeUndefined();
    expect(parseDisplayDate("28/10/26")).toBeUndefined();
    expect(parseDisplayDate("tomorrow")).toBeUndefined();
  });
});

describe("parseDueFilter", () => {
  it("reads the known values", () => {
    expect(parseDueFilter("overdue")).toBe("overdue");
    expect(parseDueFilter("week")).toBe("week");
  });

  it("falls back to all", () => {
    expect(parseDueFilter(undefined)).toBe("all");
    expect(parseDueFilter("soon")).toBe("all");
    expect(parseDueFilter([])).toBe("all");
  });

  it("uses the first value when repeated", () => {
    expect(parseDueFilter(["week", "overdue"])).toBe("week");
  });
});

describe("parseDueDate", () => {
  it("turns blank into no due date", () => {
    expect(parseDueDate("")).toBeNull();
    expect(parseDueDate("  ")).toBeNull();
  });

  it("keeps a valid date", () => {
    expect(parseDueDate("2026-10-28")).toBe("2026-10-28");
  });

  it("returns undefined for text that is not a date", () => {
    expect(parseDueDate("tomorrow")).toBeUndefined();
    expect(parseDueDate("2026-02-30")).toBeUndefined();
  });
});
