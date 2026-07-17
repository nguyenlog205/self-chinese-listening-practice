// Local, session-persistent counters for "how many words/sentences has the
// user practiced" — a stand-in for the real practice_events log described in
// docs/activity-tracking-plan.md. The call sites here (checkAnswer/choose/
// check for word-level modes; choose/check/checkDictation+goTo for
// sentence-level modes) are exactly the ones that plan documents for
// ActivityApi.logEvent — swap these two functions' bodies for that call
// once the backend exists, no call-site changes needed.
const WORDS_KEY = "listening-app:progress-words";
const SENTENCES_KEY = "listening-app:progress-sentences";

function readCount(key) {
  if (typeof window === "undefined") return 0;
  return parseInt(window.localStorage.getItem(key), 10) || 0;
}

function bump(key) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, String(readCount(key) + 1));
}

export function logWordPractice() {
  bump(WORDS_KEY);
}

export function logSentencePractice() {
  bump(SENTENCES_KEY);
}

export function getWordsDone() {
  return readCount(WORDS_KEY);
}

export function getSentencesDone() {
  return readCount(SENTENCES_KEY);
}

export function resetLocalProgress() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(WORDS_KEY);
  window.localStorage.removeItem(SENTENCES_KEY);
}
