// The tag colour palette. The database stores only the colour name (see
// docs/database-schema.md); this is the one place that maps each name to Tailwind
// classes. Every class is written out in full so Tailwind finds and generates it.
// Never build a class name from a string here (like `bg-${color}-100`).
//
// pill: tinted background with dark text (light mode) or light text (dark mode).
// dot: solid colour for the small round marker.
export const TAG_COLOR_CLASSES = {
  gray: {
    pill: "bg-gray-200 text-gray-900 dark:bg-gray-500/30 dark:text-gray-100",
    dot: "bg-gray-500",
  },
  red: {
    pill: "bg-red-100 text-red-900 dark:bg-red-500/30 dark:text-red-100",
    dot: "bg-red-500",
  },
  orange: {
    pill: "bg-orange-100 text-orange-900 dark:bg-orange-500/30 dark:text-orange-100",
    dot: "bg-orange-500",
  },
  yellow: {
    pill: "bg-yellow-100 text-yellow-900 dark:bg-yellow-500/30 dark:text-yellow-100",
    dot: "bg-yellow-500",
  },
  green: {
    pill: "bg-green-100 text-green-900 dark:bg-green-500/30 dark:text-green-100",
    dot: "bg-green-500",
  },
  blue: {
    pill: "bg-blue-100 text-blue-900 dark:bg-blue-500/30 dark:text-blue-100",
    dot: "bg-blue-500",
  },
  purple: {
    pill: "bg-purple-100 text-purple-900 dark:bg-purple-500/30 dark:text-purple-100",
    dot: "bg-purple-500",
  },
  pink: {
    pill: "bg-pink-100 text-pink-900 dark:bg-pink-500/30 dark:text-pink-100",
    dot: "bg-pink-500",
  },
} as const;

// The eight allowed names, taken from the palette so they cannot drift apart.
export type TagColor = keyof typeof TAG_COLOR_CLASSES;

export const TAG_COLORS = Object.keys(TAG_COLOR_CLASSES) as TagColor[];

export function isTagColor(value: unknown): value is TagColor {
  return typeof value === "string" && Object.hasOwn(TAG_COLOR_CLASSES, value);
}
