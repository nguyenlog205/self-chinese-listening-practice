import { apiBase, apiFetch } from "./api";

// Client for the backend's centralized learning-content store (vocabulary +
// dialogues), shared by the HSK and Luyện nghe features so neither bundles
// this data statically.
export const ContentApi = {
  listVocabularyLevels: () => apiFetch("/api/vocabulary/levels"),
  listVocabulary: (level) => apiFetch(`/api/vocabulary?level=${encodeURIComponent(level)}`),
  listGrammar: (level) => apiFetch(`/api/grammar?level=${encodeURIComponent(level)}`),
  listReading: (level) => apiFetch(`/api/reading?level=${encodeURIComponent(level)}`),
  listDialogues: (level) =>
    apiFetch(`/api/dialogues${level ? `?level=${encodeURIComponent(level)}` : ""}`),
  // Exercises are stored independently of dialogues (kind: choice/cloze/
  // dictation) and joined only through audio_id, so the same audio can back
  // multiple exercises. See content/exercises_router.py.
  listDialogueExercises: (kind, level) =>
    apiFetch(
      `/api/dialogue-exercises/${kind}${level ? `?level=${encodeURIComponent(level)}` : ""}`
    ),
  // Re-downloads vocabulary/dialogues from the seed_data JSON on GitHub and
  // replaces the backend's tables. Returns { vocabulary: {level: count}, dialogues: count }.
  refreshContent: () => apiFetch("/api/content/refresh", { method: "POST" }),
  // Persisted "marked learned" vocab, backing the "chỉ từ chưa biết" learn mode.
  getProgress: () => apiFetch("/api/vocabulary/progress"),
  markLearned: (hanzi, level) =>
    apiFetch("/api/vocabulary/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hanzi, level: String(level) }),
    }),
  unmarkLearned: (hanzi) =>
    apiFetch(`/api/vocabulary/progress/${encodeURIComponent(hanzi)}`, { method: "DELETE" }),
  resetVocabProgress: () => apiFetch("/api/vocabulary/progress", { method: "DELETE" }),
  // Real-recording audio for a dialogue (falls back to TTS on the frontend
  // if this 404s — most dialogues won't have a recording yet).
  dialogueAudioUrl: async (id) =>
    `${await apiBase()}/api/dialogues/${encodeURIComponent(id)}/audio`,
};

export const HSK_LEVELS = [1, 2, 3, 4, 5, 6, "7-9"];
