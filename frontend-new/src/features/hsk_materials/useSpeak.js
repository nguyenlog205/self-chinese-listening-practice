export function useSpeak() {
  const speak = (text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };
  return speak;
}
