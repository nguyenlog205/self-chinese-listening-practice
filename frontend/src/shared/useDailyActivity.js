import { useEffect, useState } from "react";
import { ActivityApi } from "./activityApi";

const DAYS = 182; // ~26 weeks (half a year), GitHub-style contribution graph

export function useDailyActivity() {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    ActivityApi.getDaily(DAYS)
      .then((data) => {
        if (!cancelled) setDays(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { days, loading, error };
}
