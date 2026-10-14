import { TAG_COLOR_CLASSES, type TagColor } from "@/lib/tag-colors";

// The name is always shown as text, so colour is never the only signal.
export function TagPill({ name, color }: { name: string; color: TagColor }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs ${TAG_COLOR_CLASSES[color].pill}`}
    >
      {name}
    </span>
  );
}

export function TagDot({ color }: { color: TagColor }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${TAG_COLOR_CLASSES[color].dot}`}
    />
  );
}
