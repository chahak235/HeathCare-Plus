import { buildDaySlots, parseTimeRanges, parseWorkingHours, hoursForDay, clinicTime, weekdayOf } from '../utils/schedule';

// A fixed "now" well before the dates used, so no slot is in the past
const NOW = new Date('2026-12-01T00:00:00Z');
// 2026-12-07 is a Monday, 2026-12-12 a Saturday
const MONDAY = '2026-12-07';
const SATURDAY = '2026-12-12';

const istMinutes = (d: Date) => ((d.getUTCHours() * 60 + d.getUTCMinutes() + 330) % 1440);

describe('schedule rules', () => {
  it('knows the weekdays used below', () => {
    expect(weekdayOf(MONDAY)).toBe('Monday');
    expect(weekdayOf(SATURDAY)).toBe('Saturday');
  });

  it('reads one or more time ranges', () => {
    expect(parseTimeRanges('9:00-13:00, 14:00-18:00')).toEqual([
      { start: 540, end: 780 },
      { start: 840, end: 1080 },
    ]);
    expect(parseTimeRanges('9:00 AM - 5:00 PM')).toEqual([{ start: 540, end: 1020 }]);
    expect(parseTimeRanges('nonsense')).toEqual([]);
    expect(parseTimeRanges('17:00-9:00')).toEqual([]);
  });

  it('keeps the old single-range format working', () => {
    expect(parseWorkingHours('10:00 AM - 4:00 PM')).toEqual({ start: 600, end: 960 });
    expect(parseWorkingHours(undefined)).toEqual({ start: 540, end: 1020 });
  });

  it('uses usual hours when a day has none of its own', () => {
    const doc = { availableHours: '9:00-17:00', weeklyHours: { Saturday: '9:00-13:00' } };
    expect(hoursForDay(doc, 'Monday')).toEqual([{ start: 540, end: 1020 }]);
    expect(hoursForDay(doc, 'Saturday')).toEqual([{ start: 540, end: 780 }]);
  });

  it('builds slots around a lunch break', () => {
    const slots = buildDaySlots({ availableDays: ['Monday'], availableHours: '9:00-11:00, 12:00-13:00', consultationDuration: 30 }, MONDAY, [], NOW);
    expect(slots.map((s) => istMinutes(s.startTime))).toEqual([540, 570, 600, 630, 720, 750]);
    expect(slots.every((s) => s.available)).toBe(true);
  });

  it('uses the shorter Saturday hours', () => {
    const doc = { availableDays: ['Monday', 'Saturday'], availableHours: '9:00-17:00', weeklyHours: { Saturday: '9:00-10:00' }, consultationDuration: 30 };
    expect(buildDaySlots(doc, SATURDAY, [], NOW)).toHaveLength(2);
    expect(buildDaySlots(doc, MONDAY, [], NOW)).toHaveLength(16);
  });

  it('has no slots on a day off', () => {
    const doc = { availableDays: ['Monday'], availableHours: '9:00-17:00', daysOff: [MONDAY] };
    expect(buildDaySlots(doc, MONDAY, [], NOW)).toEqual([]);
    expect(buildDaySlots(doc, '2026-12-14', [], NOW).length).toBeGreaterThan(0);
  });

  it('has no slots on non-working weekdays or when not accepting patients', () => {
    expect(buildDaySlots({ availableDays: ['Tuesday'] }, MONDAY, [], NOW)).toEqual([]);
    expect(buildDaySlots({ isAcceptingPatients: false }, MONDAY, [], NOW)).toEqual([]);
  });

  it('marks booked slots unavailable', () => {
    const booked = [{ start: clinicTime(MONDAY, 600), durationMinutes: 30 }];
    const slots = buildDaySlots({ availableDays: ['Monday'], availableHours: '9:00-11:00' }, MONDAY, booked, NOW);
    expect(slots.filter((s) => !s.available).map((s) => istMinutes(s.startTime))).toEqual([600]);
  });

  it('does not double-list slots when ranges overlap', () => {
    const slots = buildDaySlots({ availableDays: ['Monday'], availableHours: '9:00-10:00, 9:30-10:30' }, MONDAY, [], NOW);
    expect(slots.map((s) => istMinutes(s.startTime))).toEqual([540, 570, 600]);
  });
});
