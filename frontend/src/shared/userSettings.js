// Local-only user preferences (display name, HSK level, exam date, etc.) set
// on the Settings page. Deliberately plain localStorage, not a backend/DB
// concern — this is UI personalization, not learning content.
export const USER_NAME_KEY = "listening-app:user-name";
export const HSK_GOAL_KEY = "listening-app:hsk-level";
export const EXAM_DATE_KEY = "listening-app:exam-date";
export const WORD_GOAL_KEY = "listening-app:daily-goal";
export const SENTENCE_GOAL_KEY = "listening-app:sentence-goal";
export const LEARN_MODE_KEY = "listening-app:learn-mode"; // "all" | "unknown"
export const RANDOM_ORDER_KEY = "listening-app:random-order";

function readKey(key) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(key) || "";
}

export function getUserName() {
  return readKey(USER_NAME_KEY);
}

export function getHskGoal() {
  return readKey(HSK_GOAL_KEY) || "1";
}

// Returns "YYYY-MM-DD" or "" if unset.
export function getExamDate() {
  return readKey(EXAM_DATE_KEY);
}

export function getWordGoal() {
  return parseInt(readKey(WORD_GOAL_KEY), 10) || 10;
}

export function getSentenceGoal() {
  return parseInt(readKey(SENTENCE_GOAL_KEY), 10) || 50;
}

// "unknown" = only practice words not yet marked learned; "all" = every word
// in the level (default, matches pre-existing behavior).
export function getLearnMode() {
  return readKey(LEARN_MODE_KEY) === "unknown" ? "unknown" : "all";
}

// Whether practice components shuffle the word list once per level load
// instead of walking it in its natural (DB) order. Defaults to on since
// that's closest to the ad-hoc Math.random() picking most modes already did.
export function getRandomOrder() {
  const v = readKey(RANDOM_ORDER_KEY);
  return v === "" ? true : v === "true";
}

// Picks the level (from a HSK_LEVELS-shaped array) matching the user's HSK
// goal from Settings, so practice components default to it instead of
// always starting at HSK 1. Falls back to the first level if unset/unknown.
export function resolveHskLevel(levels) {
  const goal = getHskGoal();
  return levels.find((lvl) => String(lvl) === goal) ?? levels[0];
}
