import { useEffect, useState } from "react";
import { ContentApi } from "./contentApi";

// Module-level cache + subscriber list, same shape as useVocabulary.js's
// per-level cache, but shared across the whole app (not keyed by level)
// since "learned" status needs to be visible everywhere at once: mark a
// word learned in Vocabulary.jsx, and ChoiceListening/OrderListening/etc.
// (mounted later, after a route change) must see it immediately.
let cache = null; // Set<hanzi> | null
let loadPromise = null;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(cache));
}

// Called after a "xoá toàn bộ tiến trình" reset so any mounted component
// stops showing stale learned-words immediately, without needing a reload
// (a reload happens anyway at the reset call site, but this keeps the
// module usable standalone too).
export function clearVocabProgressCache() {
  cache = new Set();
  loadPromise = null;
  notify();
}

function ensureLoaded() {
  if (cache) return Promise.resolve(cache);
  if (!loadPromise) {
    loadPromise = ContentApi.getProgress()
      .then((rows) => {
        cache = new Set(rows.map((r) => r.hanzi));
        notify();
        return cache;
      })
      .catch(() => {
        cache = new Set();
        notify();
        return cache;
      });
  }
  return loadPromise;
}

export function useVocabProgress() {
  const [learned, setLearned] = useState(cache ?? new Set());

  useEffect(() => {
    listeners.add(setLearned);
    ensureLoaded();
    return () => listeners.delete(setLearned);
  }, []);

  const markLearned = (hanzi, level) => {
    cache = new Set(cache ?? []);
    cache.add(hanzi);
    notify();
    ContentApi.markLearned(hanzi, level).catch(() => {});
  };

  const unmarkLearned = (hanzi) => {
    cache = new Set(cache ?? []);
    cache.delete(hanzi);
    notify();
    ContentApi.unmarkLearned(hanzi).catch(() => {});
  };

  const toggleLearned = (hanzi, level) => {
    if ((cache ?? learned).has(hanzi)) unmarkLearned(hanzi);
    else markLearned(hanzi, level);
  };

  return { learned, toggleLearned };
}
