-- "permission denied" means the API roles lack table-level access; RLS policies
-- alone are not enough. Grant read-only access; RLS stays enabled and still
-- decides which rows are visible.
grant select on table public.notes to anon, authenticated;

alter table public.notes enable row level security;

-- Policies already exist from earlier migrations, but recreate them
-- idempotently so this migration is sufficient on its own.
drop policy if exists "Anyone can read notes" on public.notes;
create policy "Anyone can read notes"
  on public.notes for select
  to anon, authenticated
  using (true);
