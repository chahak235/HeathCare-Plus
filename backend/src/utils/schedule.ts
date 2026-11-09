/**
 * Doctor scheduling rules, kept free of database code so they can be tested.
 *
 * All clinic times are in the clinic's local time zone (India by default),
 * whatever time zone the server runs in. India has no daylight saving, so a
 * fixed offset is exact.
 */

export const CLINIC_UTC_OFFSET_MINUTES = Number(process.env.CLINIC_UTC_OFFSET_MINUTES ?? 330); // IST = UTC+5:30
export const MAX_BOOKING_DAYS = Number(process.env.MAX_BOOKING_DAYS ?? 90);
/** A slot must start at least this far in the future to be bookable. */
export const MIN_LEAD_MINUTES = 15;

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** The calendar date ("YYYY-MM-DD") in the clinic's time zone for an instant. */
export function clinicDateKey(instant: Date): string {
  return new Date(instant.getTime() + CLINIC_UTC_OFFSET_MINUTES * 60_000).toISOString().slice(0, 10);
}

/** Accepts "YYYY-MM-DD" as a clinic date, or any other date/time as an instant. */
export function toClinicDateKey(value: string | Date): string | null {
  if (typeof value === 'string' && DATE_KEY.test(value)) return value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : clinicDateKey(d);
}

export function addDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(dateKey: string): string {
  return WEEKDAYS[new Date(`${dateKey}T00:00:00Z`).getUTCDay()];
}

/** The UTC instant for a clinic-local date and minute of the day. */
export function clinicTime(dateKey: string, minuteOfDay: number): Date {
  const midnightUtc = Date.parse(`${dateKey}T00:00:00Z`);
  return new Date(midnightUtc + (minuteOfDay - CLINIC_UTC_OFFSET_MINUTES) * 60_000);
}

function parseClock(text: string): number | null {
  const m = text.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  const ampm = m[3]?.toUpperCase();
  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  if (hour > 24 || minute > 59) return null;
  return hour * 60 + minute;
}

/**
 * Working hours as minutes from midnight. Accepts "09:00-17:00",
 * "9:00 AM - 5:00 PM" or "9-17". Falls back to 9:00 to 17:00.
 */
export function parseWorkingHours(text?: string | null): { start: number; end: number } {
  const fallback = { start: 9 * 60, end: 17 * 60 };
  if (!text) return fallback;
  const parts = text.split('-');
  if (parts.length !== 2) return fallback;
  const start = parseClock(parts[0]);
  const end = parseClock(parts[1]);
  if (start === null || end === null || end <= start) return fallback;
  return { start, end };
}

export interface DoctorSchedule {
  availableDays?: string[] | null;
  availableHours?: string | null;
  consultationDuration?: number | null;
  isAcceptingPatients?: boolean | null;
}

export interface BookedRange {
  start: Date;
  durationMinutes: number;
}

export interface Slot {
  startTime: Date;
  endTime: Date;
  available: boolean;
}

/** True if the date is within the bookable window starting today. */
export function isBookableDate(dateKey: string, now: Date = new Date()): boolean {
  const today = clinicDateKey(now);
  return dateKey >= today && dateKey <= addDays(today, MAX_BOOKING_DAYS - 1);
}

/** Every slot on one clinic date, with booked and past slots marked unavailable. */
export function buildDaySlots(
  doctor: DoctorSchedule,
  dateKey: string,
  booked: BookedRange[],
  now: Date = new Date()
): Slot[] {
  if (doctor.isAcceptingPatients === false) return [];
  if (!isBookableDate(dateKey, now)) return [];
  const days = doctor.availableDays && doctor.availableDays.length > 0 ? doctor.availableDays : DEFAULT_DAYS;
  if (!days.includes(weekdayOf(dateKey))) return [];

  const { start, end } = parseWorkingHours(doctor.availableHours);
  const duration = doctor.consultationDuration && doctor.consultationDuration > 0 ? doctor.consultationDuration : 30;
  const earliest = now.getTime() + MIN_LEAD_MINUTES * 60_000;

  const slots: Slot[] = [];
  for (let minute = start; minute + duration <= end; minute += duration) {
    const startTime = clinicTime(dateKey, minute);
    const endTime = clinicTime(dateKey, minute + duration);
    const overlaps = booked.some((b) => {
      const bStart = b.start.getTime();
      const bEnd = bStart + b.durationMinutes * 60_000;
      return startTime.getTime() < bEnd && endTime.getTime() > bStart;
    });
    slots.push({ startTime, endTime, available: !overlaps && startTime.getTime() >= earliest });
  }
  return slots;
}
