export const toIso = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const fromIso = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (iso: string, n: number): string => {
  const d = fromIso(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
};

/** Monday of the week containing `iso`. */
export const weekStart = (iso: string): string => {
  const d = fromIso(iso);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return toIso(d);
};

export const weekDays = (start: string): string[] => Array.from({ length: 7 }, (_, i) => addDays(start, i));

export const today = (): string => toIso(new Date());

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const dayName = (iso: string): string => DAY_NAMES[fromIso(iso).getDay()];
export const shortDate = (iso: string): string => {
  const d = fromIso(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
export const isWeekday = (iso: string): boolean => {
  const g = fromIso(iso).getDay();
  return g >= 1 && g <= 5;
};
