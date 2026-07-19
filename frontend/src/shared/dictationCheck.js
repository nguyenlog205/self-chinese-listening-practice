// Shared grading/diff logic for every free-text dictation mode (word or
// sentence level). Two rules apply everywhere: punctuation is never graded
// (chữ đúng là đủ, dấu câu không quan trọng), and per-character feedback is
// computed via LCS alignment rather than same-index comparison, so a single
// missed/extra character doesn't cascade into every character after it
// reading as wrong.
const PUNCTUATION_RE = /[，。！？、；：""''（）《》…—「」『』\-,.!?;:"'()\s]/g;

export function stripPunctuation(text) {
  return (text || "").replace(PUNCTUATION_RE, "");
}

export function isDictationCorrect(guess, target) {
  return stripPunctuation(guess) === stripPunctuation(target);
}

// Returns the target's hanzi characters (punctuation stripped) each marked
// `ok: true` if it's present, in order, in the user's guess.
export function alignedDiff(guess, target) {
  const g = Array.from(stripPunctuation(guess));
  const t = Array.from(stripPunctuation(target));
  const m = g.length;
  const n = t.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        g[i - 1] === t[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const matched = new Array(n).fill(false);
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (g[i - 1] === t[j - 1]) {
      matched[j - 1] = true;
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return t.map((ch, idx) => ({ ch, ok: matched[idx] }));
}
