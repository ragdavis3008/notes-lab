// Cleans a tag name typed by the user: trimmed and lowercase, like every saved tag
// name. Returns an error message when nothing is left after trimming.
export function parseTagName(raw: string): { name: string } | { error: string } {
  const name = raw.trim().toLowerCase();
  if (name === "") return { error: "Tag name is required." };
  return { name };
}
