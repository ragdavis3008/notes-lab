// Turns typed text into a safe to_tsquery string: "meet notes" -> "meet:* & notes:*".
// Only letters, combining marks and digits are kept; everything else (including
// every tsquery operator such as & | ! ( ) < > : * ' and backslash) just separates
// words, so the text cannot change the query or cause a syntax error. Every word
// must match (&) and matches as a prefix (:*), so results narrow while typing.
// Returns null when no words are left (for example "???"): nothing to search for.
export function toTsQuery(search: string): string | null {
  const words = search
    .toLowerCase()
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter(Boolean);
  if (words.length === 0) return null;
  return words.map((w) => `${w}:*`).join(" & ");
}
