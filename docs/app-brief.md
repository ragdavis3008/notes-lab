# App brief: Notes App

Last updated: 2026-10-15

## What it is
A personal notes app. You write notes, group them into collections, label them with
coloured tags, pin the important ones, and search everything by title and content.

Built for Turing College, Sprint 2 (mid-sprint project: "Notes App with Collections and
Search"), in the `notes-lab` project from the database lessons. It runs locally only
(`npm run dev`, http://localhost:3000). There is no deployment.

## Current status
- Done: notes, collections, tags, search, pinned notes, colour-coded tags, full-text
  search, rename a collection (built test-first), automated tests, email and password
  authentication (Sprint 2.6, branch `feature/add-auth`), due dates with filter chips
  (built test-first, branch `due-dates`).

## Tech stack
- Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui components
- Supabase database through the `supabase-js` client, with `@supabase/ssr` for cookies
- Vitest and Testing Library for tests
- Built on the official Supabase + Next.js starter

## Features
- Create, edit and delete notes (title and content)
- Collections: group notes in the sidebar; a note belongs to at most one collection.
  Notes without one appear under "Uncollected". Deleting a collection keeps its notes.
- Rename or delete a collection from its ⋯ menu in the sidebar (deleting asks first
  and keeps the notes)
- Tags: reusable, saved in lowercase, each with one of eight colours
- Tag filter: shows only notes that have ALL the selected tags
- Search by title and content (full-text: whole words and word beginnings)
- Collection, tag and search filters combine and live in the URL, so a filtered view
  survives a reload
- Optional due date on a note (date only, set with the browser's date picker). Cards
  show "Due 28 Oct", in red when overdue.
- Due date chips above the search bar: "Overdue", "Due in 7 days" and "All", each with
  a count. They narrow the current collection, tag and search view and live in the
  URL (`?due=overdue` or `?due=week`).
- Pinned notes always appear at the top of every list
- Clear empty-state messages instead of blank screens

## Pages
| Address | What it shows |
| --- | --- |
| `/` | Redirects to `/notes` |
| `/notes` | All notes, with sidebar, filters and search (sign-in required) |
| `/notes/new` | Create a note |
| `/notes/[id]` | View and edit one note |
| `/auth/login`, `/auth/sign-up` and other `/auth/...` pages | Sign-in and sign-up pages from the starter; signed-out visitors to `/notes` are redirected to `/auth/login` |
| `/protected` | Starter example page (not part of the app) |

## Data
Four tables, created in the Supabase dashboard (never from code):
`collections`, `notes`, `tags` and the join table `note_tags`.
The full schema, ID types and rules are in `docs/database-schema.md`.

All database reads and writes go through `lib/db.ts`. Shared types are in `lib/types.ts`.

## Users and access
- People sign up and sign in with email and password through Supabase Auth, using the
  `/auth/...` pages. Login is at `/auth/login` (not `/login`), and signing out sends
  people there too.
- Every page under `/notes` requires a signed-in user, checked on the server with the
  Supabase Auth server. Supabase Auth stores the passwords; the app never does.
- Row Level Security is on, but every table has an "App full access" policy for
  everyone.

## Out of scope
- Deployment
- Sharing notes between users
- New npm packages without asking first

## Known limitations
- Search does not search tags, and is English only.
- Tag queries could miss results above Supabase's 1000-row default limit.
- Opening a note and going back resets the tag filter.
- Notes are not linked to a user yet (no `user_id` column), so every signed-in user
  sees the same notes. Showing each user only their own notes needs a schema change in
  the dashboard and new RLS policies.

## Related files
- `CLAUDE.md`: rules for Claude Code
- `docs/database-schema.md`: tables, columns and data rules
- `docs/`: cited Supabase, Tailwind, ESLint and testing references
- `REFLECTION.md`: what I built, the reviews, and what I learned
