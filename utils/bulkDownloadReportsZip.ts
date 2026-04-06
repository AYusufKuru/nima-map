import JSZip from 'jszip';

export type ZipReportItem = {
  /** Supabase/PostgREST bazen uuid’yi string dışında döndürebilir */
  id: string | number;
  pdf_url: string;
  type: string | null;
  operator: string | null;
};

function idPrefix(id: unknown): string {
  return String(id ?? '').slice(0, 8);
}

function entryBaseName(it: ZipReportItem): string {
  const op = (it.operator || 'rapor').replace(/[\\/:*?"<>|]/g, '_').slice(0, 60);
  const ty = (it.type || 'tur').replace(/[\\/:*?"<>|]/g, '_').slice(0, 24);
  return `${ty}_${op}_${idPrefix(it.id)}`;
}

/**
 * Tarayıcıda: seçilen rapor PDF’lerini tek ZIP dosyasında indirir.
 * Supabase public `pdf_url` adreslerinin CORS ile okunabilmesi gerekir.
 */
export async function downloadReportsZip(items: ZipReportItem[], zipBaseName: string): Promise<void> {
  if (typeof document === 'undefined') {
    throw new Error('Toplu ZIP indirme yalnızca tarayıcıda desteklenir.');
  }
  if (items.length === 0) return;

  const zip = new JSZip();
  const used = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const res = await fetch(it.pdf_url);
    if (!res.ok) {
      throw new Error(`PDF alınamadı (${idPrefix(it.id)}). Ağı veya bağlantıyı kontrol edin.`);
    }
    const blob = await res.blob();
    let base = entryBaseName(it);
    let name = `${base}.pdf`;
    let n = 0;
    while (used.has(name)) {
      n += 1;
      name = `${base}_${n}.pdf`;
    }
    used.add(name);
    zip.file(name, blob);
  }

  const out = await zip.generateAsync({ type: 'blob' });
  const safeZip = zipBaseName.replace(/[\\/:*?"<>|]/g, '_').slice(0, 120);
  const a = document.createElement('a');
  const url = URL.createObjectURL(out);
  a.href = url;
  a.download = `${safeZip}.zip`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
