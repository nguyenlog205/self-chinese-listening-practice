// Single shared "now playing" slot so starting any new clip (TTS word,
// TTS dialogue sequence, or a real dialogue recording) stops whatever else
// was playing, regardless of which hook started it.
let current = null;

export function stopAudio() {
  if (current) {
    current.pause();
    current.onended = null;
    current.onerror = null;
    current = null;
  }
}

// Plays one clip, resolving on `ended`, rejecting on `error` (including a
// play() rejection, e.g. a 404) so callers can fall back to something else.
export function playAudio(url) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    current = audio;
    audio.onended = resolve;
    audio.onerror = () => reject(new Error(`Failed to play ${url}`));
    audio.play().catch(reject);
  });
}
