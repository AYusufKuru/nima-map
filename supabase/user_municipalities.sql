-- Kullanıcı–belediye ataması (saha kullanıcıları yalnızca atanan belediyelere rapor yükler)
-- Önkoşul: public.municipalities ve public.current_user_is_admin() (schema-admin.sql)

-- Saha uygulaması rapor satırında ilce alanı (yoksa ekle)
alter table public.report_logs add column if not exists ilce text;

create table if not exists public.user_municipalities (
  user_id uuid not null references public.profiles (id) on delete cascade,
  municipality_id uuid not null references public.municipalities (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, municipality_id)
);

create index if not exists idx_user_municipalities_user on public.user_municipalities (user_id);
create index if not exists idx_user_municipalities_muni on public.user_municipalities (municipality_id);

alter table public.user_municipalities enable row level security;

drop policy if exists "user_municipalities_select" on public.user_municipalities;
create policy "user_municipalities_select"
  on public.user_municipalities for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.current_user_is_admin()
  );

drop policy if exists "user_municipalities_insert_admin" on public.user_municipalities;
create policy "user_municipalities_insert_admin"
  on public.user_municipalities for insert to authenticated
  with check (public.current_user_is_admin());

drop policy if exists "user_municipalities_delete_admin" on public.user_municipalities;
create policy "user_municipalities_delete_admin"
  on public.user_municipalities for delete to authenticated
  using (public.current_user_is_admin());

-- Saha: yalnızca kendine atanmış belediye ile rapor; yönetici: her belediye
drop policy if exists "report_logs_insert_own" on public.report_logs;
create policy "report_logs_insert_own"
  on public.report_logs for insert to authenticated
  with check (
    user_id is not null
    and user_id = (select auth.uid())
    and (
      public.current_user_is_admin()
      or (
        municipality_id is not null
        and exists (
          select 1 from public.user_municipalities um
          where um.user_id = (select auth.uid())
            and um.municipality_id = municipality_id
        )
      )
    )
  );

notify pgrst, 'reload schema';
