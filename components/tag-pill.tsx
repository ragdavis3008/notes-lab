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

// Without a name the dot is decoration (the name is written next to it). With a
// name, the dot is the only mark of the tag, so it gets a hover title and a label.
export function TagDot({ color, name }: { color: TagColor; name?: string }) {
  const className = `inline-block h-2.5 w-2.5 shrink-0 rounded-full ${TAG_COLOR_CLASSES[color].dot}`;
  if (name === undefined) return <span aria-hidden className={className} />;
  return <span role="img" aria-label={name} title={name} className={className} />;
}
