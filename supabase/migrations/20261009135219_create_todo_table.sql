create table public.todo (
  id bigint generated always as identity primary key,
  title text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- public is exposed via the Data API, so RLS must be on.
-- No policies yet: anon/authenticated get no access until you add some.
alter table public.todo enable row level security;
