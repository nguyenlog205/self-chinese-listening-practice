import { ContentApi } from "./contentApi";
import { useSpeakSequence } from "./useSpeak";
import { playAudio, stopAudio } from "./audioPlayer";

// Plays the real recording for a dialogue (see backend
// seed_data/dialogues_audio/README.md) when one exists; falls back to TTS
// (line-by-line) when it doesn't — most dialogues won't have a recording
// yet, and that's fine, this just upgrades silently once one is added.
export function useDialogueAudio() {
  const speakSequence = useSpeakSequence();

  return (dialogue) => {
    stopAudio();
    (async () => {
      const url = await ContentApi.dialogueAudioUrl(dialogue.id);
      try {
        await playAudio(url);
      } catch {
        speakSequence(dialogue.lines.map((l) => l.hanzi));
      }
    })();
  };
}
