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

## Optional task(s)

## Known limitations
- Unknown top-level paths like `/banana` redirect to login because of the
  starter's proxy. Left as is until authentication is added.
- RLS policies allow full access for anon and authenticated users (no login yet).

## What I would keep or change next time