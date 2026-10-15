// Cleans a collection name typed by the user. Returns an error message when
// nothing is left after trimming.
export function parseCollectionName(
  raw: string,
): { name: string } | { error: string } {
  const name = raw.trim();
  if (name === "") return { error: "Collection name is required." };
  return { name };
}
