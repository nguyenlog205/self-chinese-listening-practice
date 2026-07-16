import { apiFetch } from "./api";

// Client for the backend's centralized learning-content store (vocabulary +
// dialogues), shared by the HSK and Luyện nghe features so neither bundles
// this data statically.
export const ContentApi = {
  listVocabularyLevels: () => apiFetch("/api/vocabulary/levels"),
  listVocabulary: (level) => apiFetch(`/api/vocabulary?level=${encodeURIComponent(level)}`),
  listDialogues: (level) =>
    apiFetch(`/api/dialogues${level ? `?level=${encodeURIComponent(level)}` : ""}`),
  // Re-downloads vocabulary/dialogues from the seed_data JSON on GitHub and
  // replaces the backend's tables. Returns { vocabulary: {level: count}, dialogues: count }.
  refreshContent: () => apiFetch("/api/content/refresh", { method: "POST" }),
};

export const HSK_LEVELS = [1, 2, 3, 4, 5, 6, "7-9"];
