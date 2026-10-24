"use client";

import { type ReactNode, useState } from "react";

// A sidebar group: a toggle button, the group's link, and the notes below that
// open and close. It replaces <details>/<summary>, because a link inside a
// <summary> is an interactive element inside an interactive element.
export function CollapsibleGroup({
  label,
  open,
  header,
  action,
  children,
}: {
  label: string;
  // Whether the group should be open. When this changes (a different collection or
  // note is selected) the group follows it; in between, the toggle button decides.
  open: boolean;
  // The group's link, shown next to the toggle button.
  header: ReactNode;
  // Control shown beside the header, absolutely positioned (the ⋯ menu). pr-9 on the
  // row keeps the header clear of it. See components/collection-menu.tsx.
  action?: ReactNode;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(open);
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    setIsOpen(open);
  }

  return (
    <div className="relative">
      <div className={`flex items-center gap-1 ${action ? "pr-9" : ""}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={`${isOpen ? "Collapse" : "Expand"} ${label}`}
          className="flex h-9 w-4 shrink-0 items-center justify-center text-primary/70"
        >
          <span
            aria-hidden
            className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
          >
            ›
          </span>
        </button>
        {header}
      </div>
      {isOpen && <div className="ml-4">{children}</div>}
      {action}
    </div>
  );
}
