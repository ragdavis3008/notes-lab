import Link from "next/link";

export function Sidebar() {
  return (
    <aside className="flex w-full shrink-0 items-center gap-4 border-b border-foreground/10 p-4 sm:block sm:w-56 sm:border-b-0 sm:border-r">
      <Link href="/" className="block text-lg font-semibold sm:mb-6">
        Notes
      </Link>
      <nav className="flex flex-row gap-1 text-sm sm:flex-col">
        <Link
          href="/"
          className="rounded-md bg-foreground/10 px-3 py-2 font-medium"
        >
          All notes
        </Link>
        {/* Collections and tags sections will be added here in later features. */}
      </nav>
    </aside>
  );
}
