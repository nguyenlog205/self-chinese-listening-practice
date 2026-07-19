import { useEffect, useState } from "react";
import { ActivityApi } from "./activityApi";

export function useDailyActivity(days = 182) {
  const [state, setState] = useState({ days: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState({ days: [], loading: true, error: null });
    ActivityApi.getDaily(days)
      .then((data) => {
        if (!cancelled) setState({ days: data, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ days: [], loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  return state;
}
