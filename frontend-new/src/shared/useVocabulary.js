import { useEffect, useState } from "react";
import { ContentApi } from "./contentApi";

const cache = new Map();

// Called after ContentApi.refreshContent() succeeds so components refetch
// fresh data on their next render instead of serving stale cached words.
export function clearVocabularyCache() {
  cache.clear();
}

// Fetches (and caches per level, for the lifetime of the tab) the vocabulary
// word list for one HSK level from the backend's content store.
export function useVocabulary(level) {
  const [state, setState] = useState(() => {
    const cached = cache.get(level);
    return cached
      ? { words: cached, loading: false, error: null }
      : { words: [], loading: true, error: null };
  });

  useEffect(() => {
    const cached = cache.get(level);
    if (cached) {
      setState({ words: cached, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ words: [], loading: true, error: null });
    ContentApi.listVocabulary(level)
      .then((words) => {
        cache.set(level, words);
        if (!cancelled) setState({ words, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ words: [], loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [level]);

  return state;
}
