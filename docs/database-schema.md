# Database schema — Notes App

Source of truth for the Supabase tables. Tables are created and changed in the
Supabase dashboard only. Do not create, alter or drop tables from code.

Last checked against the dashboard: 2026-10-13

## Relationships in plain English
- A note can belong to one collection. A collection can contain many notes.
- A note can exist outside any collection (`collection_id` is empty). These notes
  appear under "Uncollected".
- A note can have many tags. A tag can be on many notes. The `note_tags` table
  stores one row per note–tag pair.
- Deleting a collection keeps its notes; they become uncollected.
- Deleting a note or a tag removes its rows in `note_tags` automatically.

## Tables

### collections
| Column | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| id | uuid | gen_random_uuid() | yes | primary key |
| created_at | timestamptz | now() | yes | |
| name | text | — | yes | unique, case-insensitive (unique index on lower(name); exact-match constraint collections_name_key also exists) |

### notes
| Column | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| id | int8 | identity (auto-number) | yes | primary key |
| created_at | timestamptz | now() | yes | |
| title | text | — | yes | |
| content | text | — | no | |
| updated_at | timestamptz | now() | no | the app must set this to the current time on every update |
| collection_id | uuid | — | no | foreign key → collections.id, on delete SET NULL |

### tags
| Column | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| id | int8 | identity (auto-number) | yes | primary key |
| created_at | timestamptz | now() | yes | |
| name | text | — | yes | unique, case-insensitive (unique index on lower(name)) |

### note_tags (join table)
| Column | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| note_id | int8 | — | yes | foreign key → notes.id, on delete CASCADE |
| tag_id | int8 | — | yes | foreign key → tags.id, on delete CASCADE |
| created_at | timestamptz | now() | yes | |

Primary key: (note_id, tag_id). There is no separate id column.

## ID types (important)
- `collections.id` is a **uuid** → a `string` in TypeScript.
- `notes.id` and `tags.id` are **int8** → a `number` in TypeScript.
- `notes.collection_id` is a uuid (string). `note_tags.note_id` and `tag_id` are numbers.

## Rules for the app
- Trim tag names and save them in lowercase. The database rejects duplicates
  regardless of capitals.
- Set `updated_at` to the current time whenever a note is updated.
- Tag filter: when several tags are selected, show only notes that have ALL of
  the selected tags, not notes that have any one of them.

## Access
- RLS is enabled on all four tables.
- Each table has one policy, "App full access": ALL commands for `anon` and
  `authenticated`. There is no login yet; tighten these when auth is added.
- All four tables are exposed in the Data API settings.