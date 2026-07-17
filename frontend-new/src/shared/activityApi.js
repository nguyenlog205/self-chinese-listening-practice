import { apiFetch } from "./api";

export const ActivityApi = {
  logEvent: (event) =>
    apiFetch("/api/activity/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch(() => {}), // best-effort — lỗi log không được làm hỏng trải nghiệm học
  getDaily: (days = 182) => apiFetch(`/api/activity/daily?days=${days}`),
  getStreak: () => apiFetch("/api/streak"),
  resetActivity: () => apiFetch("/api/activity/events", { method: "DELETE" }),
};
