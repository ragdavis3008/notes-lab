# CLAUDE.md — Notes App

## Project
A notes app with collections, tags and search.
Stack: Next.js (App Router), TypeScript, Tailwind CSS, Supabase via the `supabase-js` client.
Built on the official Supabase + Next.js starter. Runs locally with `npm run dev`.
- App overview: @docs/app-brief.md
No deployment in this project. Authentication is being added with Supabase Auth.


## Hard rules
- Use the `supabase-js` client only. Do NOT use the Supabase MCP server.
- Do NOT create, alter or drop tables from code or migrations. I create tables in the
  Supabase dashboard. The schema is in `docs/database-schema.md`. If a change needs a
  schema change, stop and ask me.
- The old `notes` table from the lessons has been replaced. Existing code that used it
  may be rewritten or removed.
- No new npm packages without asking me first.

## Supabase connection
- Credentials come from `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Never hardcode keys. Never commit `.env.local`.
- Use the existing clients. Do not create new ones:
  - `lib/supabase/client.ts` for client components
  - `lib/supabase/server.ts` for server components and server actions

## Data access
- ALL database reads and writes go through one helper module: `lib/db.ts`.
- Pages and components never call Supabase directly; they call functions from `lib/db.ts`.
- Shared TypeScript types for the tables live in `lib/types.ts`.

## Where things go
- `app/`: pages and routes (App Router only)
- `components/`: shared UI components
- `lib/`: Supabase clients, `db.ts`, types and helpers

## Workflow
- One feature per branch, named `feature/<short-name>`. Never commit to `main` directly.
- Commit messages describe the change (never "update" or "stuff").
- Before using a Supabase feature, check `docs/` for a cited reference and follow it.
  If none exists, ask me instead of guessing.
- Show clear empty-state messages instead of blank screens.
- Keep the code simple and explain major decisions.
- Edit files only with the file edit tools, never with Python, sed, heredocs or other scripts, so every change can be reviewed as a diff.

## Table conventions
- The full schema, ID types and app rules are in @docs/database-schema.md.
  Read it before any database work.
- Table and column names are snake_case.
- Every table has `created_at` (timestamptz, default `now()`).
- ID types differ per table: `collections.id` is a uuid (string in TypeScript);
  `notes.id` and `tags.id` are int8 (number in TypeScript). Use the matching type.
- Foreign keys are named `<singular_table>_id`, e.g. `collection_id`, `note_id`, `tag_id`.
- `note_tags` is a join table with no `id` column. Its primary key is
  (`note_id`, `tag_id`).
- Tag names are trimmed and saved in lowercase.
- Set `notes.updated_at` to the current time whenever a note's title, content or
  collection changes. Pinning or unpinning a note does not change `updated_at`.

## Authentication rules
- Use Supabase Auth for all sign-in and session handling. Never build custom auth or store passwords anywhere.
- Every page under /notes requires a signed-in user. Verify this on the server with the Supabase Auth server, never only the browser session. If the user is not signed in, redirect to /auth/login.
- After sign-out, redirect to /auth/login.

## Testing
- Playwright end-to-end tests live in `e2e/` and run with `npm run test:e2e`. Unit tests run with `npm run test:run`. Run both before and after every change.
- Use the CLI for one-off tasks. Use MCP when the agent needs to repeat or react to what's on screen.
- Temporary scripts go in the scratchpad, never in `e2e/`.
- Never print or write E2E credentials into files or tool output.