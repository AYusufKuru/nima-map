/**
 * Nominatim arama sonuçlarından belediye/ilçe sınırı için uygun GeoJSON seçer.
 * Önce en geniş bbox (ilçe alanı); bina ayak izi genelde çok küçük kutu.
 */
export type NominatimSearchHit = {
  geojson?: unknown;
  class?: string;
  type?: string;
  importance?: number;
  /** [south, north, west, east] */
  boundingbox?: string[];
};

/** Yaklaşık derece cinsinden kutu alanı (derece²). */
export function nominatimHitBBoxAreaDeg2(hit: NominatimSearchHit): number {
  const bb = hit.boundingbox;
  if (!bb || bb.length < 4) return 0;
  const south = parseFloat(bb[0]);
  const north = parseFloat(bb[1]);
  const west = parseFloat(bb[2]);
  const east = parseFloat(bb[3]);
  if (![south, north, west, east].every(Number.isFinite)) return 0;
  return Math.abs(north - south) * Math.abs(east - west);
}

/**
 * Bu alanın altındaysa bina / parsel ihtimali yüksek; ikinci Nominatim sorgusu denenir.
 * ~0.01° kenar ~1 km → 0.0001 derece² ~1 km²; ilçeler çoğunlukla bundan büyük.
 */
export const MIN_TYPICAL_DISTRICT_BBOX_DEG2 = 0.00012;

/** İlçe sınırı çizgisi için Polygon / MultiPolygon; Point Nominatim’de pin üretir. */
export function geojsonHasPolygonOutline(g: unknown): boolean {
  if (g == null || typeof g !== 'object') return false;
  const o = g as { type?: string; geometries?: unknown[]; geometry?: unknown; features?: unknown[] };
  const t = o.type;
  if (t === 'Polygon' || t === 'MultiPolygon') return true;
  if (t === 'GeometryCollection' && Array.isArray(o.geometries)) {
    return o.geometries.some((x) => geojsonHasPolygonOutline(x));
  }
  if (t === 'Feature' && o.geometry != null) {
    return geojsonHasPolygonOutline(o.geometry);
  }
  if (t === 'FeatureCollection' && Array.isArray(o.features)) {
    return o.features.some((f) => geojsonHasPolygonOutline(f));
  }
  return false;
}

function isBuildingLike(hit: NominatimSearchHit): boolean {
  const c = hit.class ?? '';
  const t = hit.type ?? '';
  if (c === 'building') return true;
  if (t === 'house' || t === 'building' || t === 'yes') return true;
  if (c === 'amenity' && (t === 'townhall' || t === 'public_building')) return true;
  if (c === 'office' && t === 'government') return true;
  if (c === 'historic' && t === 'building') return true;
  return false;
}

/** En uygun tek sonuç (tam nesne; alan kontrolü için). */
export function pickMunicipalityBoundaryHit(hits: NominatimSearchHit[]): NominatimSearchHit | null {
  const withGeo = hits.filter((h) => h.geojson != null);
  if (withGeo.length === 0) return null;

  const nonBuilding = withGeo.filter((h) => !isBuildingLike(h));
  let pool = nonBuilding.length > 0 ? nonBuilding : withGeo;

  const withPolygon = pool.filter((h) => geojsonHasPolygonOutline(h.geojson));
  if (withPolygon.length > 0) {
    pool = withPolygon;
  }

  const scored = pool.map((h) => ({
    h,
    area: nominatimHitBBoxAreaDeg2(h),
    admin: h.class === 'boundary' && (h.type === 'administrative' || h.type === 'political'),
  }));

  scored.sort((a, b) => {
    if (b.area !== a.area) return b.area - a.area;
    if (a.admin !== b.admin) return a.admin ? -1 : 1;
    return (b.h.importance ?? 0) - (a.h.importance ?? 0);
  });

  return scored[0]?.h ?? null;
}

export function pickMunicipalityBoundaryGeojson(hits: NominatimSearchHit[]): unknown | null {
  return pickMunicipalityBoundaryHit(hits)?.geojson ?? null;
}
