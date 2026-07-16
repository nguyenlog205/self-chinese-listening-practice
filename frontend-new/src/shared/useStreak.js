// Placeholder streak data until the backend exposes a real endpoint (e.g.
// GET /api/streak). Swap the body of this hook for a fetch call later —
// callers (StreakCard) only depend on the returned shape, not the source.
const MOCK_STREAK = {
  current: 5,
  longest: 12,
  weekly: [true, true, true, false, true, true, false],
};

export function useStreak() {
  return { streak: MOCK_STREAK, loading: false, error: null };
}
