import { useEffect, useState } from "react";

// Reading passages are backend content but have no server-side progress
// concept (see backend.md) -- "read" status is tracked purely client-side
// in localStorage, same module-level cache + subscriber pattern as
// useGrammarProgress.js.
const STORAGE_KEY = "listening-app:reading-learned";

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

export function useReadingProgress() {
  if (cache === null) cache = readStored();
  const [learned, setLearned] = useState(cache);

  useEffect(() => {
    listeners.add(setLearned);
    return () => listeners.delete(setLearned);
  }, []);

  const toggleLearned = (id) => {
    cache = new Set(cache);
    if (cache.has(id)) cache.delete(id);
    else cache.add(id);
    persist(cache);
    notify();
  };

  return { learned, toggleLearned };
}
