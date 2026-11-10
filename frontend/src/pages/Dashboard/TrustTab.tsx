import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Star, Eye, EyeOff, ShieldCheck, RefreshCw, UserCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ReviewRow {
  id: number;
  doctorId: number;
  displayName: string;
  rating: number;
  comment: string | null;
  isPublished: boolean;
  createdAt: string;
}

interface LogRow {
  id: number;
  userId: number | null;
  userRole: string | null;
  action: string;
  patientId: number | null;
  path: string;
  method: string;
  statusCode: number;
  ip: string | null;
  createdAt: string;
}

const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });

/** Review moderation and the health-record access log. */
export const TrustTab: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewRow[] | null>(null);
  const [logs, setLogs] = useState<LogRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Only admins get this list; hospital accounts receive 403 and the section stays hidden
  const [pending, setPending] = useState<{ id: number; name: string; email: string; phone: string; role: string }[] | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [r, l] = await Promise.all([axios.get(`${API_URL}/admin/reviews`), axios.get(`${API_URL}/admin/access-logs`, { params: { limit: 100 } })]);
      setReviews(r.data?.data || []);
      setLogs(l.data?.data || []);
      axios.get(`${API_URL}/admin/pending-accounts`).then((p) => setPending(p.data?.data || [])).catch(() => setPending(null));
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Could not load reviews and access log.');
      setReviews([]);
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (r: ReviewRow) => {
    try {
      await axios.patch(`${API_URL}/reviews/${r.id}`, { isPublished: !r.isPublished });
      setReviews((list) => (list || []).map((x) => (x.id === r.id ? { ...x, isPublished: !x.isPublished } : x)));
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Could not update the review.');
    }
  };

  const approve = async (id: number) => {
    try {
      await axios.patch(`${API_URL}/admin/users/${id}/verify`, { verified: true });
      setPending((list) => (list || []).filter((u) => u.id !== id));
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Could not approve the account.');
    }
  };

  const card = 'p-5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700';

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button type="button" onClick={load} className="inline-flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300 hover:underline">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {pending && (
        <section className={card}>
          <h3 className="font-semibold text-neutral-900 dark:text-white mb-1 flex items-center gap-2"><UserCheck className="w-5 h-5 text-primary-600" /> Accounts waiting for approval</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">New doctor and hospital accounts cannot see patients' data until you approve them. Check their registration before approving.</p>
          {pending.length === 0 && <p className="text-sm text-neutral-500">Nobody is waiting.</p>}
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {pending.map((u) => (
              <li key={u.id} className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0 text-sm">
                  <div className="font-medium text-neutral-900 dark:text-white">{u.name} <span className="text-xs text-neutral-500">({u.role})</span></div>
                  <div className="text-neutral-500">{u.email} · {u.phone}</div>
                </div>
                <button type="button" onClick={() => approve(u.id)} className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">Approve</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={card}>
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-1">Patient reviews</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Written by patients after a real appointment. Hide a review if it is abusive or shares personal details.</p>
        {reviews && reviews.length === 0 && <p className="text-sm text-neutral-500">No reviews yet.</p>}
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
          {(reviews || []).map((r) => (
            <li key={r.id} className="py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-neutral-900 dark:text-white">{r.displayName}</span>
                  <span className="text-amber-500 inline-flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-current' : 'text-neutral-300 dark:text-neutral-600'}`} />)}</span>
                  <span className="text-xs text-neutral-500">doctor #{r.doctorId} · {when(r.createdAt)}</span>
                </div>
                {r.comment && <p className={`text-sm mt-1 ${r.isPublished ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400 line-through'}`}>{r.comment}</p>}
              </div>
              <button type="button" onClick={() => toggle(r)} className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700">
                {r.isPublished ? <><EyeOff className="w-4 h-4" /> Hide</> : <><Eye className="w-4 h-4" /> Show</>}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h3 className="font-semibold text-neutral-900 dark:text-white mb-1 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary-600" /> Health record access log</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Every view or change of health profiles, appointments and patient records, newest first.</p>
        {logs && logs.length === 0 && <p className="text-sm text-neutral-500">No access recorded yet.</p>}
        {logs && logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="text-left text-neutral-500">
                <tr>
                  <th className="py-2 pr-4">Time (IST)</th>
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Action</th>
                  <th className="py-2 pr-4">Patient</th>
                  <th className="py-2 pr-4">Request</th>
                  <th className="py-2 pr-4">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700 text-neutral-700 dark:text-neutral-300">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="py-1.5 pr-4 whitespace-nowrap">{when(l.createdAt)}</td>
                    <td className="py-1.5 pr-4 whitespace-nowrap">{l.userId ? `#${l.userId} (${l.userRole})` : 'anonymous'}</td>
                    <td className="py-1.5 pr-4 whitespace-nowrap">{l.action.replace(/_/g, ' ')}</td>
                    <td className="py-1.5 pr-4">{l.patientId ? `#${l.patientId}` : '—'}</td>
                    <td className="py-1.5 pr-4 font-mono">{l.method} {l.path}</td>
                    <td className={`py-1.5 pr-4 ${l.statusCode >= 400 ? 'text-red-600' : 'text-green-700 dark:text-green-400'}`}>{l.statusCode >= 400 ? `refused (${l.statusCode})` : 'allowed'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
