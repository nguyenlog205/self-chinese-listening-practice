import { apiBase } from "./api";
import { playAudio, stopAudio } from "./audioPlayer";

// Pronunciation audio comes from the backend (edge-tts, cached on disk —
// see backend/listening_backend/tts/), not the browser's Web Speech API:
// the latter depends on a zh-CN voice being installed at the OS/browser
// level, which is often missing on Linux.
async function ttsUrl(text) {
  const base = await apiBase();
  return `${base}/api/tts?text=${encodeURIComponent(text)}`;
}

export function useSpeak() {
  return (text) => {
    stopAudio();
    ttsUrl(text)
      .then(playAudio)
      .catch(() => {});
  };
}

// Speaks multiple lines back-to-back (e.g. a dialogue) — waits for each
// clip to finish before starting the next, same queued behavior the old
// Web Speech API gave us for free. A clip that fails to play is skipped
// (not fatal) so one bad line doesn't stall the rest of the sequence.
export function useSpeakSequence() {
  return (texts) => {
    stopAudio();

    const playNext = async (i) => {
      if (i >= texts.length) return;
      const url = await ttsUrl(texts[i]);
      await playAudio(url).catch(() => {});
      await playNext(i + 1);
    };

    playNext(0).catch(() => {});
  };
}
