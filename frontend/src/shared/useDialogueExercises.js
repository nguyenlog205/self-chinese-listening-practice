import { useEffect, useState } from "react";
import { ContentApi } from "./contentApi";

const cacheByKind = {};

// Mirrors useDialogues.js's caching, keyed by kind ("choice" | "cloze" |
// "dictation") since each kind is fetched from its own table.
export function clearDialogueExercisesCache() {
  for (const key of Object.keys(cacheByKind)) delete cacheByKind[key];
}

// Fetches (and caches for the lifetime of the tab) all exercises of one
// kind. Each exercise carries its own audio_id -- join against
// useDialogues()'s pool by id to get that exercise's lines.
export function useDialogueExercises(kind) {
  const [state, setState] = useState(() =>
    cacheByKind[kind]
      ? { exercises: cacheByKind[kind], loading: false, error: null }
      : { exercises: [], loading: true, error: null }
  );

  useEffect(() => {
    if (cacheByKind[kind]) {
      setState({ exercises: cacheByKind[kind], loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ exercises: [], loading: true, error: null });
    ContentApi.listDialogueExercises(kind)
      .then((exercises) => {
        cacheByKind[kind] = exercises;
        if (!cancelled) setState({ exercises, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ exercises: [], loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [kind]);

  return state;
}
