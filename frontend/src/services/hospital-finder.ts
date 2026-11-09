/**
 * Worldwide hospital search using free OpenStreetMap services:
 * - Nominatim turns a place name (city, state, country) into an area
 * - Overpass lists every hospital mapped inside that area
 * Both are free and need no API key. Please keep requests modest.
 */

export interface Place {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  bbox: [number, number, number, number]; // south, north, west, east
  osmType: string;
  osmId: number;
  type: string;
}

export interface FoundHospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  phone: string | null;
  website: string | null;
  email: string | null;
  emergency: boolean | null;
  beds: number | null;
  operator: string | null;
  openingHours: string | null;
  healthcareSpeciality: string | null;
  distanceKm?: number;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
// Public Overpass servers are run by volunteers and are sometimes busy, so
// several are tried (see runOverpass).
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
/** Start the next server if the current ones haven't answered by then */
const HEDGE_AFTER_MS = 8000;
const REQUEST_TIMEOUT_MS = 100000;
const cache = new Map<string, any[]>();
const MAX_RESULTS = 3000;

export async function searchPlaces(query: string): Promise<Place[]> {
  const params = new URLSearchParams({ q: query, format: 'jsonv2', limit: '6', addressdetails: '0' });
  const res = await fetch(`${NOMINATIM}?${params}`, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('Place search is busy. Please try again in a moment.');
  const data: any[] = await res.json();
  return data.map((p) => ({
    name: p.name || p.display_name.split(',')[0],
    displayName: p.display_name,
    lat: parseFloat(p.lat),
    lng: parseFloat(p.lon),
    bbox: p.boundingbox.map(Number) as [number, number, number, number],
    osmType: p.osm_type,
    osmId: p.osm_id,
    type: p.addresstype || p.type,
  }));
}

function buildAddress(t: Record<string, string>): string {
  if (t['addr:full']) return t['addr:full'];
  const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
  return [street, t['addr:suburb'], t['addr:city'] || t['addr:district'], t['addr:state'], t['addr:postcode']]
    .filter(Boolean)
    .join(', ');
}

function toHospital(el: any): FoundHospital | null {
  const t: Record<string, string> = el.tags || {};
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat == null || lng == null) return null;
  const beds = parseInt(t.beds || t['capacity:beds'] || '', 10);
  return {
    id: `${el.type}/${el.id}`,
    name: t.name || t['name:en'] || t.official_name || 'Unnamed hospital',
    lat,
    lng,
    address: buildAddress(t),
    phone: t.phone || t['contact:phone'] || t['phone:mobile'] || t['contact:mobile'] || null,
    website: t.website || t['contact:website'] || null,
    email: t.email || t['contact:email'] || null,
    emergency: t.emergency === 'yes' ? true : t.emergency === 'no' ? false : null,
    beds: Number.isFinite(beds) ? beds : null,
    operator: t.operator || null,
    openingHours: t.opening_hours || null,
    healthcareSpeciality: t['healthcare:speciality'] || null,
  };
}

/**
 * Ask the first server; if it fails, or is still silent after a few seconds,
 * also ask the next one. The first good answer wins and the rest are cancelled.
 */
async function runOverpass(query: string, signal?: AbortSignal): Promise<any[]> {
  const cached = cache.get(query);
  if (cached) return cached;

  const controllers: AbortController[] = [];
  const cancelAll = () => controllers.forEach((c) => c.abort());
  signal?.addEventListener('abort', cancelAll, { once: true });

  try {
    return await new Promise<any[]>((resolve, reject) => {
      let next = 0;
      let pending = 0;
      let settled = false;
      let hedgeTimer: ReturnType<typeof setTimeout> | undefined;

      const fail = () => {
        if (!settled && pending === 0 && next >= OVERPASS_ENDPOINTS.length) {
          settled = true;
          reject(new Error('Hospital data service is busy'));
        }
      };

      const launch = () => {
        if (settled || next >= OVERPASS_ENDPOINTS.length) return;
        const endpoint = OVERPASS_ENDPOINTS[next++];
        const controller = new AbortController();
        controllers.push(controller);
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        pending++;
        clearTimeout(hedgeTimer);
        hedgeTimer = setTimeout(launch, HEDGE_AFTER_MS);

        fetch(endpoint, { method: 'POST', body: new URLSearchParams({ data: query }), signal: controller.signal })
          .then(async (res) => {
            if (!res.ok) throw new Error(`Overpass ${res.status}`);
            const json = await res.json();
            if (settled) return;
            settled = true;
            clearTimeout(hedgeTimer);
            const elements = json.elements || [];
            cache.set(query, elements);
            resolve(elements);
          })
          .catch(() => {
            if (signal?.aborted && !settled) {
              settled = true;
              clearTimeout(hedgeTimer);
              reject(new DOMException('Aborted', 'AbortError'));
              return;
            }
            // This server failed: try the next one straight away
            launch();
          })
          .finally(() => {
            clearTimeout(timeout);
            pending--;
            fail();
          });
      };

      launch();
    });
  } finally {
    cancelAll();
    signal?.removeEventListener('abort', cancelAll);
  }
}

const HOSPITAL_FILTER = (scope: string) => `
  nwr["amenity"="hospital"]${scope};
  nwr["healthcare"="hospital"]${scope};`;

/** Every hospital inside a searched place (uses its boundary when it has one). */
export async function hospitalsInPlace(place: Place, signal?: AbortSignal): Promise<FoundHospital[]> {
  let query: string;
  if (place.osmType === 'relation') {
    const areaId = 3600000000 + place.osmId;
    query = `[out:json][timeout:90];area(${areaId})->.a;(${HOSPITAL_FILTER('(area.a)')});out center tags ${MAX_RESULTS};`;
  } else {
    const [s, n, w, e] = place.bbox;
    query = `[out:json][timeout:90];(${HOSPITAL_FILTER(`(${s},${w},${n},${e})`)});out center tags ${MAX_RESULTS};`;
  }
  return dedupe((await runOverpass(query, signal)).map(toHospital));
}

/** Hospitals within a radius of a point, sorted nearest first. */
export async function hospitalsNear(lat: number, lng: number, radiusKm = 15, signal?: AbortSignal): Promise<FoundHospital[]> {
  const query = `[out:json][timeout:60];(${HOSPITAL_FILTER(`(around:${Math.round(radiusKm * 1000)},${lat},${lng})`)});out center tags ${MAX_RESULTS};`;
  const list = dedupe((await runOverpass(query, signal)).map(toHospital));
  return withDistance(list, lat, lng).sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}

function dedupe(list: (FoundHospital | null)[]): FoundHospital[] {
  const seen = new Set<string>();
  return list.filter((h): h is FoundHospital => {
    if (!h || seen.has(h.id)) return false;
    seen.add(h.id);
    return true;
  });
}

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function withDistance(list: FoundHospital[], lat: number, lng: number): FoundHospital[] {
  return list.map((h) => ({ ...h, distanceKm: Math.round(distanceKm(lat, lng, h.lat, h.lng) * 10) / 10 }));
}

export const directionsUrl = (h: FoundHospital) =>
  `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}`;

export const googleMapsUrl = (h: FoundHospital) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${h.name} ${h.lat},${h.lng}`)}`;
