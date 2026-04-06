/** Belediye harita ekranı — örnek veri ve yardımcılar (admin harita görünümü) */

export const STORAGE_KEY = 'sarfea_belediye_items';

export type MapItem = {
  id: string;
  title: string;
  type: string;
  belediyeId: string;
  belediyeName: string;
  coords: [number, number];
  status: string;
  perf: number;
  kurulumTarihi: string;
  /** Yerel önizleme / base64 */
  image?: string | null;
  /** Supabase Storage: rapor PDF (içinde fotoğraf) */
  pdfUrl?: string | null;
  /** İşletici / operatör firma (`report_logs.operator`) */
  operator?: string | null;
  source?: 'supabase' | 'local';
};

export type MunicipalityDef = {
  id: string;
  name: string;
  province: string;
  /** İlçe; boşsa harita/PDF tarafında yalnızca il kullanılır */
  district?: string;
  query: string;
  coords: [number, number];
  /** Supabase Storage public URL (admin) */
  logo_url?: string | null;
  sort_order?: number;
};

export const ITEM_TYPES = [
  'Menhol',
  'Kabin',
  'Baz İstasyonu',
  'Elektrik Direği',
  'Elektrik Panosu',
  'Doğalgaz',
] as const;

/** Liste artık veritabanından (`municipalities` tablosu); boş dizi geriye dönük import için */
export const MUNICIPALITIES: MunicipalityDef[] = [];

/** Eşleşmeyen raporlar; harita / sınır OSM’de yok */
export const OTHER_MUNICIPALITY: MunicipalityDef = {
  id: 'diger',
  name: 'Diğer / Eşleşmeyen',
  province: 'Diğer',
  district: '',
  query: 'Türkiye',
  coords: [39.0, 35.0],
};

/** @deprecated useMunicipalities().getMunicipalityById — statik liste kalktı */
export function getMunicipalityById(id: string, list: MunicipalityDef[] = MUNICIPALITIES): MunicipalityDef | undefined {
  if (id === OTHER_MUNICIPALITY.id) return OTHER_MUNICIPALITY;
  return list.find((m) => m.id === id);
}

const DEFAULT_SAMPLES: MapItem[] = [
  {
    id: 'ITM-SAMP-1',
    title: 'Yozgat Bulvarı Saha Kontrolü',
    type: 'Elektrik Panosu',
    belediyeId: 'kecioren',
    belediyeName: 'Keçiören Belediyesi',
    coords: [40.00235, 32.82399],
    status: 'Aktif',
    perf: 100,
    kurulumTarihi: '2026-03-07',
    image: undefined,
  },
  {
    id: 'ITM-SAMP-2',
    title: 'Keçiören Merkez Denetim',
    type: 'Menhol',
    belediyeId: 'kecioren',
    belediyeName: 'Keçiören Belediyesi',
    coords: [40.003, 32.825],
    status: 'Aktif',
    perf: 95,
    kurulumTarihi: '2026-03-07',
    image: undefined,
  },
  {
    id: 'ITM-SAMP-3',
    title: 'Bulvar Bölgesi Enerji Hattı',
    type: 'Kabin',
    belediyeId: 'kecioren',
    belediyeName: 'Keçiören Belediyesi',
    coords: [40.0019, 32.822],
    status: 'Aktif',
    perf: 98,
    kurulumTarihi: '2026-03-07',
    image: undefined,
  },
];

export function getIconClassForType(type: string): string {
  switch (type) {
    case 'Menhol':
      return 'fa-dot-circle';
    case 'Kabin':
      return 'fa-server';
    case 'Baz İstasyonu':
      return 'fa-broadcast-tower';
    case 'Elektrik Direği':
      return 'fa-lightbulb';
    case 'Elektrik Panosu':
      return 'fa-bolt';
    case 'Doğalgaz':
      return 'fa-fire';
    case 'Trafo':
      return 'fa-plug';
    default:
      return 'fa-map-marker-alt';
  }
}

export function loadMapItems(): MapItem[] {
  if (typeof window === 'undefined') return [...DEFAULT_SAMPLES];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_SAMPLES];
    const data = JSON.parse(raw) as MapItem[];
    return Array.isArray(data) && data.length > 0 ? data : [...DEFAULT_SAMPLES];
  } catch {
    return [...DEFAULT_SAMPLES];
  }
}

export function saveMapItems(items: MapItem[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Storage:', e);
  }
}
