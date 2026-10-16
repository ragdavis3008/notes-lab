// Helpers for the notes filter kept in the URL of "/notes": ?collection=...&tag=1&tag=2&q=text

// Reads the repeated `tag` param into unique, safe integer ids.
export function parseTagIds(raw: string | string[] | undefined): number[] {
  const values = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];
  const ids = new Set<number>();
  for (const value of values) {
    if (!/^\d+$/.test(value)) continue;
    const id = Number(value);
    if (Number.isSafeInteger(id)) ids.add(id);
  }
  return [...ids];
}

export const MAX_SEARCH_LENGTH = 200;

// Reads ?q= into trimmed search text. Blank text means "no search" (empty string).
export function normalizeSearch(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
}

// `collection` is "all", "uncollected" or a collection id. `q` is the search text.
export function filterHref(
  collection: string,
  tagIds: number[],
  q: string = "",
): string {
  const params = new URLSearchParams();
  if (collection !== "all") params.set("collection", collection);
  for (const id of tagIds) params.append("tag", String(id));
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/notes?${query}` : "/notes";
}
