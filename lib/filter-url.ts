// Helpers for the notes filter kept in the URL of "/": ?collection=...&tag=1&tag=2

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

// `collection` is "all", "uncollected" or a collection id.
export function filterHref(collection: string, tagIds: number[]): string {
  const params = new URLSearchParams();
  if (collection !== "all") params.set("collection", collection);
  for (const id of tagIds) params.append("tag", String(id));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}
