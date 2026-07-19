import { useEffect, useState } from "react";
import { ContentApi, HSK_LEVELS } from "./contentApi";

const cache = new Map();

// Called after ContentApi.refreshContent() succeeds so components refetch
// fresh data on their next render instead of serving stale cached points.
export function clearGrammarCache() {
  cache.clear();
}

function fetchLevel(level) {
  const cached = cache.get(level);
  if (cached) return Promise.resolve(cached);
  return ContentApi.listGrammar(level).then((points) => {
    cache.set(level, points);
    return points;
  });
}

// Fetches (and caches per level, for the lifetime of the tab) the grammar
// point list for one HSK level from the backend's content store.
export function useGrammar(level) {
  const [state, setState] = useState(() => {
    const cached = cache.get(level);
    return cached
      ? { points: cached, loading: false, error: null }
      : { points: [], loading: true, error: null };
  });

  useEffect(() => {
    const cached = cache.get(level);
    if (cached) {
      setState({ points: cached, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ points: [], loading: true, error: null });
    fetchLevel(level)
      .then((points) => {
        if (!cancelled) setState({ points, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ points: [], loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [level]);

  return state;
}

// Fetches every HSK level's grammar points in parallel, sharing the same
// per-level cache as useGrammar -- used where a total across all levels is
// needed (PersonalPage's overview stats) without re-fetching what a
// per-level Grammar/ProgressByLevel view already cached.
export function useAllGrammarLevels() {
  const [state, setState] = useState({ byLevel: {}, loading: true });

  useEffect(() => {
    let cancelled = false;
    Promise.all(HSK_LEVELS.map((level) => fetchLevel(level).then((points) => [level, points])))
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
