import { useEffect, useState } from "react";
import { ActivityApi } from "./activityApi";

const EMPTY_STREAK = { current: 0, longest: 0, weekly: [false, false, false, false, false, false, false] };

export function useStreak() {
  const [streak, setStreak] = useState(EMPTY_STREAK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    ActivityApi.getStreak()
      .then((data) => {
        if (!cancelled) setStreak(data);
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

  return { streak, loading, error };
}
