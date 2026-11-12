/**
 * Analytics: real numbers from bookings, sign-ups, reviews and SOS alerts.
 * Nothing here is estimated or sample data.
 */
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Download, Loader2, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface Analytics {
  days: number;
  bookingsPerDay: { day: string; n: number }[];
  byType: { type: string; n: number }[];
  byStatus: { status: string; n: number }[];
  bySpecialty: { specialty: string; n: number }[];
  topDoctors: { name: string; specialty: string; rating: number | null; n: number }[];
  newPatients: number;
  sos: { total: number; open: number; avgResponseMin: number | null };
}

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
    <h3 className="font-semibold text-neutral-900 dark:text-white mb-4">{title}</h3>
    {children}
  </div>
);

const Bars: React.FC<{ rows: { label: string; n: number }[]; empty: string }> = ({ rows, empty }) => {
  if (!rows.length) return <p className="text-sm text-neutral-500">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.n), 1);
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-neutral-700 dark:text-neutral-300 capitalize">{r.label}</span>
            <span className="font-medium text-neutral-900 dark:text-white">{r.n}</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div className="h-2 rounded-full bg-primary-500" style={{ width: `${(r.n / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
};

/** Fill in days with no bookings so the chart shows a true timeline */
function fillDays(rows: { day: string; n: number }[], days: number) {
  const map = new Map(rows.map((r) => [r.day, r.n]));
  const out: { day: string; n: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    out.push({ day: d, n: map.get(d) ?? 0 });
  }
  return out;
}

export const AnalyticsTab: React.FC = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await axios.get(`${API_URL}/admin/analytics`, { params: { days } });
      setData(r.data?.data || null);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Could not load analytics.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const exportCsv = () => {
    if (!data) return;
    const lines = [
      ['Section', 'Item', 'Count'],
      ...fillDays(data.bookingsPerDay, data.days).map((r) => ['Bookings per day', r.day, r.n]),
      ...data.byType.map((r) => ['Booking type', r.type, r.n]),
      ...data.byStatus.map((r) => ['Booking status', r.status, r.n]),
      ...data.bySpecialty.map((r) => ['Specialty', r.specialty, r.n]),
      ...data.topDoctors.map((r) => ['Top doctors', r.name, r.n]),
      ['Patients', 'New sign-ups', data.newPatients],
      ['SOS', 'Alerts', data.sos.total],
      ['SOS', 'Still open', data.sos.open],
      ['SOS', 'Average response (min)', data.sos.avgResponseMin ?? ''],
    ];
    const csv = lines.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `healthcareplus-analytics-${data.days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const timeline = data ? fillDays(data.bookingsPerDay, data.days) : [];
  const peak = Math.max(...timeline.map((r) => r.n), 1);
  const total = timeline.reduce((t, r) => t + r.n, 0);
  const stat = (label: string, value: React.ReactNode) => (
    <div className="p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
      <div className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</div>
      <div className="text-sm text-neutral-500 dark:text-neutral-400">{label}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              className={`px-4 py-2 text-sm font-medium ${days === d ? 'bg-primary-600 text-white' : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'}`}
            >
              {d} days
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={load} className="inline-flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300 hover:underline">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button type="button" onClick={exportCsv} disabled={!data} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm hover:bg-primary-700 disabled:opacity-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && !data && <p className="flex items-center gap-2 text-sm text-neutral-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading analytics…</p>}
      {!loading && !data && !error && <p className="text-sm text-neutral-500">No hospital is linked to this account yet.</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stat(`Bookings (${data.days} days)`, total)}
            {stat('New patients', data.newPatients)}
            {stat('SOS alerts', data.sos.total)}
            {stat('Avg SOS response', data.sos.avgResponseMin != null ? `${data.sos.avgResponseMin} min` : '—')}
          </div>

          <Card title="Bookings per day (by booking date, IST)">
            {total === 0 ? (
              <p className="text-sm text-neutral-500">No bookings in this period.</p>
            ) : (
              <div className="flex items-end gap-[2px] h-40" role="img" aria-label={`${total} bookings over ${data.days} days`}>
                {timeline.map((r) => (
                  <div key={r.day} className="flex-1 h-full flex items-end" title={`${r.day}: ${r.n}`}>
                    <div className="w-full rounded-t bg-primary-500" style={{ height: `${(r.n / peak) * 100}%`, minHeight: r.n ? 2 : 0 }} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="In-clinic vs video">
              <Bars rows={data.byType.map((r) => ({ label: r.type === 'online' ? 'Video' : 'In-clinic', n: r.n }))} empty="No bookings yet." />
            </Card>
            <Card title="Booking status">
              <Bars rows={data.byStatus.map((r) => ({ label: r.status.replace('_', ' '), n: r.n }))} empty="No bookings yet." />
            </Card>
            <Card title="By specialty">
              <Bars rows={data.bySpecialty.map((r) => ({ label: r.specialty, n: r.n }))} empty="No bookings yet." />
            </Card>
          </div>

          <Card title="Most booked doctors">
            {data.topDoctors.length === 0 ? (
              <p className="text-sm text-neutral-500">No bookings yet.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="text-left text-neutral-500">
                  <tr><th className="py-2 font-medium">Doctor</th><th className="py-2 font-medium">Specialty</th><th className="py-2 font-medium">Rating</th><th className="py-2 font-medium text-right">Bookings</th></tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {data.topDoctors.map((d) => (
                    <tr key={d.name}>
                      <td className="py-2 text-neutral-900 dark:text-white">{d.name}</td>
                      <td className="py-2">{d.specialty}</td>
                      <td className="py-2">{d.rating ? `${d.rating.toFixed(1)} ★` : '—'}</td>
                      <td className="py-2 text-right font-medium">{d.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
};
