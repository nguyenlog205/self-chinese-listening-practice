import { useEffect, useState } from "react";
import { ContentApi, HSK_LEVELS } from "./contentApi";

const cache = new Map();

// Called after ContentApi.refreshContent() succeeds so components refetch
// fresh data on their next render instead of serving stale cached passages.
export function clearReadingCache() {
  cache.clear();
}

function fetchLevel(level) {
  const cached = cache.get(level);
  if (cached) return Promise.resolve(cached);
  return ContentApi.listReading(level).then((passages) => {
    cache.set(level, passages);
    return passages;
  });
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
    fetchLevel(level)
      .then((passages) => {
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

// Fetches every HSK level's reading passages in parallel, sharing the same
// per-level cache as useReading -- used where a total across all levels is
// needed (PersonalPage's overview stats) without re-fetching what a
// per-level Reading view already cached.
export function useAllReadingLevels() {
  const [state, setState] = useState({ byLevel: {}, loading: true });

  useEffect(() => {
    let cancelled = false;
    Promise.all(HSK_LEVELS.map((level) => fetchLevel(level).then((passages) => [level, passages])))
      .then((pairs) => {
        if (cancelled) return;
        setState({ byLevel: Object.fromEntries(pairs), loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ byLevel: {}, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
