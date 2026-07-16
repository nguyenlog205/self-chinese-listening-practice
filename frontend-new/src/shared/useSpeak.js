function makeUtterance(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.9;
  return utterance;
}

export function useSpeak() {
  const speak = (text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(makeUtterance(text));
  };
  return speak;
}

// Speaks multiple lines back-to-back (e.g. a dialogue). The Web Speech API
// queues utterances that are enqueued without an intervening `cancel()`, so
// this just cancels once up front and queues the rest.
export function useSpeakSequence() {
  const speakSequence = (texts) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    texts.forEach((text) => window.speechSynthesis.speak(makeUtterance(text)));
  };
  return speakSequence;
}
