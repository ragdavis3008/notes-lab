# Reflection — Notes App with Collections and Search

## What I built

## Database design

## Third-party code review

**Command:** `/code-review`, run on branch `feature/notes-crud` (PR 1) before merging.

**Finding I acted on:** the form lost everything the user had typed when saving
failed validation (e.g. an empty title). React 19 resets uncontrolled inputs after
a form action, so the user had to type the note again. I asked Claude to keep the
entered values when an error is shown.

**Other findings:** silent "success" when editing a note that no longer exists,
unhandled errors in the create/update/delete actions, and `/notes` matching paths
like `/notesfoo` in the proxy. These were fixed too. One finding was a false
alarm: it flagged the removed "Table conventions" section in CLAUDE.md, but that
was a deliberate removal of an outdated duplicate.

**Second run:** `/code-review` on `feature/collections` (PR 2) gave 10 findings. I fixed
four real bugs: the sidebar showed stale note titles after edits, uppercase collection ids
showed "not found", the new collection form brought back an old error when reopened, and
choosing a deleted collection showed a raw database error. I kept one behaviour it flagged
(moving a note updates `updated_at`), because my CLAUDE.md rule says every note update
sets it; I only fixed the misleading comment. I rejected removing the "redundant"
`router.refresh()`, because that refresh is what fixed new collections not appearing
without a reload. Fetching less data in the sidebar and moving the link out of the
expandable group were left as known trade-offs.

**Third run:** `/code-review` on `feature/tags` (PR 3) gave 8 findings. I fixed two
real bugs: the sidebar treated tag ids from the URL that no longer exist as selected,
and "Saved" could appear even when adding or removing a tag had failed. I also fixed
my own docs: the join-table example was missing its code fence, and I added a note
explaining that lib/db.ts joins notes and tags in code instead of using that pattern.
I left the rest as trade-offs: the 1000-row limit on `.in()` queries, extra database
round trips, and filtering in memory are fine at this app's size, and the exact-name
tag lookup is safe because the app always saves tag names in lowercase.

**Fourth run:** `/code-review` on `feature/search` (PR 4). Its most important finding
was that the search escaping had no cited reference, which breaks my CLAUDE.md rule.
The code was correct (my browser tests with `,`, `(`, `"`, `%` and `_` all worked),
but I added the PostgREST "Reserved characters" documentation to `docs/` so the
quoting and backslash escaping are cited. I also fixed two real search box bugs: a
slow, older update could overwrite what the user was typing, and the box and the
server trimmed the search text differently. I corrected a comment that wrongly said
`*` is always matched literally. I left the repeated query code, the in-memory tag
filter, and links that drop text typed in the last 300 ms as they are.

**Fifth run (PR 5, pinned notes):** 6 findings. Before fixing anything, I tested the
most serious one myself: the reviewer suspected that pinning on the note page would
wipe unsaved edits. In the browser the typed title survived, so it was a false alarm.
I fixed three: the pin error could cover the card text, only part of the card was
clickable, and the pin action didn't validate its input. I left the repeated ordering
code as it was and added a comment where the tag filter relies on the list order.

**Fifth run (PR 5, pinned notes):** the fresh session found a real contradiction in my
own rules. CLAUDE.md and the schema doc said "set updated_at whenever a note is updated",
but I had decided pinning should not change it, and only wrote that down as a new rule
without updating the old one. The code was right; the rules disagreed. I reworded both
files so pinning is an explicit exception. This is the clearest example in the project
of a new session catching drift in CLAUDE.md that the building session could not see.

**Sixth run (PR 6, colour-coded tags):** no bugs, seven polish points. I fixed two in
the colour picker: it closed before the save finished, and it had no Escape or
click-outside handling. I rejected its main concern, that the Tailwind config change
might not apply, because I had already proven it in the browser: the colours stayed
gray until the config change and a restart.

## New-session diff review
After `/clear`, I asked a fresh Claude Code session to compare `git diff main...HEAD`
with the rules in CLAUDE.md and docs/database-schema.md, without editing anything.

**Finding I acted on:** `lib/db.ts` used Supabase methods that had no cited reference
in `docs/`: `.order()`, `.maybeSingle()` and `.select()` after update/delete. CLAUDE.md
says to check `docs/` for a cited reference before using a Supabase feature. The code
was correct, but the session that wrote it never added the references. I added cited
examples for all three to `docs/supabase-crud-reference.md`.

**False alarm:** it reported that the proxy was changed without warning me. The fresh
session couldn't see the earlier conversation: the first session did ask in its plan,
and I approved the change. A new session is good at checking the code against the
rules, but it only knows what is in the repo, not what was agreed in chat.

**Second run (PR 2, collections):** the fresh session found no rule violations. It
confirmed that all database access stays in `lib/db.ts`, that the uuid and int8 id
types match the schema, and that only cited Supabase methods were used (the `eq` and
`is` references I added before building paid off). I acted on one small finding: the
"Last checked against the dashboard" date in `docs/database-schema.md` was not updated
after I added the case-insensitive unique rule to `collections.name`. I left two
minor notes as they are: checking Postgres error codes (not a Supabase method), and
chaining two `.order()` calls (the same cited method used twice).

**Third run (PR 3, tags):** the fresh session found no rule violations. It confirmed the
join table is only accessed through `lib/db.ts`, that ids are typed as numbers (int8),
that tag names are trimmed and lowercased, and that the filter keeps only notes with
ALL selected tags. Its three minor observations were all decisions I had already made
and recorded after the code review (Postgres error codes, the exact-name tag lookup,
and the unused join-table doc example), so the two reviews agreed.

**Fourth run (PR 4, search):** the fresh session found no rule violations. This time the
search escaping was covered, because I had added the PostgREST "Reserved characters"
reference to `docs/` after the code review. That review flagged the missing citation;
the new-session review confirmed the fix closed the gap.

## Optional task(s)
**Pinned notes (Medium, PR 5).** I added a `pinned` boolean column in the dashboard
(default false, required) and documented it in `docs/database-schema.md` before any
code. I decided up front that pinning does not change `updated_at`, so pinning or
unpinning never reshuffles the rest of the list. Every list (All notes, collections,
Uncollected, tag filters and search) sorts pinned notes first, then by `updated_at`.
I chose this task because my RFP Tender Tracker needs the same thing: urgent tenders
pinned to the top regardless of recent edits.

**Colour-coded tags (Easy, PR 6).** I added a `color` column to `tags` with a CHECK
constraint limiting it to eight palette names, and documented it first. The agent
flagged before building that Tailwind didn't scan `lib/`, so the palette classes would
never be generated; adding `lib/` to `tailwind.config.ts` fixed that, but the colours
only appeared after restarting the dev server. The CHECK constraint also proved its
worth when I typed "red " with a trailing space in the Table Editor and the database
refused it. For my tender tracker, this is how I'd colour-code phases or priorities.

## Known limitations
- Unknown top-level paths like `/banana` redirect to login because of the
  starter's proxy. Left as is until authentication is added.
- RLS policies allow full access for anon and authenticated users (no login yet).
- In the sidebar, each collection's name is a link inside its expandable group, so one click both opens the group and navigates. Not ideal for accessibility.
- Tag queries use `.in()` and Supabase's default 1000-row limit, so very large note
  sets could lose tag labels or filter matches.
- Opening a note and coming back resets the tag filter, because note pages have
  their own address without filters.

  - A typed `*` in the search matches any one character, because PostgREST treats `*` as
  a wildcard in like/ilike and it cannot be escaped.

## What I would keep or change next time