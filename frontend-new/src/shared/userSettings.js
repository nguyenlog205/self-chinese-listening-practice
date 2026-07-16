// Local-only user preferences (display name, HSK level, exam date, etc.) set
// on the Settings page. Deliberately plain localStorage, not a backend/DB
// concern — this is UI personalization, not learning content.
export const USER_NAME_KEY = "listening-app:user-name";
export const HSK_GOAL_KEY = "listening-app:hsk-level";
export const EXAM_DATE_KEY = "listening-app:exam-date";

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
