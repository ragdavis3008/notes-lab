"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MAX_SEARCH_LENGTH, normalizeSearch } from "@/lib/filter-url";

const DEBOUNCE_MS = 300;

// Search box for "/". The text lives in ?q= so it survives a reload. Only `q`
// is changed; collection and tag params stay as they are.
export function SearchBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Same trimming and length cap as the server, so both search the same text.
  const urlQ = normalizeSearch(searchParams.get("q") ?? "");

  const [value, setValue] = useState(urlQ);
  // The last q this box put in the URL (or saw there).
  const lastQ = useRef(urlQ);
  // Values this box has put in the URL that have not shown up in it yet, oldest
  // first. A slow update can land after the user typed more; it is our own
  // echo, not an outside change, so it must not overwrite the input.
  const pending = useRef<string[]>([]);

  // The URL changed: show its text only if the change came from outside (back
  // button, a link), never for an update this box started itself.
  useEffect(() => {
    const own = pending.current.indexOf(urlQ);
    if (own !== -1) {
      pending.current.splice(0, own + 1);
      return;
    }
    if (urlQ !== lastQ.current) {
      lastQ.current = urlQ;
      pending.current = [];
      setValue(urlQ);
    }
  }, [urlQ]);

  function go(text: string) {
    const q = normalizeSearch(text);
    if (q === lastQ.current) return;
    lastQ.current = q;
    pending.current.push(q);
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
