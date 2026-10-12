-- /notes is viewable without signing in, so signed-out visitors (anon) need read access too.
create policy "Anyone can read notes"
  on public.notes for select
  to anon
  using (true);
