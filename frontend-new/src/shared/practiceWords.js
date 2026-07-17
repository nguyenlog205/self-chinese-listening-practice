// Fisher-Yates — returns a new shuffled array, doesn't mutate the input.
export function shuffle(arr) {
  const result = arr.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Applies the "chỉ từ chưa biết"/"toàn bộ" learn mode and the random-order
// setting to a raw vocabulary list, once (per level load / setting change)
// rather than per-round — so practice components can walk the result
// sequentially by index and still get randomized, non-repeating order when
// randomOrder is on.
export function selectPracticeWords(words, { learned, learnMode, randomOrder }) {
  const pool = learnMode === "unknown" ? words.filter((w) => !learned.has(w.hanzi)) : words;
  return randomOrder ? shuffle(pool) : pool;
}
