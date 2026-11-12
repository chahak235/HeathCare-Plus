import React, { useState } from 'react';
import axios from 'axios';
import { Video, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
/** The button stays until this long after the consult's planned end */
const GRACE_AFTER_END_MS = 30 * 60 * 1000;

export interface JoinableAppointment {
  id: number;
  scheduledTime: string;
  duration?: number | null;
  meetingLink?: string | null;
  appointmentType: string;
  status: string;
}

/** True for a confirmed video consult that has not finished yet. */
export function canJoin(a: JoinableAppointment, now = Date.now()) {
  if (a.appointmentType !== 'online') return false;
  if (!['confirmed', 'scheduled'].includes(a.status)) return false;
  const end = new Date(a.scheduledTime).getTime() + (a.duration || 30) * 60_000;
  return now <= end + GRACE_AFTER_END_MS;
}

/** "Starts in 2 h", "Starting now", "In progress" for the label under the button */
function timing(a: JoinableAppointment, now = Date.now()) {
  const start = new Date(a.scheduledTime).getTime();
  const mins = Math.round((start - now) / 60000);
  if (mins > 60 * 24) return null;
  if (mins > 60) return `Starts in ${Math.round(mins / 60)} h`;
  if (mins > 10) return `Starts in ${mins} min`;
  if (mins >= -5) return 'Starting now';
  return 'In progress';
}

/**
 * Opens the appointment's Google Meet straight away. If the booking has no
 * link yet (Google was unreachable when it was made), asks the server to
 * create one first.
 */
export const JoinCallButton: React.FC<{ appointment: JoinableAppointment; className?: string; onLink?: (link: string) => void }> = ({
  appointment,
  className = '',
  onLink,
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!canJoin(appointment)) return null;

  const join = async () => {
    setError(null);
    if (appointment.meetingLink) {
      window.open(appointment.meetingLink, '_blank', 'noopener,noreferrer');
      return;
    }
    // Open the tab now (browsers block pop-ups opened after a wait), then point it at Meet
    const tab = window.open('', '_blank');
    setBusy(true);
    try {
      const r = await axios.post(`${API_URL}/appointments/${appointment.id}/meeting`);
      const link: string | undefined = r.data?.data?.meetingLink;
      if (!link) throw new Error('no link');
      onLink?.(link);
      if (tab) {
        tab.opener = null;
        tab.location.href = link;
      } else {
        window.location.href = link;
      }
    } catch (err: any) {
      tab?.close();
      setError(err?.response?.data?.error || 'Could not open the video call. Use the Meet link in your confirmation email.');
    } finally {
      setBusy(false);
    }
  };

  const when = timing(appointment);
  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={join}
        disabled={busy}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 shadow-md disabled:opacity-60 ${className}`}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
        {busy ? 'Opening…' : 'Join video call'}
      </button>
      {when && !error && <span className="text-xs text-neutral-500 dark:text-neutral-400">{when} · opens Google Meet</span>}
      {error && <span className="text-xs text-red-600 max-w-xs">{error}</span>}
    </div>
  );
};

export default JoinCallButton;
