// Largest unit first. Sizes are in seconds; months and years are approximate,
// which is fine for a label like "2 months ago".
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

// "just now", "5 minutes ago", "yesterday", "2 days ago"... `now` is a
// parameter so tests do not depend on the clock.
export function timeAgo(iso: string, now: number = Date.now()): string {
  const seconds = Math.floor((now - new Date(iso).getTime()) / 1000);
  if (Number.isNaN(seconds)) return "recently";
  // Under a minute, and dates slightly in the future (clock differences).
  if (seconds < 60) return "just now";

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of UNITS) {
    if (seconds >= size) return formatter.format(-Math.floor(seconds / size), unit);
  }
  return "just now";
}
