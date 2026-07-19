import { useEffect, useState } from "react";

// Grammar points are static local data (unlike vocabulary), so "known"
// status is tracked purely client-side in localStorage -- no backend sync
// needed. Same module-level cache + subscriber pattern as
// useVocabProgress.js so every mounted Grammar view stays in sync.
const STORAGE_KEY = "listening-app:grammar-known";

function readStored() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function persist(set) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

let cache = null;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(cache));
}

export function useGrammarProgress() {
  if (cache === null) cache = readStored();
  const [known, setKnown] = useState(cache);

  useEffect(() => {
    listeners.add(setKnown);
    return () => listeners.delete(setKnown);
  }, []);

  const toggleKnown = (id) => {
    cache = new Set(cache);
    if (cache.has(id)) cache.delete(id);
    else cache.add(id);
    persist(cache);
    notify();
  };

  return { known, toggleKnown };
}
