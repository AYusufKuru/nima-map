-- Mevcut projede "infinite recursion detected in policy for relation profiles" hatası için
-- Supabase SQL Editor'da bir kez çalıştırın.

-- Politika içinde tekrar profiles sorgulamak RLS'i yeniden tetikler; admin kontrolü
-- SECURITY DEFINER fonksiyonda yapılır (postgres sahibi RLS'i atlar).

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
