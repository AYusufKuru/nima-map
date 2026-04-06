-- Supabase SQL Editor'da sırayla çalıştırın. Mevcut projeye göre hata veren satırları yorum satırı yapıp düzenleyin.
-- İlk admin: Kayıt olduktan sonra:
--   update public.profiles set role = 'admin' where email = 'sizin@email.com';

-- ---------------------------------------------------------------------------
-- 1) Profiller (saha / yönetici rolleri)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'field' check (role in ('field', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role text default 'field';
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

alter table public.profiles enable row level security;

create or replace function public.current_user_is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or public.current_user_is_admin()
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- 2) Yeni kullanıcıda profil satırı
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'field'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mevcut auth kullanıcıları için profil yoksa oluştur (FK öncesi)
insert into public.profiles (id, email, full_name, role)
select u.id, u.email, split_part(coalesce(u.email, 'user'), '@', 1), 'field'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3) Raporlar: kim girdi + filtre için created_at
-- ---------------------------------------------------------------------------
alter table public.report_logs add column if not exists user_id uuid;
alter table public.report_logs add column if not exists created_at timestamptz default now();

update public.report_logs
set created_at = coalesce(created_at, now())
where created_at is null;

-- profiles tablosunda karşılığı olmayan user_id'leri FK eklemeden önce temizle
update public.report_logs r
set user_id = null
where r.user_id is not null
  and not exists (select 1 from public.profiles p where p.id = r.user_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'report_logs_user_id_profiles_fkey'
  ) then
    alter table public.report_logs
      add constraint report_logs_user_id_profiles_fkey
      foreign key (user_id) references public.profiles (id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_report_logs_created_at on public.report_logs (created_at desc);
create index if not exists idx_report_logs_user_id on public.report_logs (user_id);
create index if not exists idx_report_logs_type on public.report_logs (type);

alter table public.report_logs enable row level security;

drop policy if exists "report_logs_insert_own" on public.report_logs;
create policy "report_logs_insert_own" on public.report_logs
  for insert to authenticated
  with check (user_id is not null and user_id = (select auth.uid()));

drop policy if exists "report_logs_select_own_or_admin" on public.report_logs;
create policy "report_logs_select_own_or_admin" on public.report_logs
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.profiles pr
      where pr.id = (select auth.uid()) and pr.role = 'admin'
    )
  );

drop policy if exists "report_logs_update_admin" on public.report_logs;
create policy "report_logs_update_admin" on public.report_logs
  for update to authenticated
  using (exists (
    select 1 from public.profiles pr
    where pr.id = (select auth.uid()) and pr.role = 'admin'
  ));

drop policy if exists "report_logs_delete_admin" on public.report_logs;
create policy "report_logs_delete_admin" on public.report_logs
  for delete to authenticated
  using (exists (
    select 1 from public.profiles pr
    where pr.id = (select auth.uid()) and pr.role = 'admin'
  ));

-- ---------------------------------------------------------------------------
-- 4) Storage (reports bucket) — yükleme için giriş şartı (bucket adınız reports ise)
-- ---------------------------------------------------------------------------
-- insert into storage.buckets (id, name, public) values ('reports', 'reports', true)
--   on conflict (id) do nothing;

drop policy if exists "reports_insert_authenticated" on storage.objects;
create policy "reports_insert_authenticated"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'reports');

drop policy if exists "reports_select_public_or_auth" on storage.objects;
-- Public URL kullanıyorsanız herkes okuyabilir; değilse aşağıyı admin/sahaya göre sıkılaştırın.
create policy "reports_select_public_or_auth"
  on storage.objects for select
  using (bucket_id = 'reports');

drop policy if exists "reports_delete_admin" on storage.objects;
create policy "reports_delete_admin"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'reports'
    and exists (
      select 1 from public.profiles pr
      where pr.id = (select auth.uid()) and pr.role = 'admin'
    )
  );
