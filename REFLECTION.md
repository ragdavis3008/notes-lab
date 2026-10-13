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

## Optional task(s)

## Known limitations
- Unknown top-level paths like `/banana` redirect to login because of the
  starter's proxy. Left as is until authentication is added.
- RLS policies allow full access for anon and authenticated users (no login yet).

## What I would keep or change next time