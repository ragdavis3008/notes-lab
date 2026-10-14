"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MAX_SEARCH_LENGTH } from "@/lib/filter-url";

const DEBOUNCE_MS = 300;

// Search box for "/". The text lives in ?q= so it survives a reload. Only `q`
// is changed; collection and tag params stay as they are.
export function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQ = searchParams.get("q") ?? "";

  const [value, setValue] = useState(urlQ);
  // The last q this box put in the URL (or saw there).
  const lastQ = useRef(urlQ);

  // The URL changed from outside (back button, a link): show its text.
  useEffect(() => {
    if (urlQ !== lastQ.current) {
      lastQ.current = urlQ;
      setValue(urlQ);
    }
  }, [urlQ]);

  function go(text: string) {
    const q = text.trim();
    if (q === lastQ.current) return;
    lastQ.current = q;
    // Read the live URL, not the render's copy, so a collection or tag link
    // clicked during the debounce wait is not undone.
    const params = new URLSearchParams(window.location.search);
    if (q) params.set("q", q);
    else params.delete("q");
    const query = params.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
  }

  // Wait until typing stops before updating the URL (and so the query).
  useEffect(() => {
    const timer = setTimeout(() => go(value), DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function clear() {
    setValue("");
    go("");
  }

  return (
    <div className="relative mb-6">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") clear();
        }}
        maxLength={MAX_SEARCH_LENGTH}
        placeholder="Search notes by title or content"
        aria-label="Search notes"
        className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 pr-20 text-sm"
      />
      {value !== "" && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs underline"
        >
          Clear
        </button>
      )}
    </div>
  );
}
