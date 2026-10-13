# CLAUDE.md — Notes App

## Project
A notes app with collections, tags and search.
Stack: Next.js (App Router), TypeScript, Tailwind CSS, Supabase via the `supabase-js` client.
Built on the official Supabase + Next.js starter. Runs locally with `npm run dev`.
No authentication and no deployment in this project.

## Hard rules
- Use the `supabase-js` client only. Do NOT use the Supabase MCP server.
- Do NOT create, alter or drop tables from code or migrations. I create tables in the
  Supabase dashboard. The schema is in `docs/database-schema.md`. If a change needs a
  schema change, stop and ask me.
- The old `notes` table from the lessons has been replaced. Existing code that used it
  may be rewritten or removed.
- No authentication. The notes pages must work without logging in. Do not build on the
  starter's auth pages. If the session check in `lib/supabase/proxy.ts` redirects
  logged-out visitors away from notes pages, tell me before changing it.
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

## Table conventions
- Table and column names are snake_case.
- Every table has `id` (uuid, default `gen_random_uuid()`) and `created_at`
  (timestamptz, default `now()`).
- Foreign keys are named `<singular_table>_id`, e.g. `collection_id`, `note_id`, `tag_id`.
- `note_tags` is a join table: one row links one note to one tag.

## Workflow
- One feature per branch, named `feature/<short-name>`. Never commit to `main` directly.
- Commit messages describe the change (never "update" or "stuff").
- Before using a Supabase feature, check `docs/` for a cited reference and follow it.
  If none exists, ask me instead of guessing.
- Show clear empty-state messages instead of blank screens.
- Keep the code simple and explain major decisions.