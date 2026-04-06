import type { MapItem, MunicipalityDef } from '@/constants/belediyeMapData';
import { OTHER_MUNICIPALITY } from '@/constants/belediyeMapData';

/** Admin harita için Supabase `report_logs` satırı */
export type ReportRowForMap = {
  id: string;
  latitude: number | null;
  longitude: number | null;
  type: string | null;
  municipality_name: string | null;
  municipality_id?: string | null;
  address: string | null;
  timestamp_text: string | null;
  pdf_url: string | null;
  created_at?: string | null;
  ilce?: string | null;
  operator?: string | null;
  fiber?: string | null;
  neighborhood?: string | null;
  sokak?: string | null;
};

function normalizeTr(s: string): string {
  return s.trim().toLocaleLowerCase('tr-TR');
}

/** km cinsinden iki nokta arası (yaklaşık) */
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}

export function normalizeCoordsForTurkey(lat: number, lng: number): [number, number] {
  const latOk = lat >= 35.5 && lat <= 42.5 && lng >= 25.5 && lng <= 45.5;
  if (latOk) return [lat, lng];
  const swappedOk = lng >= 35.5 && lng <= 42.5 && lat >= 25.5 && lat <= 45.5;
  if (swappedOk) return [lng, lat];
  return [lat, lng];
}

function firstByProvince(list: MunicipalityDef[], province: string): MunicipalityDef | undefined {
  const n = normalizeTr(province);
  return list.find((m) => normalizeTr(m.province) === n);
}

/** İl adı → o ilden bir belediye (listeden) */
const IL_TO_REPRESENTATIVE: { test: (n: string) => boolean; province: string }[] = [
  { test: (n) => /\bistanbul\b/u.test(n), province: 'İstanbul' },
  { test: (n) => /\bankara\b/u.test(n), province: 'Ankara' },
  { test: (n) => /\bizmir\b/u.test(n), province: 'İzmir' },
  { test: (n) => /\bbursa\b/u.test(n), province: 'Bursa' },
  { test: (n) => /\bantalya\b/u.test(n), province: 'Antalya' },
  { test: (n) => /\bkonya\b/u.test(n), province: 'Konya' },
  { test: (n) => /\badana\b/u.test(n), province: 'Adana' },
];

/** İlçe / semt ipuçları → isimde arama */
const DISTRICT_NAME_HINTS: { re: RegExp; hint: string }[] = [
  { re: /(çankaya|çankaya\s)/u, hint: 'Çankaya' },
  { re: /(keçiören|kecioren)/u, hint: 'Keçiören' },
  { re: /(kadıköy|kadikoy)/u, hint: 'Kadıköy' },
  { re: /(beşiktaş|besiktas)/u, hint: 'Beşiktaş' },
  { re: /(şişli|sisli)/u, hint: 'Şişli' },
  { re: /(üsküdar|uskudar)/u, hint: 'Üsküdar' },
  { re: /(pendik)/u, hint: 'Pendik' },
  { re: /(nilüfer|nilufer)/u, hint: 'Nilüfer' },
  { re: /(konak)/u, hint: 'Konak' },
  { re: /(muratpaşa|muratpasa)/u, hint: 'Muratpaşa' },
  { re: /(meram)/u, hint: 'Meram' },
  { re: /(seyhan)/u, hint: 'Seyhan' },
];

function matchFromHaystack(
  haystackNorm: string,
  haystackRaw: string,
  list: MunicipalityDef[]
): MunicipalityDef | null {
  if (!haystackNorm.trim() || list.length === 0) return null;

  for (const m of list) {
    const full = normalizeTr(m.name);
    const short = normalizeTr(m.name.replace(/\s*belediyesi\s*/i, '').trim());
    if (
      haystackNorm.includes(full) ||
      (full.length >= 6 && full.includes(haystackNorm)) ||
      (short.length >= 3 && (haystackNorm.includes(short) || (haystackNorm.length >= 3 && short.includes(haystackNorm))))
    ) {
      return m;
    }
  }

  const nh = normalizeTr;
  for (const { re, hint } of DISTRICT_NAME_HINTS) {
    if (re.test(haystackRaw) || re.test(haystackNorm)) {
      const mun = list.find(
        (m) => nh(m.name).includes(nh(hint)) || nh(m.name).replace(/\s*belediyesi\s*/i, '').includes(nh(hint))
      );
      if (mun) return mun;
    }
  }

  for (const { test, province } of IL_TO_REPRESENTATIVE) {
    if (test(haystackNorm)) {
      const mun = firstByProvince(list, province);
      if (mun) return mun;
    }
  }

  return null;
}

/**
 * Veritabanındaki belediye listesiyle eşleştirme (id öncelikli).
 */
export function matchReportToMunicipality(
  municipalityName: string | null,
  ilce: string | null,
  address: string | null | undefined,
  lat: number | undefined,
  lng: number | undefined,
  extraText: string | null | undefined,
  list: MunicipalityDef[],
  municipalityId?: string | null
): MunicipalityDef {
  if (municipalityId && list.length) {
    const direct = list.find((m) => m.id === municipalityId);
    if (direct) return direct;
  }

  const userParts = [municipalityName, ilce].filter(Boolean) as string[];
  const userRaw = userParts.join(' ');
  const userNorm = normalizeTr(userRaw);

  const allParts = [municipalityName, ilce, address, extraText].filter(Boolean) as string[];
  const fullRaw = allParts.join(' ');
  const fullNorm = normalizeTr(fullRaw);

  if (!fullNorm.trim() && (lat == null || lng == null)) {
    return OTHER_MUNICIPALITY;
  }

  const fromUser = matchFromHaystack(userNorm, userRaw, list);
  if (fromUser) return fromUser;

  const fromFull = matchFromHaystack(fullNorm, fullRaw, list);
  const TEXT_COORD_MAX_KM = 220;
  if (fromFull) {
    if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
      const d = haversineKm(lat, lng, fromFull.coords[0], fromFull.coords[1]);
      if (d <= TEXT_COORD_MAX_KM) return fromFull;
    } else {
      return fromFull;
    }
  }

  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng) && list.length > 0) {
    let best: MunicipalityDef | null = null;
    let bestKm = Infinity;
    for (const m of list) {
      const km = haversineKm(lat, lng, m.coords[0], m.coords[1]);
      if (km < bestKm) {
        bestKm = km;
        best = m;
      }
    }
    const NEAREST_MAX_KM = 95;
    if (best && bestKm <= NEAREST_MAX_KM) return best;
  }

  return OTHER_MUNICIPALITY;
}

export function reportRowToMapItem(row: ReportRowForMap, municipalities: MunicipalityDef[]): MapItem | null {
  if (row.latitude == null || row.longitude == null) return null;
  let lat = Number(row.latitude);
  let lng = Number(row.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  [lat, lng] = normalizeCoordsForTurkey(lat, lng);

  const bel = matchReportToMunicipality(
    row.municipality_name,
    row.ilce ?? null,
    row.address ?? null,
    lat,
    lng,
    row.timestamp_text ?? null,
    municipalities,
    row.municipality_id
  );

  const title =
    row.address?.trim() ||
    row.timestamp_text?.trim() ||
    `Kayıt ${String(row.id).slice(0, 8)}`;

  return {
    id: row.id,
    title,
    type: row.type?.trim() || 'Diğer',
    belediyeId: bel.id,
    belediyeName: row.municipality_name?.trim() || bel.name,
    coords: [lat, lng],
    status: 'Aktif',
    perf: 100,
    kurulumTarihi: (row.created_at || '').split('T')[0] || '',
    image: null,
    pdfUrl: row.pdf_url,
    operator: row.operator?.trim() || null,
    source: 'supabase',
  };
}
