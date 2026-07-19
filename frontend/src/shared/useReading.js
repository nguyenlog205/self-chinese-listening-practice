import { useEffect, useState } from "react";
import { ContentApi } from "./contentApi";

const cache = new Map();

// Called after ContentApi.refreshContent() succeeds so components refetch
// fresh data on their next render instead of serving stale cached passages.
export function clearReadingCache() {
  cache.clear();
}

// Fetches (and caches per level, for the lifetime of the tab) the reading
// passage list for one HSK level from the backend's content store.
export function useReading(level) {
  const [state, setState] = useState(() => {
    const cached = cache.get(level);
    return cached
      ? { passages: cached, loading: false, error: null }
      : { passages: [], loading: true, error: null };
  });

  useEffect(() => {
    const cached = cache.get(level);
    if (cached) {
      setState({ passages: cached, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ passages: [], loading: true, error: null });
    ContentApi.listReading(level)
      .then((passages) => {
        cache.set(level, passages);
        if (!cancelled) setState({ passages, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ passages: [], loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [level]);

  return state;
}
