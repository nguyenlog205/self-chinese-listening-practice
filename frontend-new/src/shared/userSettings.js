// Local-only user preferences (display name, HSK level, etc.) set on the
// Settings page. Deliberately plain localStorage, not a backend/DB concern —
// this is UI personalization, not learning content.
export const USER_NAME_KEY = "listening-app:user-name";

export function getUserName() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(USER_NAME_KEY) || "";
}
