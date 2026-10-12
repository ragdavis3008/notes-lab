create table public.notes (
  id bigint generated always as identity primary key,
  title text not null,
  body text,
  created_at timestamptz not null default now()
);

-- public is exposed via the Data API, so RLS must be on.
-- No policies yet: anon/authenticated get no access until you add some.
alter table public.notes enable row level security;
