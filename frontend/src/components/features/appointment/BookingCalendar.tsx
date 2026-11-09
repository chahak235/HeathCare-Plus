import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface DayAvailability {
  date: string; // YYYY-MM-DD (clinic date)
  openSlots: number;
}

interface BookingCalendarProps {
  days: DayAvailability[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const monthKey = (date: string) => date.slice(0, 7);
const parse = (date: string) => new Date(`${date}T00:00:00`);

/** Month-view calendar like Google Calendar. Only dates with open slots can be picked. */
const BookingCalendar: React.FC<BookingCalendarProps> = ({ days, selectedDate, onSelect }) => {
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d.openSlots])), [days]);
  const months = useMemo(() => Array.from(new Set(days.map((d) => monthKey(d.date)))), [days]);
  const [monthIndex, setMonthIndex] = useState(0);

  if (months.length === 0) return null;
  const current = months[Math.min(monthIndex, months.length - 1)];
  const [year, month] = current.split('-').map(Number);
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const title = new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const cells: (string | null)[] = Array(firstWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${current}-${String(d).padStart(2, '0')}`);
  }

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          aria-label="Previous month"
          disabled={monthIndex === 0}
          onClick={() => setMonthIndex((i) => i - 1)}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-neutral-900 dark:text-white">{title}</span>
        <button
          type="button"
          aria-label="Next month"
          disabled={monthIndex >= months.length - 1}
          onClick={() => setMonthIndex((i) => i + 1)}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-500 dark:text-neutral-400 mb-1">
        {WEEK.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} />;
          const open = byDate.get(date) ?? 0;
          const inRange = byDate.has(date);
          const isSelected = date === selectedDate;
          const enabled = inRange && open > 0;
          return (
            <button
              key={date}
              type="button"
              disabled={!enabled}
              onClick={() => onSelect(date)}
              title={enabled ? `${open} open slot${open === 1 ? '' : 's'}` : 'No open slots'}
              className={`aspect-square rounded-lg text-sm flex flex-col items-center justify-center transition-colors ${
                isSelected
                  ? 'bg-primary-600 text-white'
                  : enabled
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/40'
                    : 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
              }`}
            >
              <span className="font-medium">{parse(date).getDate()}</span>
              {enabled && <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-primary-500'}`} />}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">Highlighted dates have open slots.</p>
    </div>
  );
};

export default BookingCalendar;
