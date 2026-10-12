-- Let signed-in users read all notes (notes has no owner column yet).
create policy "Authenticated users can read notes"
  on public.notes for select
  to authenticated
  using (true);
