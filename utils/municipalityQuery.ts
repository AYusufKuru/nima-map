import type { MunicipalityDef } from '@/constants/belediyeMapData';

/**
 * Harita ilçe sınırı (Nominatim polygon) için sorgu — “Belediye binası” yerine ilçe alanı dönsün diye
 * isimden "Belediyesi" atılır ve "ilçesi" ile netleştirilir.
 */
export function buildBoundaryNominatimQuery(bel: MunicipalityDef): string {
  const raw = bel.query?.trim();
  if (raw && /\bilçe\b|district|sınır|boundary/i.test(raw)) return raw;
  const n = bel.name.replace(/\s*belediyesi\s*$/i, '').trim();
  const p = bel.province.trim();
  const d = bel.district?.trim();
  if (d && d.length > 0 && d.toLowerCase() !== p.toLowerCase()) {
    return `${n}, ${d}, ${p}, Türkiye`;
  }
  return `${n} ilçesi, ${p}, Türkiye`;
}

/** İlk sonuç çok küçük poligon dönerse ikinci deneme (daha geniş eşleşme). */
export function buildBoundaryNominatimQueryAlt(bel: MunicipalityDef): string {
  const n = bel.name.replace(/\s*belediyesi\s*$/i, '').trim();
  const p = bel.province.trim();
  return `${n}, ${p}, Türkiye`;
}

/** Belediye arama metni: ilçe varsa ad + ilçe + il; yoksa ad + il (Türkiye). */
export function buildMunicipalitySearchQuery(name: string, province: string, district?: string | null): string {
  const n = name.trim();
  const p = province.trim();
  const d = (district ?? '').trim();
  if (!n && !p) return 'Türkiye';
  if (!p) return n ? `${n}, Türkiye` : 'Türkiye';
  if (!n) return `${p}, Türkiye`;
  if (d) return `${n}, ${d}, ${p}, Türkiye`;
  return `${n}, ${p}, Türkiye`;
}

/** OSM Nominatim — harita merkezi için (admin kayıtta bir kez). */
export async function geocodeMunicipalityQuery(query: string): Promise<{ lat: number; lng: number } | null> {
  const q = query.trim();
  if (!q) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=tr&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'tr',
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    const first = data?.[0];
    if (!first?.lat || !first?.lon) return null;
    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}
