import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Phone, Navigation, Globe, Loader2, LocateFixed, AlertCircle, Siren, ExternalLink, Filter } from 'lucide-react';
import { Container } from '../components/layout/Container';
import {
  FoundHospital, Place, directionsUrl, googleMapsUrl, hospitalsInPlace, hospitalsNear, searchPlaces, withDistance,
} from '../services/hospital-finder';

const PAGE_SIZE = 30;

const FitBounds: React.FC<{ points: [number, number][]; focus: [number, number] | null }> = ({ points, focus }) => {
  const map = useMap();
  useEffect(() => {
    if (focus) {
      map.flyTo(focus, Math.max(map.getZoom(), 15), { duration: 0.8 });
    }
  }, [focus, map]);
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0], 14);
    else map.fitBounds(points, { padding: [30, 30], maxZoom: 15 });
  }, [points, map]);
  return null;
};

const MapPrediction: React.FC = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [place, setPlace] = useState<Place | null>(null);
  const [hospitals, setHospitals] = useState<FoundHospital[]>([]);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [withPhoneOnly, setWithPhoneOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [focus, setFocus] = useState<[number, number] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = async (label: string, run: (signal: AbortSignal) => Promise<FoundHospital[]>) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(label);
    setError(null);
    setHospitals([]);
    setPage(1);
    setSelectedId(null);
    try {
      let list = await run(controller.signal);
      if (userPos) list = withDistance(list, userPos.lat, userPos.lng);
      list.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0) || a.name.localeCompare(b.name));
      setHospitals(list);
      if (list.length === 0) setError('No hospitals are mapped in this area yet. Try a larger area or a nearby city.');
    } catch (err: any) {
      if (err?.name !== 'AbortError') setError('The hospital map service is busy. Please try again in a few seconds.');
    } finally {
      if (abortRef.current === controller) setLoading(null);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Your browser does not support location.');
      return;
    }
    setLoading('Finding your location…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(p);
        setPlace(null);
        load('Finding hospitals near you…', (signal) => hospitalsNear(p.lat, p.lng, 15, signal));
      },
      () => {
        setLoading(null);
        setError('Location access was blocked. Search for your city or state instead.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Start with hospitals near the user if they allow location
  useEffect(() => {
    useMyLocation();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setError(null);
    setLoading('Searching places…');
    try {
      const results = await searchPlaces(q);
      setLoading(null);
      if (results.length === 0) {
        setError(`We couldn't find "${q}". Check the spelling or add the country, e.g. "Pune, India".`);
        setSuggestions([]);
      } else if (results.length === 1) {
        choosePlace(results[0]);
      } else {
        setSuggestions(results);
      }
    } catch (err: any) {
      setLoading(null);
      setError(err?.message || 'Place search failed.');
    }
  };

  const choosePlace = (p: Place) => {
    setSuggestions([]);
    setPlace(p);
    setQuery(p.name);
    load(`Loading every hospital in ${p.name}… large states or countries can take up to a minute`, (signal) => hospitalsInPlace(p, signal));
  };

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return hospitals.filter(
      (h) =>
        (!emergencyOnly || h.emergency === true) &&
        (!withPhoneOnly || !!h.phone) &&
        (!f || h.name.toLowerCase().includes(f) || h.address.toLowerCase().includes(f) || (h.operator ?? '').toLowerCase().includes(f))
    );
  }, [hospitals, filter, emergencyOnly, withPhoneOnly]);

  const points = useMemo<[number, number][]>(() => hospitals.map((h) => [h.lat, h.lng]), [hospitals]);
  const shown = filtered.slice(0, page * PAGE_SIZE);
  const center: [number, number] = userPos ? [userPos.lat, userPos.lng] : [20.59, 78.96];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/30 dark:from-[#0B1221] dark:via-[#0F172A] dark:to-[#1E293B] py-10">
      <Container>
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white">Find Hospitals Anywhere</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Search any city, state or country to see every mapped hospital, with contacts and directions.
          </p>
        </div>

        <form onSubmit={onSearch} className="relative max-w-3xl mx-auto mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Pune, Maharashtra, Kerala, London, Texas"
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Search a city, state or country"
              />
            </div>
            <button type="submit" className="px-5 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700">Search</button>
            <button type="button" onClick={useMyLocation} title="Hospitals near me" className="px-3 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-primary-600 hover:border-primary-500">
              <LocateFixed className="w-5 h-5" />
            </button>
          </div>
          {suggestions.length > 0 && (
            <ul className="absolute z-[1000] mt-2 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg overflow-hidden">
              <li className="px-4 py-2 text-xs text-neutral-500">Which place did you mean?</li>
              {suggestions.map((s) => (
                <li key={`${s.osmType}-${s.osmId}`}>
                  <button type="button" onClick={() => choosePlace(s)} className="w-full text-left px-4 py-2.5 hover:bg-primary-50 dark:hover:bg-neutral-800">
                    <span className="font-medium text-neutral-900 dark:text-white">{s.name}</span>
                    <span className="ml-2 text-xs uppercase text-primary-600">{s.type}</span>
                    <span className="block text-xs text-neutral-500 truncate">{s.displayName}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>

        {(loading || error) && (
          <div className={`max-w-3xl mx-auto mb-6 p-3 rounded-xl flex items-center gap-2 text-sm ${error ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300' : 'bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300'}`}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
            {loading || error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 h-[460px] lg:h-[680px] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-sm relative z-0">
            <MapContainer center={center} zoom={5} preferCanvas style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds points={points} focus={focus} />
              {userPos && (
                <CircleMarker center={[userPos.lat, userPos.lng]} radius={8} pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.9 }}>
                  <Popup>You are here</Popup>
                </CircleMarker>
              )}
              {filtered.map((h) => (
                <CircleMarker
                  key={h.id}
                  center={[h.lat, h.lng]}
                  radius={h.id === selectedId ? 10 : 6}
                  pathOptions={{ color: '#fff', weight: 1.5, fillColor: h.emergency ? '#dc2626' : '#0284c7', fillOpacity: 0.9 }}
                  eventHandlers={{ click: () => setSelectedId(h.id) }}
                >
                  <Popup>
                    <strong>{h.name}</strong>
                    {h.address && <div>{h.address}</div>}
                    {h.phone && <div><a href={`tel:${h.phone.split(';')[0].replace(/[^\d+]/g, '')}`}>{h.phone}</a></div>}
                    <div style={{ marginTop: 6 }}>
                      <a href={directionsUrl(h)} target="_blank" rel="noopener noreferrer">Directions in Google Maps</a>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          <div className="lg:col-span-2 flex flex-col h-[680px]">
            <div className="mb-3">
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="font-semibold text-neutral-900 dark:text-white">
                  {place ? `Hospitals in ${place.name}` : userPos ? 'Hospitals near you (15 km)' : 'Hospitals'}
                </h2>
                <span className="text-sm text-neutral-500">{filtered.length} of {hospitals.length}</span>
              </div>
              <div className="relative mb-2">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  value={filter}
                  onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                  placeholder="Filter by name, area or operator"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white"
                />
              </div>
              <div className="flex gap-4 text-sm text-neutral-700 dark:text-neutral-300">
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={emergencyOnly} onChange={(e) => { setEmergencyOnly(e.target.checked); setPage(1); }} /> Emergency only</label>
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={withPhoneOnly} onChange={(e) => { setWithPhoneOnly(e.target.checked); setPage(1); }} /> Has phone number</label>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {shown.map((h) => (
                <div
                  key={h.id}
                  className={`p-4 rounded-xl border bg-white dark:bg-neutral-900 transition-colors ${h.id === selectedId ? 'border-primary-500 ring-1 ring-primary-500' : 'border-neutral-200 dark:border-neutral-700'}`}
                >
                  <button type="button" onClick={() => { setSelectedId(h.id); setFocus([h.lat, h.lng]); }} className="text-left w-full">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-neutral-900 dark:text-white">{h.name}</h3>
                      {h.distanceKm != null && <span className="text-xs text-neutral-500 whitespace-nowrap">{h.distanceKm} km</span>}
                    </div>
                    {h.address && <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 flex gap-1.5"><MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />{h.address}</p>}
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                      {h.emergency && <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex items-center gap-1"><Siren className="w-3 h-3" />Emergency</span>}
                      {h.beds && <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">{h.beds} beds</span>}
                      {h.operator && <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">{h.operator}</span>}
                      {h.openingHours && <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">{h.openingHours}</span>}
                    </div>
                  </button>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={directionsUrl(h)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700">
                      <Navigation className="w-4 h-4" /> Directions
                    </a>
                    {h.phone && (
                      <a href={`tel:${h.phone.split(';')[0].replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm text-neutral-800 dark:text-neutral-200">
                        <Phone className="w-4 h-4" /> {h.phone.split(';')[0]}
                      </a>
                    )}
                    <a href={googleMapsUrl(h)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm text-neutral-800 dark:text-neutral-200">
                      <ExternalLink className="w-4 h-4" /> Google Maps
                    </a>
                    {h.website && (
                      <a href={h.website.startsWith('http') ? h.website : `https://${h.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm text-neutral-800 dark:text-neutral-200">
                        <Globe className="w-4 h-4" /> Website
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {shown.length < filtered.length && (
                <button type="button" onClick={() => setPage((p) => p + 1)} className="w-full py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm text-neutral-700 dark:text-neutral-300 hover:border-primary-500">
                  Show more ({filtered.length - shown.length} left)
                </button>
              )}
              {!loading && hospitals.length === 0 && !error && (
                <p className="text-sm text-neutral-500 text-center py-10">Search a place or allow location to see hospitals.</p>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs text-neutral-500 dark:text-neutral-400 text-center">
          Hospital data from OpenStreetMap contributors. Some hospitals may be missing details. In an emergency in India, call 112.
        </p>
      </Container>
    </div>
  );
};

export default MapPrediction;
