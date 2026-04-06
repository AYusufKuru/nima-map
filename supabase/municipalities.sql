-- Belediye listesi (admin yönetir, saha uygulaması seçer)
-- Supabase SQL Editor'da bir kez çalıştırın.

create table if not exists public.municipalities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  province text not null default '',
  district text not null default '',
  query text not null default '',
  lat double precision not null default 39,
  lng double precision not null default 35,
  logo_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- PostgREST, yeni kolonlardan sonra bazen eski şemayı kullanır; gerekirse tekrar çalıştırın:
-- notify pgrst, 'reload schema';

create unique index if not exists municipalities_name_unique on public.municipalities (lower(name));

alter table public.municipalities enable row level security;

drop policy if exists "municipalities_select_auth" on public.municipalities;
create policy "municipalities_select_auth"
  on public.municipalities for select to authenticated
  using (true);

-- Saha uygulaması: oturum henüz yüklenmeden yapılan istekler anon rolüyle gider; liste boş kalmasın.
drop policy if exists "municipalities_select_anon" on public.municipalities;
create policy "municipalities_select_anon"
  on public.municipalities for select to anon
  using (true);

drop policy if exists "municipalities_insert_admin" on public.municipalities;
create policy "municipalities_insert_admin"
  on public.municipalities for insert to authenticated
  with check (exists (
    select 1 from public.profiles pr where pr.id = (select auth.uid()) and pr.role = 'admin'
  ));

drop policy if exists "municipalities_update_admin" on public.municipalities;
create policy "municipalities_update_admin"
  on public.municipalities for update to authenticated
  using (exists (
    select 1 from public.profiles pr where pr.id = (select auth.uid()) and pr.role = 'admin'
  ));

drop policy if exists "municipalities_delete_admin" on public.municipalities;
create policy "municipalities_delete_admin"
  on public.municipalities for delete to authenticated
  using (exists (
    select 1 from public.profiles pr where pr.id = (select auth.uid()) and pr.role = 'admin'
  ));

alter table public.report_logs
  add column if not exists municipality_id uuid references public.municipalities (id) on delete set null;

create index if not exists idx_report_logs_municipality_id on public.report_logs (municipality_id);

-- Logo bucket (public okuma)
insert into storage.buckets (id, name, public)
  values ('municipality-logos', 'municipality-logos', true)
  on conflict (id) do nothing;

drop policy if exists "municipality_logos_insert_admin" on storage.objects;
create policy "municipality_logos_insert_admin"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'municipality-logos'
    and exists (select 1 from public.profiles pr where pr.id = (select auth.uid()) and pr.role = 'admin')
  );

drop policy if exists "municipality_logos_update_admin" on storage.objects;
create policy "municipality_logos_update_admin"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'municipality-logos'
    and exists (select 1 from public.profiles pr where pr.id = (select auth.uid()) and pr.role = 'admin')
  );

drop policy if exists "municipality_logos_delete_admin" on storage.objects;
create policy "municipality_logos_delete_admin"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'municipality-logos'
    and exists (select 1 from public.profiles pr where pr.id = (select auth.uid()) and pr.role = 'admin')
  );

drop policy if exists "municipality_logos_select_public" on storage.objects;
create policy "municipality_logos_select_public"
  on storage.objects for select
  using (bucket_id = 'municipality-logos');
