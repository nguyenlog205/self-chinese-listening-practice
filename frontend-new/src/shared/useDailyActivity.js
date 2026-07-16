import { useMemo } from "react";

// Placeholder daily activity data until the backend tracks real practice
// sessions (e.g. GET /api/activity?days=182 returning [{date, count}]).
// Swap the body of this hook for a fetch call later — callers
// (DailyActivityChart) only depend on the returned shape.
const DAYS = 182; // ~26 weeks (half a year), GitHub-style contribution graph

function seededCount(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }
  const bucket = hash % 10;
  if (bucket < 3) return 0; // rest day
  if (bucket < 6) return (hash % 4) + 1; // light day
  return (hash % 10) + 5; // solid day
}

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

export function useDailyActivity() {
  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (DAYS - 1 - i));
      const date = toDateStr(d);
      return { date, count: seededCount(date) };
    });
  }, []);

  return { days, loading: false, error: null };
}
