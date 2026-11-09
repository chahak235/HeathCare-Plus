import { Request, Response } from 'express';
import axios from 'axios';
import { AppDataSource } from '../config/database.config';
import { Hospital } from '../entities/Hospital.entity';

// Real-world hospital coverage from OpenStreetMap (free, keyless) — the
// seeded 20-hospital directory only covers a handful of Indian metro
// cities, so a "nearby" search from anywhere else always came back empty
// even though it was working correctly. This fills that gap with genuine,
// worldwide hospital data instead of a bigger fake seed list.
async function fetchNearbyFromOSM(lat: number, lng: number, radiusMeters: number, limit: number) {
  const query = `[out:json][timeout:15];
(
  node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
  way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
);
out center ${limit};`;

  // Overpass's server 406s axios's default User-Agent header (some kind of
  // bot-blocking content negotiation) — a generic one gets through fine.
  const response = await axios.post<{ elements: any[] }>(
    'https://overpass-api.de/api/interpreter',
    query,
    {
      headers: { 'Content-Type': 'text/plain', Accept: '*/*', 'User-Agent': 'HealthcarePlus/1.0' },
      timeout: 12000,
    }
  );

  const elements: any[] = response.data?.elements || [];
  return elements
    .map((el) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (elLat == null || elLng == null) return null;
      const name = el.tags?.name || 'Hospital (name unavailable)';
      const distance_km = haversineKm(lat, lng, elLat, elLng);
      return {
        id: `osm-${el.type}-${el.id}`,
        name,
        type: 'private' as const,
        address: [el.tags?.['addr:housenumber'], el.tags?.['addr:street'], el.tags?.['addr:city']]
          .filter(Boolean)
          .join(', ') || undefined,
        city: el.tags?.['addr:city'],
        state: el.tags?.['addr:state'],
        pincode: el.tags?.['addr:postcode'],
        latitude: elLat,
        longitude: elLng,
        lat: elLat,
        lng: elLng,
        phone: el.tags?.phone || el.tags?.['contact:phone'],
        emergency_phone: el.tags?.phone || el.tags?.['contact:phone'],
        specialty: 'Multi-specialty',
        specialties: [] as string[],
        beds: 0,
        icu_beds: 0,
        ayushman_empaneled: false,
        rating: null, // no rating data from OSM — don't invent one
        distance_km: Math.round(distance_km * 10) / 10,
        source: 'openstreetmap' as const,
      };
    })
    .filter((h): h is NonNullable<typeof h> => h !== null);
}

// Free, keyless geocoding via OpenStreetMap's Nominatim — resolves a city
// name to coordinates so getByCity can supplement with real nearby OSM data.
async function geocodeCity(city: string): Promise<{ lat: number; lng: number } | null> {
  const response = await axios.get<any[]>('https://nominatim.openstreetmap.org/search', {
    params: { q: city, format: 'json', limit: 1 },
    headers: { 'User-Agent': 'HealthcarePlus/1.0' },
    timeout: 8000,
  });
  const first = response.data?.[0];
  if (!first) return null;
  return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toApiShape(h: Hospital & { distance_km?: number }) {
  return {
    id: h.id,
    name: h.name,
    type: (h.type || 'private') as 'government' | 'private' | 'trust',
    address: h.address,
    city: h.city,
    state: h.state,
    pincode: h.pincode,
    latitude: Number(h.latitude),
    longitude: Number(h.longitude),
    lat: Number(h.latitude),
    lng: Number(h.longitude),
    phone: h.phone,
    emergency_phone: h.emergencyContact || h.phone,
    specialty: h.specialties && h.specialties.length ? h.specialties[0] : 'Multi-specialty',
    specialties: h.specialties || [],
    beds: h.totalBeds || 0,
    icu_beds: h.icuBeds || 0,
    ayushman_empaneled: !!h.ayushmanEmpaneled,
    rating: h.rating ? Number(h.rating) : 4.2,
    ...(h.distance_km !== undefined ? { distance_km: Math.round(h.distance_km * 10) / 10 } : {}),
  };
}

export class HospitalsController {
  private repo = AppDataSource.getRepository(Hospital);

  async getByCity(req: Request, res: Response) {
    try {
      const { city } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const hospitals = await this.repo
        .createQueryBuilder('h')
        .where('h.city ILIKE :city', { city: `%${city}%` })
        .orderBy('h.totalBeds', 'DESC')
        .limit(limit)
        .getMany();

      let data: any[] = hospitals.map(toApiShape);

      // Same gap as getNearby: the seeded directory only covers a handful
      // of cities. Geocode the city name (free, keyless Nominatim) and
      // supplement with real OSM hospital data when we're thin on our own.
      if (data.length < 5) {
        try {
          const geo = await geocodeCity(city);
          if (geo) {
            const osmResults = await fetchNearbyFromOSM(geo.lat, geo.lng, 20000, limit);
            const existingNames = new Set(data.map((h) => h.name.toLowerCase().trim()));
            const supplemental = osmResults.filter((h) => !existingNames.has(h.name.toLowerCase().trim()));
            data = [...data, ...supplemental].slice(0, limit);
          }
        } catch (osmError) {
          console.warn('OSM city-hospital lookup failed, using seeded data only:', osmError);
        }
      }

      return res.json({ success: true, count: data.length, data });
    } catch (error) {
      console.error('getByCity error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async getByState(req: Request, res: Response) {
    try {
      const { state } = req.params;
      const limit = parseInt(req.query.limit as string) || 30;

      const hospitals = await this.repo
        .createQueryBuilder('h')
        .where('h.state ILIKE :state', { state: `%${state}%` })
        .orderBy('h.city', 'ASC')
        .addOrderBy('h.totalBeds', 'DESC')
        .limit(limit)
        .getMany();

      return res.json({ success: true, count: hospitals.length, data: hospitals.map(toApiShape) });
    } catch (error) {
      console.error('getByState error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async getNearby(req: Request, res: Response) {
    try {
      const { lat, lng } = req.query;
      const radius = parseFloat(req.query.radius as string) || 50;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!lat || !lng) {
        return res.status(400).json({ success: false, message: 'lat and lng are required' });
      }

      const latNum = parseFloat(lat as string);
      const lngNum = parseFloat(lng as string);

      // Haversine distance in km, computed in SQL — works on plain Postgres, no PostGIS needed.
      const hospitals = await this.repo
        .createQueryBuilder('h')
        .select('h.*')
        .addSelect(
          `(6371 * acos(
              cos(radians(:lat)) * cos(radians(h.latitude)) *
              cos(radians(h.longitude) - radians(:lng)) +
              sin(radians(:lat)) * sin(radians(h.latitude))
          ))`,
          'distance_km'
        )
        .where('h.latitude IS NOT NULL AND h.longitude IS NOT NULL')
        .setParameters({ lat: latNum, lng: lngNum })
        .orderBy('distance_km', 'ASC')
        .limit(limit)
        .getRawMany();

      const filtered = hospitals
        .filter((row: any) => parseFloat(row.distance_km) <= radius)
        .map((row: any) =>
          toApiShape({
            ...row,
            id: row.id,
            distance_km: parseFloat(row.distance_km),
          } as any)
        );

      // Our own seeded directory only covers a few Indian metro cities.
      // When it comes up short for this location, supplement with real
      // OpenStreetMap hospital data instead of returning a thin/empty list.
      let combined: any[] = filtered;
      if (filtered.length < 5) {
        try {
          const osmResults = await fetchNearbyFromOSM(latNum, lngNum, radius * 1000, limit);
          const existingNames = new Set(filtered.map((h: any) => h.name.toLowerCase().trim()));
          const supplemental = osmResults.filter((h) => !existingNames.has(h.name.toLowerCase().trim()));
          combined = [...filtered, ...supplemental]
            .sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity))
            .slice(0, limit);
        } catch (osmError) {
          console.warn('OSM nearby-hospital lookup failed, using seeded data only:', osmError);
        }
      }

      return res.json({ success: true, count: combined.length, data: combined });
    } catch (error) {
      console.error('getNearby error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async search(req: Request, res: Response) {
    try {
      const q = (req.query.q as string) || '';
      const limit = parseInt(req.query.limit as string) || 20;

      const hospitals = await this.repo
        .createQueryBuilder('h')
        .where('h.name ILIKE :q OR h.city ILIKE :q OR h.state ILIKE :q', { q: `%${q}%` })
        .limit(limit)
        .getMany();

      return res.json({ success: true, count: hospitals.length, data: hospitals.map(toApiShape) });
    } catch (error) {
      console.error('search error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async getStates(req: Request, res: Response) {
    try {
      const rows = await this.repo
        .createQueryBuilder('h')
        .select('DISTINCT h.state', 'state')
        .where('h.state IS NOT NULL')
        .orderBy('h.state', 'ASC')
        .getRawMany();
      return res.json({ success: true, data: rows.map((r) => r.state) });
    } catch (error) {
      console.error('getStates error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async getCitiesByState(req: Request, res: Response) {
    try {
      const { state } = req.params;
      const rows = await this.repo
        .createQueryBuilder('h')
        .select('DISTINCT h.city', 'city')
        .where('h.state ILIKE :state', { state: `%${state}%` })
        .orderBy('h.city', 'ASC')
        .getRawMany();
      return res.json({ success: true, data: rows.map((r) => r.city) });
    } catch (error) {
      console.error('getCitiesByState error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  async getHospital(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid hospital id' });
      }
      const hospital = await this.repo.findOne({ where: { id } });
      if (!hospital) {
        return res.status(404).json({ success: false, message: 'Hospital not found' });
      }
      return res.json({ success: true, data: toApiShape(hospital) });
    } catch (error) {
      console.error('getHospital error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
}
