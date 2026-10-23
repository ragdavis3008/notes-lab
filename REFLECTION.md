# Reflection — Notes App with Collections and Search

## What I built
A notes app built with Next.js (App Router), TypeScript, Tailwind CSS and Supabase,
running locally with no login. Notes can be created, edited and deleted, grouped into
collections in the sidebar, tagged with reusable tags, filtered by ALL selected tags,
and searched by title and content. The collection, tag and search filters combine,
and all of them live in the URL, so a filtered view survives a reload. I built it in
the notes-lab project from the database lessons, as one branch and pull request per
feature: notes, collections, tags and search, followed by three optional tasks
(pinned notes, colour-coded tags and server-side full-text search).

## Database design
Four tables, created in the Supabase dashboard rather than from code:
- `collections` (uuid id, name). A collection can contain many notes.
- `notes` (int8 id, title, content, updated_at, collection_id, pinned, search_vector).
  A note belongs to at most one collection; `collection_id` is empty for uncollected
  notes, and deleting a collection sets it to empty instead of deleting the notes.
- `tags` (int8 id, name, color). Names are unique regardless of capitals.
- `note_tags`, a join table with one row per note–tag pair. Its primary key is the pair,
  so the same tag can't be added to a note twice, and deleting a note or tag removes
  its rows automatically.

Testing the tables with real rows before building caught several setup mistakes: a
wrong default on `collection_id` that would have made every new note fail, a missing
default on `note_tags.created_at`, and a unique rule on tag names that hadn't saved.
RLS is on for every table, with one "App full access" policy each because there is no
login yet; the tables also had to be exposed in the Data API settings. All database
access goes through one helper module, `lib/db.ts`.
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

**Sixth run (PR 6, colour-coded tags):** no rule violations. It confirmed that the
palette in `docs/database-schema.md` matches `lib/tag-colors.ts` exactly, that the
column was documented before the code used it, and that new tags still get the gray
default. It also named what a diff can't show (how files were edited, and whether
the CHECK constraint really exists in the dashboard), which I had verified myself.

**Seventh run (PR 7, full-text search):** 9 findings. Most were the trade-offs I had
already accepted and tested (no matching inside words, stop words, English only). I
fixed three: accented letters typed as two characters were split into fragments, the
search logic was copied into three functions (now one shared helper), and the
hand-kept column list needed a warning comment. I also updated my docs to cover the
English config and stop words, which the reviewer said the cited reference didn't.

**Seventh run (PR 7, full-text search):** no rule violations. It confirmed that
search_vector is never sent in inserts or updates and is left out of every note read,
and that the new textSearch usage is covered by the cited docs. It also pointed out
that an unused starter tutorial component still calls Supabase directly, outside
lib/db.ts. It isn't part of my app's pages, but it shows that a new session reads
beyond the diff and can spot leftovers from the starter.

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

**Server-side full-text search (Hard, PR 7).** I added a generated `search_vector`
column (English config, title weighted above content) and a GIN index in SQL, cited
`.textSearch()` and the `word:*` prefix syntax, and replaced the ilike search. The
user-facing behaviour stayed the same, but the matching changed: whole words and word
beginnings instead of any text fragment, word forms like "edit" finding "edited", and
filler words ignored. Safety got simpler: only letters and digits reach the query, so
there is nothing to escape. I chose `.textSearch()` on the indexed column over the
guide's RPC function, because it fits the existing filter chain and uses the index.
For my tender tracker, this is how I'd search long tender descriptions quickly.

## Known limitations
- Unknown top-level paths like `/banana` redirect to login because of the
  starter's proxy. Left as is until authentication is added.
- RLS policies allow full access for anon and authenticated users (no login yet).
- In the sidebar, each collection's name is a link inside its expandable group, so one click both opens the group and navigates. Not ideal for accessibility.
- Tag queries use `.in()` and Supabase's default 1000-row limit, so very large note
  sets could lose tag labels or filter matches.
- Opening a note and coming back resets the tag filter, because note pages have
  their own address without filters.
- Search matches whole words and word beginnings only, uses English stemming and stop
  words, and does not search tags. A search made only of filler words returns nothing.

## What I would keep or change next time
**Keep:**
- Adding cited references to `docs/` before each feature. After I started doing that,
  the new-session reviews came back clean, and the agent followed official patterns
  instead of guessing.
- Reviewing every plan before approving. Corrections cost one message at plan stage:
  wrong branch assumptions, a second dev server, and a missing not-found page.
- Testing the database with real rows before building, and testing every feature in
  the browser myself instead of trusting type checks.
- Judging review findings instead of fixing everything: several were false alarms or
  trade-offs I had already accepted, and one "redundant" line was actually a fix.
- Turning repeated corrections into CLAUDE.md rules, such as editing files only with
  the edit tools after agents tried to edit with scripts several times.

**Change:**
- Write the schema doc while creating the tables, not after. The unique rule on
  collection names was missing from the doc, so a plan assumed duplicates were fine.
- Check the whole CLAUDE.md when adding a rule. I left an old uuid rule next to the
  new one, and later wrote a pinning exception that contradicted the updated_at rule.
- Check which branch I'm on before committing; I once committed the schema doc to main.
- Turn on GitHub branch protection for main on a team project.
- Fix the lint setup early so `npm run lint` ignores the generated `.next` folder.
- Run `npm run build` earlier, not only at the end. The final build showed that my
  try/catch blocks were catching Next.js's internal prerender signal and logging it as
  an error; `unstable_rethrow` fixed it, but I would have spotted it sooner.
- Review a branch before merging it, not after. I merged feature/tests first and have
  not reviewed it since, so any problems in it are now on main.

## Rename a collection (TDD)

**Rename a collection (test-first, branch feature/rename-collection).** I built this
with the tdd skill, one small test at a time: write a failing test (red), write just
enough code to pass it (green), then tidy up (refactor). Working in tiny steps kept each
change easy to review, and the tests ended up describing the feature in plain terms:
blank names, duplicate names, a collection deleted elsewhere, and an invalid id.

**The bug cycle 5 caught.** The test faked a database error (code 08006, "connection
lost") and expected the message "Could not rename the collection. Please try again.",
the typed name kept, and no page refresh. It went red because, after the earlier cycles,
any unexpected error fell through the catch and the action returned "saved". So a failed
save was reported to the user as a success, and the form would have closed as if the
rename worked. Claude spotted the gap and wrote the test to prove it. I would not have
found this by clicking through the app, because the failure is rare. The test now guards
the fix.

**Characterization tests before refactoring.** The rename action needed the same name
checking as `createCollectionAction`, so I moved that into `lib/collection-name.ts`.
Before touching the existing action, I wrote tests that pinned down what it already did
(blank name, duplicate name, success). They passed on the old code, so after the refactor
I could trust that they still passed because the behaviour was unchanged and not because
I had changed the tests.

**What the two reviews found.**
1. The first review was /code-review in the same session. It found one real issue:
   pressing Cancel or Escape while a save was pending closed the form and hid any server
   error. I fixed it (Cancel is disabled and Escape is ignored while saving) and rechecked
   it in the browser. Two findings did not hold up. "Typed text lost after a rejected
   submit" was wrong, because my browser check 5 showed WORK stayed in the field. "The
   `router.refresh()` is redundant" was kept on purpose, to match `NewCollectionForm`. I
   left the unchanged-name write and the shared create/rename flow as they are.
2. The second review was a fresh session (/clear) on `git diff main...HEAD`. It found no
   rule breaks against CLAUDE.md or the schema doc. I fixed the weak tests: the blank-name
   test now checks nothing was written, the success test checks that `"  Work  "` reaches
   the database as `"Work"`, the `console.error` spy is restored after each test, and an
   out-of-date comment on `CollectionNotFoundError` is corrected. For renaming with only a
   capital change, I tested it in the browser: Work2 to work2 saved without a duplicate
   error. I skipped on purpose: a maximum name length, focus returning to the Rename
   button, the input still being editable while saving, layout fragility, and component
   tests. These are edge cases or polish, and the create form has some of the same gaps.

**Test steps that assumed things the app doesn't have.** Claude's browser test plan for
slice 4 included a delete-collection button and a dark mode toggle, and the app has
neither. I did not skip those steps. For "deleted elsewhere" I deleted a test collection
in the Supabase Table Editor instead of using a second tab. For dark mode I used Chrome
DevTools to emulate `prefers-color-scheme: dark`. All 8 checks passed. The lesson stays:
check a test plan against the real app before running it.

**Merged before reviewing.** I merged feature/tests into main before reviewing it. That was
the wrong order: the review should happen first, so problems get fixed on the branch. I
reviewed it afterwards in a fresh session. It found no bugs, but it did find config drift:
an unexplained @types/node bump, outdated notes in the docs and a missing test:run script.
Running npm run lint during that check showed 20142 problems. Almost all came from the
unignored .next/ build folder, plus one require() in tailwind.config.ts. That already
existed before PR #9, and I had never noticed because I wasn't running lint. I fixed all
of it on chore/test-config (lint is now at 0 problems) and ran a /code-review before
merging. The lesson: run npm run lint and npm run build as part of my checks before every
merge, not just the tests.

## Playwright tests (Sprint 3.4)

**Which kinds of bugs did the tests catch that I or the agent missed in earlier sessions?**

The tests caught timing problems that never show up when I click through the app myself: Next.js briefly keeps the previous page hidden on screen, so the edit test filled in the wrong form, and the cleanup ran before the notes list had loaded, which left test notes behind in the shared data. Using Playwright MCP as a live tester also confirmed that the new collection and tags form worked end to end, including the sidebar counts, and on the todo demo site it found real bugs (the "0 items left" counter and "Mark all as complete") that a quick look would have missed.