-- İlçe alanı: admin filtreleme ve rapor listesi için (saha: ayarlardan kaydedilir)
alter table public.report_logs add column if not exists ilce text;

notify pgrst, 'reload schema';
