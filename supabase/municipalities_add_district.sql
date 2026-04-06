-- Mevcut projeler: Supabase SQL Editor'da bir kez (district sütunu yoksa)
alter table public.municipalities add column if not exists district text not null default '';

-- PostgREST şema önbelleğini yeniler; "Could not find the 'district' column ... schema cache" hatasını giderir.
notify pgrst, 'reload schema';
