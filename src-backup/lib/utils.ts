const p = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;

export const todayStr = () => fmt(new Date());

export const daysAgoStr = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmt(d);
};

export const dayLabel = (s: string) =>
  new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' });

// Scores show only after this many ratings (10 in a real deployment).
export const MIN_RATINGS = 3;