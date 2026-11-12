import { Router, Request, Response } from 'express';
import { createHash } from 'crypto';
import { LessThan } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { PlaceCache } from '../entities/PlaceCache.entity';

/**
 * Hospital search with a shared cache (public OpenStreetMap data).
 *
 *   GET /api/hospital-search/place?osmType=relation&osmId=1950198&s=&n=&w=&e=
 *   GET /api/hospital-search/near?lat=18.52&lng=73.85&radiusKm=15
 *
 * The server builds the Overpass query itself (callers cannot send their own),
 * asks several free Overpass servers, and keeps the answer in `place_cache`:
 * 7 days for a place, 1 day for a "near me" search.
 */
const router = Router();

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const HEDGE_AFTER_MS = 8000;
const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RESULTS = 3000;
const PLACE_TTL_MS = 7 * 864e5;
const NEAR_TTL_MS = 864e5;
const KEEP_TAGS = new Set([
  'name', 'name:en', 'official_name', 'addr:full', 'addr:housenumber', 'addr:street', 'addr:suburb', 'addr:city',
  'addr:district', 'addr:state', 'addr:postcode', 'phone', 'contact:phone', 'phone:mobile', 'contact:mobile',
  'website', 'contact:website', 'email', 'contact:email', 'emergency', 'beds', 'capacity:beds', 'operator',
  'opening_hours', 'healthcare:speciality',
]);

const HOSPITAL_FILTER = (scope: string) => `nwr["amenity"="hospital"]${scope};nwr["healthcare"="hospital"]${scope};`;

/** Keep only what the site shows: about a third of the raw size */
function trim(el: any) {
  const tags: Record<string, string> = {};
  for (const [k, v] of Object.entries(el.tags || {})) if (KEEP_TAGS.has(k)) tags[k] = String(v).slice(0, 300);
  return { type: el.type, id: el.id, lat: el.lat, lon: el.lon, center: el.center, tags };
}

/** Ask the first server; if it fails or is slow, also ask the next. First good answer wins. */
function runOverpass(query: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const controllers: AbortController[] = [];
    let next = 0;
    let pending = 0;
    let settled = false;
    let hedge: NodeJS.Timeout | undefined;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(hedge);
      controllers.forEach((c) => c.abort());
      fn();
    };
    const launch = () => {
      if (settled || next >= OVERPASS_ENDPOINTS.length) return;
      const endpoint = OVERPASS_ENDPOINTS[next++];
      const controller = new AbortController();
      controllers.push(controller);
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      pending++;
      clearTimeout(hedge);
      hedge = setTimeout(launch, HEDGE_AFTER_MS);
      fetch(endpoint, {
        method: 'POST',
        body: new URLSearchParams({ data: query }),
        headers: { 'User-Agent': 'HealthCarePlus/1.0 (hospital finder)' },
        signal: controller.signal,
      })
        .then(async (r) => {
          if (!r.ok) throw new Error(`Overpass ${r.status}`);
          const json: any = await r.json();
          finish(() => resolve(json.elements || []));
        })
        .catch(() => launch())
        .finally(() => {
          clearTimeout(timer);
          pending--;
          if (!settled && pending === 0 && next >= OVERPASS_ENDPOINTS.length) finish(() => reject(new Error('busy')));
        });
    };
    launch();
  });
}

const inFlight = new Map<string, Promise<any[]>>();
let lastPrune = 0;

async function cached(label: string, query: string, ttlMs: number) {
  const key = createHash('sha256').update(label).digest('hex');
  const repo = AppDataSource.getRepository(PlaceCache);
  const hit = await repo.findOne({ where: { key } });
  if (hit && Date.now() - new Date(hit.createdAt).getTime() < ttlMs) {
    return { elements: hit.elements, cachedAt: hit.createdAt, cached: true };
  }
  // Several people searching the same city at once share one request
  let job = inFlight.get(key);
  if (!job) {
    job = runOverpass(query).then((els) => els.map(trim));
    inFlight.set(key, job);
    job.finally(() => inFlight.delete(key)).catch(() => {});
  }
  try {
    const elements = await job;
    // An empty answer may be a wrong area or a hiccup: don't keep it for days
    if (elements.length) {
      await repo.upsert({ key, label: label.slice(0, 120), elements, createdAt: new Date() } as any, ['key']);
    }
    if (Date.now() - lastPrune > 864e5) {
      lastPrune = Date.now();
      repo.delete({ createdAt: LessThan(new Date(Date.now() - 30 * 864e5)) }).catch(() => {});
    }
    return { elements, cachedAt: new Date(), cached: false };
  } catch (e) {
    // Servers busy: an older copy is better than nothing
    if (hit) return { elements: hit.elements, cachedAt: hit.createdAt, cached: true, stale: true };
    throw e;
  }
}

const num = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

router.get('/place', async (req: Request, res: Response) => {
  const osmType = String(req.query.osmType || '');
  const osmId = num(req.query.osmId, 1, 1e12);
  const [s, n, w, e] = ['s', 'n', 'w', 'e'].map((k) => num(req.query[k], -180, 180));
  let label: string;
  let query: string;
  if (osmType === 'relation' && osmId) {
    label = `place:relation:${osmId}`;
    query = `[out:json][timeout:90];area(${3600000000 + osmId})->.a;(${HOSPITAL_FILTER('(area.a)')});out center tags ${MAX_RESULTS};`;
  } else if (s != null && n != null && w != null && e != null && n > s && e > w && n - s <= 10 && e - w <= 10) {
    const box = [s, w, n, e].map((x) => x.toFixed(4)).join(',');
    label = `place:bbox:${box}`;
    query = `[out:json][timeout:90];(${HOSPITAL_FILTER(`(${box})`)});out center tags ${MAX_RESULTS};`;
  } else {
    return res.status(400).json({ success: false, error: 'Give a place (relation id) or a bounding box up to 10° wide' });
  }
  try {
    res.json({ success: true, ...(await cached(label, query, PLACE_TTL_MS)) });
  } catch (err: any) {
    if (err?.message !== 'busy') console.error('Hospital search failed:', err?.message);
    res.status(503).json({ success: false, error: 'Hospital map servers are busy. Please try again in a minute.' });
  }
});

router.get('/near', async (req: Request, res: Response) => {
  const lat = num(req.query.lat, -90, 90);
  const lng = num(req.query.lng, -180, 180);
  const radiusKm = num(req.query.radiusKm ?? 15, 1, 50);
  if (lat == null || lng == null || radiusKm == null) {
    return res.status(400).json({ success: false, error: 'lat, lng and radiusKm (1-50) are required' });
  }
  // Round to about 1 km so neighbours share the cache; the radius covers the difference
  const rl = lat.toFixed(2);
  const rg = lng.toFixed(2);
  const r = Math.round(radiusKm * 1000) + 1000;
  const label = `near:${rl},${rg}:${r}`;
  const query = `[out:json][timeout:60];(${HOSPITAL_FILTER(`(around:${r},${rl},${rg})`)});out center tags ${MAX_RESULTS};`;
  try {
    res.json({ success: true, ...(await cached(label, query, NEAR_TTL_MS)) });
  } catch (err: any) {
    if (err?.message !== 'busy') console.error('Hospital search failed:', err?.message);
    res.status(503).json({ success: false, error: 'Hospital map servers are busy. Please try again in a minute.' });
  }
});

export default router;
