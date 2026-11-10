import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Calendar, Video, Building2, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Row {
  id: number;
  scheduledTime: string;
  status: string;
  appointmentType: string;
  meetingLink: string | null;
  symptoms: string[];
  patientName: string;
  patientPhone: string | null;
  patientEmail: string | null;
  doctorName: string;
  doctorSpecialty: string | null;
}

interface Summary {
  appointments: { total: number; upcoming: number; today: number; online: number; cancelled: number };
  doctors: number;
  patients: number;
  reviews: { count: number; average: number | null };
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });

const STATUS_STYLE: Record<string, string> = {
  confirmed: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  scheduled: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  pending_confirmation: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

/** Real bookings for this hospital (or all hospitals for an admin), with actions. */
export const AppointmentsTab: React.FC = () => {
  const [when, setWhen] = useState<'upcoming' | 'past'>('upcoming');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setRows(null);
    try {
      const [a, s] = await Promise.all([
        axios.get(`${API_URL}/admin/appointments`, { params: { when } }),
        axios.get(`${API_URL}/admin/summary`),
      ]);
      setRows(a.data?.data || []);
      setSummary(s.data?.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Could not load appointments.');
      setRows([]);
    }
  }, [when]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: number, status: 'completed' | 'cancelled') => {
    const reason = status === 'cancelled' ? window.prompt('Reason for cancelling (sent to the patient):', 'Doctor unavailable') : undefined;
    if (status === 'cancelled' && reason === null) return;
    setBusy(id);
    try {
      await axios.patch(`${API_URL}/appointments/${id}/status`, { status, reason });
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Could not update the appointment.');
    } finally {
      setBusy(null);
    }
  };

  const stat = (label: string, value: React.ReactNode) => (
    <div className="p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
      <div className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</div>
      <div className="text-sm text-neutral-500 dark:text-neutral-400">{label}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stat('Today', summary.appointments.today)}
          {stat('Upcoming', summary.appointments.upcoming)}
          {stat('All bookings', summary.appointments.total)}
          {stat('Video consults', summary.appointments.online)}
          {stat('Doctors', summary.doctors)}
          {stat('Patient rating', summary.reviews.average ? `${summary.reviews.average} ★ (${summary.reviews.count})` : 'No reviews yet')}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {(['upcoming', 'past'] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWhen(w)}
              className={`px-4 py-2 text-sm font-medium ${when === w ? 'bg-primary-600 text-white' : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'}`}
            >
              {w === 'upcoming' ? 'Upcoming' : 'Past'}
            </button>
          ))}
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300 hover:underline">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {rows === null && <p className="flex items-center gap-2 text-sm text-neutral-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading bookings…</p>}
      {rows && rows.length === 0 && !error && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">No {when} appointments.</p>
      )}

      {rows && rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800 text-left text-neutral-600 dark:text-neutral-300">
              <tr>
                <th className="px-4 py-3 font-medium">When (IST)</th>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700 bg-white dark:bg-neutral-900">
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3 whitespace-nowrap"><Calendar className="inline w-4 h-4 mr-1 text-neutral-400" />{fmt(r.scheduledTime)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-neutral-900 dark:text-white">{r.patientName}</div>
                    <div className="text-xs text-neutral-500">{[r.patientPhone, r.patientEmail].filter(Boolean).join(' · ')}</div>
                    {r.symptoms.length > 0 && <div className="text-xs text-neutral-500 mt-1 max-w-xs">“{r.symptoms.join(', ')}”</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-neutral-900 dark:text-white">{r.doctorName}</div>
                    <div className="text-xs text-neutral-500">{r.doctorSpecialty}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {r.appointmentType === 'online' ? (
                      r.meetingLink ? (
                        <a href={r.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-700 dark:text-primary-300 hover:underline"><Video className="w-4 h-4" /> Meet</a>
                      ) : (
                        <span className="inline-flex items-center gap-1"><Video className="w-4 h-4" /> Online</span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1"><Building2 className="w-4 h-4" /> Clinic</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[r.status] || 'bg-neutral-100 text-neutral-700'}`}>{r.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {!['cancelled', 'completed'].includes(r.status) && (
                      <div className="flex gap-2">
                        <button type="button" disabled={busy === r.id} onClick={() => setStatus(r.id, 'completed')} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-green-300 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50">
                          <CheckCircle2 className="w-4 h-4" /> Done
                        </button>
                        <button type="button" disabled={busy === r.id} onClick={() => setStatus(r.id, 'cancelled')} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-red-300 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50">
                          <XCircle className="w-4 h-4" /> Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
