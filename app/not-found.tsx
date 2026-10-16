import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export default function NotFound() {
  return (
    <AppShell>
      <h1 className="mb-2 text-2xl font-semibold">Page not found</h1>
      <p className="mb-4 text-foreground/70">
        We couldn&apos;t find the page you were looking for.
      </p>
      <Link href="/notes" className="text-sm underline">
        Back to all notes
      </Link>
    </AppShell>
  );
}
