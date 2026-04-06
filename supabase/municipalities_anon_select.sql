-- Mevcut projeler: mobilde belediye listesi boşsa (RLS yalnızca authenticated ise anon okuma ekleyin)
drop policy if exists "municipalities_select_anon" on public.municipalities;
create policy "municipalities_select_anon"
  on public.municipalities for select to anon
  using (true);

notify pgrst, 'reload schema';
