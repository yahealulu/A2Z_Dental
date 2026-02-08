/**
 * Generates half-hour appointment slots based on clinic working hours and days.
 * Excludes holidays. Used for appointment booking.
 */

export interface TimeSlot {
  time: string; // "HH:mm"
  label?: string;
}

// Arabic day names to JS weekday (0=Sunday ... 6=Saturday)
const ARABIC_DAY_TO_WEEKDAY: Record<string, number> = {
  'الأحد': 0,
  'الاثنين': 1,
  'الثلاثاء': 2,
  'الأربعاء': 3,
  'الخميس': 4,
  'الجمعة': 5,
  'السبت': 6
};

/**
 * Parse "HH:mm" to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Minutes since midnight to "HH:mm"
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Get weekday for a date string YYYY-MM-DD (0=Sunday)
 */
function getWeekday(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00');
  return d.getDay();
}

/**
 * Check if date is in holidays list (YYYY-MM-DD)
 */
export function isHoliday(dateStr: string, holidays: string[]): boolean {
  return holidays.includes(dateStr);
}

/**
 * Check if date is a working day (day name in workingDays and not holiday)
 */
export function isWorkingDate(
  dateStr: string,
  workingDays: string[],
  holidays: string[]
): boolean {
  if (isHoliday(dateStr, holidays)) return false;
  const weekday = getWeekday(dateStr);
  const dayNames = Object.keys(ARABIC_DAY_TO_WEEKDAY);
  const dayName = dayNames.find(d => ARABIC_DAY_TO_WEEKDAY[d] === weekday);
  return dayName ? workingDays.includes(dayName) : false;
}

/**
 * Generate half-hour slots for a given date.
 * Returns empty array if date is not a working day or is a holiday.
 */
export function getSlotsForDate(
  dateStr: string,
  workingHours: { start: string; end: string },
  workingDays: string[],
  holidays: string[],
  slotDurationMinutes: number = 30
): TimeSlot[] {
  if (!isWorkingDate(dateStr, workingDays, holidays)) {
    return [];
  }

  const startMin = timeToMinutes(workingHours.start);
  const endMin = timeToMinutes(workingHours.end);
  const slots: TimeSlot[] = [];

  for (let m = startMin; m < endMin; m += slotDurationMinutes) {
    slots.push({
      time: minutesToTime(m),
      label: minutesToTime(m)
    });
  }

  return slots;
}

/**
 * Get all dates in a week that are working days (not holidays)
 */
export function getWorkingDatesInWeek(
  weekStartDate: string, // YYYY-MM-DD
  workingDays: string[],
  holidays: string[]
): string[] {
  const result: string[] = [];
  const start = new Date(weekStartDate + 'T12:00:00');

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const y = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${month}-${day}`;
    if (isWorkingDate(dateStr, workingDays, holidays)) {
      result.push(dateStr);
    }
  }

  return result;
}
