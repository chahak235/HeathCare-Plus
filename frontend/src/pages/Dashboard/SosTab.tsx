import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, MapPin, Phone, RefreshCw, Loader2, CheckCircle2, Eye } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface SosAlert {
  id: number;
  createdAt: string;
  status: 'open' | 'acknowledged' | 'resolved';
  handledAt: string | null;
  nearestHospital: string | null;
  contactsEmailed: number;
  mapsLink: string | null;
  distanceKm: number | null;
  patient: {
    name: string;
    phone: string | null;
    bloodGroup: string | null;
    allergies: string[];
    conditions: string[];
    medications: string[];
  };
}

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  acknowledged: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

const ago = (iso: string) => {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  if (min < 1440) return `${Math.round(min / 60)} h ago`;
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
};

/** Load SOS alerts this account may see. Polls every 30 s while mounted. */
export function useSosAlerts(days = 7) {
  const [alerts, setAlerts] = useState<SosAlert[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await axios.get(`${API_URL}/admin/sos-alerts`, { params: { days } });
      setAlerts(r.data?.data || []);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Could not load SOS alerts.');
      setAlerts((a) => a ?? []);
    }
  }, [days]);
  useEffect(() => {
    load();
    const t = window.setInterval(load, 30_000);
    return () => window.clearInterval(t);
  }, [load]);
  return { alerts, error, reload: load };
}

/** Real SOS presses from patients near this hospital (all of them for an admin). */
export const SosTab: React.FC = () => {
  const [days, setDays] = useState(7);
  const { alerts, error, reload } = useSosAlerts(days);
  const [busy, setBusy] = useState<number | null>(null);

  const setStatus = async (id: number, status: SosAlert['status']) => {
    setBusy(id);
    try {
      await axios.patch(`${API_URL}/admin/sos-alerts/${id}`, { status });
      await reload();
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Could not update the alert.');
    } finally {
      setBusy(null);
    }
  };

  const open = alerts?.filter((a) => a.status === 'open').length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Patients who pressed SOS near your hospital (within 50 km, or who chose you as nearest). Refreshes every 30 seconds.
        </p>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-1.5"
            aria-label="Time range"
          >
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button type="button" onClick={reload} className="inline-flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300 hover:underline">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {open > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm font-medium">
          <AlertTriangle className="w-4 h-4" /> {open} open alert{open > 1 ? 's' : ''}: call the patient and mark it acknowledged.
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {alerts === null && <p className="flex items-center gap-2 text-sm text-neutral-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading alerts…</p>}
      {alerts && alerts.length === 0 && !error && <p className="text-sm text-neutral-500 dark:text-neutral-400">No SOS alerts in this period.</p>}

      <div className="grid gap-3 md:grid-cols-2">
        {alerts?.map((a) => (
          <div key={a.id} className={`p-4 rounded-xl bg-white dark:bg-neutral-900 border ${a.status === 'open' ? 'border-red-300 dark:border-red-700' : 'border-neutral-200 dark:border-neutral-700'}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-neutral-900 dark:text-white">{a.patient.name}</div>
                <div className="text-xs text-neutral-500">
                  {ago(a.createdAt)}
                  {a.distanceKm != null && ` · ${a.distanceKm} km from you`}
                  {a.nearestHospital && ` · nearest: ${a.nearestHospital}`}
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[a.status]}`}>{a.status}</span>
            </div>

            <dl className="mt-3 grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-sm">
              {a.patient.bloodGroup && (<><dt className="text-neutral-500">Blood group</dt><dd className="font-medium">{a.patient.bloodGroup}</dd></>)}
              {a.patient.allergies.length > 0 && (<><dt className="text-neutral-500">Allergies</dt><dd className="font-medium text-red-700 dark:text-red-300">{a.patient.allergies.join(', ')}</dd></>)}
              {a.patient.conditions.length > 0 && (<><dt className="text-neutral-500">Conditions</dt><dd>{a.patient.conditions.join(', ')}</dd></>)}
              {a.patient.medications.length > 0 && (<><dt className="text-neutral-500">Medications</dt><dd>{a.patient.medications.join(', ')}</dd></>)}
              <dt className="text-neutral-500">Family emailed</dt><dd>{a.contactsEmailed}</dd>
            </dl>

            <div className="mt-3 flex flex-wrap gap-2">
              {a.patient.phone && (
                <a href={`tel:${a.patient.phone}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700">
                  <Phone className="w-4 h-4" /> Call {a.patient.phone}
                </a>
              )}
              {a.mapsLink && (
                <a href={a.mapsLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <MapPin className="w-4 h-4" /> Location
                </a>
              )}
              {a.status === 'open' && (
                <button type="button" disabled={busy === a.id} onClick={() => setStatus(a.id, 'acknowledged')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 dark:text-amber-300 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50">
                  <Eye className="w-4 h-4" /> Acknowledge
                </button>
              )}
              {a.status !== 'resolved' && (
                <button type="button" disabled={busy === a.id} onClick={() => setStatus(a.id, 'resolved')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-green-300 text-green-700 dark:text-green-300 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50">
                  <CheckCircle2 className="w-4 h-4" /> Resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
