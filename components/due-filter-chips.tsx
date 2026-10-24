import Link from "next/link";

type Chip = { label: string; count: number; href: string; selected: boolean };

// The due date filter: plain links, so the choice lives in the URL (?due=...).
export function DueFilterChips({ chips }: { chips: Chip[] }) {
  return (
    <nav aria-label="Filter by due date" className="mb-3 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={chip.href}
          scroll={false}
          aria-current={chip.selected ? "true" : undefined}
          className={
            chip.selected
              ? "rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
              : "rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground/70 hover:bg-primary/10 hover:text-primary"
          }
        >
          {chip.label} <span className="opacity-70">{chip.count}</span>
        </Link>
      ))}
    </nav>
  );
}
