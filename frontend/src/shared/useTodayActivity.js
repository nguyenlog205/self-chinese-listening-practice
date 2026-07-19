import { useEffect, useState } from "react";
import { ActivityApi } from "./activityApi";

export function useTodayActivity() {
  const [state, setState] = useState({ words: 0, sentences: 0, loading: true });

  useEffect(() => {
    let cancelled = false;
    ActivityApi.getToday()
      .then((data) => {
        if (!cancelled) setState({ words: data.words, sentences: data.sentences, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ words: 0, sentences: 0, loading: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
