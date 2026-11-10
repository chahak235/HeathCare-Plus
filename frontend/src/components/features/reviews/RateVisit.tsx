import React, { useState } from 'react';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { reviewsService } from '../../../services/reviews-service';

/** Inline "Rate this visit" form for a past appointment. */
const RateVisit: React.FC<{ appointmentId: number; doctorName?: string; onDone?: () => void }> = ({ appointmentId, doctorName, onDone }) => {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return <p className="mt-2 text-sm text-green-700 dark:text-green-400 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Thanks for your review!</p>;
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 text-sm font-medium text-primary-700 dark:text-primary-300 hover:underline">
        Rate this visit
      </button>
    );
  }

  const submit = async () => {
    if (!rating) {
      setError('Choose 1 to 5 stars.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await reviewsService.submit(appointmentId, rating, comment);
      setDone(true);
      onDone?.();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
      <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">How was your visit{doctorName ? ` with ${doctorName}` : ''}?</p>
      <div className="flex gap-1 mb-2" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="p-0.5"
          >
            <Star className={`w-6 h-6 ${(hover || rating) >= n ? 'text-amber-500 fill-current' : 'text-neutral-300 dark:text-neutral-600'}`} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 600))}
        rows={3}
        placeholder="Optional: what went well, what could be better? Please don't include medical details."
        className="w-full text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 p-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <p className="text-xs text-neutral-500 mt-1">Shown publicly with your first name and last initial.</p>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button type="button" disabled={saving} onClick={submit} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Submit review
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg text-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default RateVisit;
