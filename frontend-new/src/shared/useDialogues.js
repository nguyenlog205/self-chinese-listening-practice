import { useEffect, useState } from "react";
import { ContentApi } from "./contentApi";

let cache = null;

// Called after ContentApi.refreshContent() succeeds so components refetch
// fresh data on their next render instead of serving stale cached dialogues.
export function clearDialoguesCache() {
  cache = null;
}

// Fetches (and caches for the lifetime of the tab) the full dialogue pool
// from the backend's content store.
export function useDialogues() {
  const [state, setState] = useState(() =>
    cache
      ? { dialogues: cache, loading: false, error: null }
      : { dialogues: [], loading: true, error: null }
  );

  useEffect(() => {
    if (cache) {
      setState({ dialogues: cache, loading: false, error: null });
      return;
    }
    let cancelled = false;
    ContentApi.listDialogues()
      .then((dialogues) => {
        cache = dialogues;
        if (!cancelled) setState({ dialogues, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ dialogues: [], loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
