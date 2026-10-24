// Helpers for notes.due_date. Due dates are plain "YYYY-MM-DD" strings, which sort
// and compare correctly as text, so no Date maths is needed for the comparisons.

export type DueFilter = "all" | "overdue" | "week";

// True for a real calendar date written as YYYY-MM-DD ("2026-02-30" is not).
export function isDateString(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function toDateString(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// Today's date in local time. `now` is a parameter so tests do not depend on the
// clock. Call it only after the page has read the request (for example after
// requireUser()), or Next.js warns about Date.now() while prerendering.
export function todayString(now: Date = new Date()): string {
  return toDateString(now);
}

// The date n days after `date` (n may be negative).
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return toDateString(new Date(year, month - 1, day + days));
}

export function isOverdue(dueDate: string | null, today: string): boolean {
  return dueDate !== null && dueDate < today;
}

// Today up to 7 days from today, both included.
export function isDueWithin7Days(dueDate: string | null, today: string): boolean {
  return dueDate !== null && dueDate >= today && dueDate <= addDays(today, 7);
}

// "28/10/2026". Written by hand so the server and the browser always agree.
export function formatDue(dueDate: string): string {
  const [year, month, day] = dueDate.split("-");
  return `${day}/${month}/${year}`;
}

// Reads ?due=. Anything unknown means "all".
export function parseDueFilter(raw: string | string[] | undefined): DueFilter {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "overdue" || value === "week" ? value : "all";
}

// What the form sent for the due date: "" means none. Returns undefined for text
// that is not a real date, so the caller can show an error.
export function parseDueDate(raw: string): string | null | undefined {
  const value = raw.trim();
  if (value === "") return null;
  return isDateString(value) ? value : undefined;
}
