-- report_logs: user_id + created_at (uygulama ve RLS için zorunlu)
-- Supabase → SQL Editor → çalıştır. Sonra uygulamayı yeniden dene.

alter table public.report_logs add column if not exists user_id uuid;
alter table public.report_logs add column if not exists created_at timestamptz default now();

update public.report_logs
set created_at = coalesce(created_at, now())
where created_at is null;

-- Geçersiz user_id temizliği (profiles yoksa)
update public.report_logs r
set user_id = null
where r.user_id is not null
  and not exists (select 1 from public.profiles p where p.id = r.user_id);

-- FK (profiles tablosu varsa)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'profiles'
  ) and not exists (
    select 1 from pg_constraint where conname = 'report_logs_user_id_profiles_fkey'
  ) then
    alter table public.report_logs
      add constraint report_logs_user_id_profiles_fkey
      foreign key (user_id) references public.profiles (id)
      on delete set null;
  end if;
end $$;

-- PostgREST şema önbelleğini yenile (user_id görülsün)
notify pgrst, 'reload schema';
