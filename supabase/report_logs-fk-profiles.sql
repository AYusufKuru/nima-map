-- İsteğe bağlı: PostgREST'in report_logs ile profiles arasında embed kurması için FK.
-- Uygulama artık embed kullanmıyor; yine de şema bütünlüğü için çalıştırabilirsiniz.

alter table public.report_logs add column if not exists user_id uuid;

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
