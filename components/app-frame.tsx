"use client";

import { ChevronLeft, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

// The page frame. From the `sm` breakpoint up the sidebar sits beside the content.
// On a phone it is a menu that slides in from the left (opened with the ☰ button).
// The sidebar and header are server components, passed in from components/app-shell.tsx.
export function AppFrame({
  sidebar,
  header,
  backLink,
  children,
}: {
  sidebar: ReactNode;
  header: ReactNode;
  // Phone only: a "‹ All notes" button for note pages.
  backLink: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="min-h-screen sm:flex">
      {open && (
        <div
          aria-hidden
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 sm:hidden"
        />
      )}
      {/* Closed on a phone: moved off-screen and invisible, so its links cannot be
          tabbed to. Any link clicked inside closes the menu. */}
      <aside
        id="sidebar"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}
        className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] overflow-y-auto bg-sidebar p-4 shadow-xl transition-[transform,visibility] duration-200 sm:sticky sm:top-0 sm:z-auto sm:h-screen sm:w-64 sm:max-w-none sm:shrink-0 sm:translate-x-0 sm:shadow-none sm:visible ${
          open ? "visible translate-x-0" : "invisible -translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="absolute right-3 top-4 rounded-full p-1.5 text-foreground/60 hover:bg-foreground/10 sm:hidden"
        >
          <X aria-hidden size={20} />
        </button>
        {sidebar}
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex shrink-0 items-center gap-1 sm:hidden">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="sidebar"
              className="-ml-2 rounded-full p-2 text-primary hover:bg-primary/10"
            >
              <Menu aria-hidden size={22} />
            </button>
            {backLink && (
              <Link
                href="/notes"
                className="flex items-center rounded-full py-1 pr-2 text-primary hover:bg-primary/10"
              >
                <ChevronLeft aria-hidden size={22} />
                All notes
              </Link>
            )}
          </div>
          <div className="ml-auto min-w-0">{header}</div>
        </div>
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
