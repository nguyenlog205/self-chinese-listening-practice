import { apiBase } from "./api";

// Pronunciation audio comes from the backend (edge-tts, cached on disk —
// see backend/listening_backend/tts/), not the browser's Web Speech API:
// the latter depends on a zh-CN voice being installed at the OS/browser
// level, which is often missing on Linux.
let currentAudio = null;

function stopCurrent() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio = null;
  }
}

async function ttsUrl(text) {
  const base = await apiBase();
  return `${base}/api/tts?text=${encodeURIComponent(text)}`;
}

async function playOne(text) {
  const url = await ttsUrl(text);
  const audio = new Audio(url);
  currentAudio = audio;
  await audio.play();
}

export function useSpeak() {
  return (text) => {
    stopCurrent();
    playOne(text).catch(() => {});
  };
}

// Speaks multiple lines back-to-back (e.g. a dialogue) — waits for each
// clip to finish before starting the next, same queued behavior the old
// Web Speech API gave us for free.
export function useSpeakSequence() {
  return (texts) => {
    stopCurrent();

    const playNext = async (i) => {
      if (i >= texts.length) return;
      const url = await ttsUrl(texts[i]);
      const audio = new Audio(url);
      currentAudio = audio;
      await new Promise((resolve) => {
        audio.onended = resolve;
        audio.onerror = resolve;
        audio.play().catch(resolve);
      });
      await playNext(i + 1);
    };

    playNext(0).catch(() => {});
  };
}
