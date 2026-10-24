// A deleted note is removed for good this many days after it was deleted. The
// Supabase Cron job purge-deleted-notes uses the same number (docs/database-schema.md).
export const DELETED_RETENTION_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

// The small grey text on the Deleted page. Part of a day counts as a whole day, so
// the note is never deleted sooner than the text says.
export function deletesInLabel(deletedAt: string, now: Date): string {
  const purgeAt = new Date(deletedAt).getTime() + DELETED_RETENTION_DAYS * DAY_MS;
  const days = Math.max(0, Math.ceil((purgeAt - now.getTime()) / DAY_MS));
  if (days === 0) return "Deletes today";
  if (days === 1) return "Deletes tomorrow";
  return `Deletes in ${days} days`;
}
