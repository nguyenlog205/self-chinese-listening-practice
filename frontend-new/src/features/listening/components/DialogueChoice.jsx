import { useEffect, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useSpeakSequence } from "../../../shared/useSpeak";
import { useDialogues } from "../../../shared/useDialogues";

function pickDialogue(pool, excludeId) {
  const candidates = pool.filter((d) => d.id !== excludeId);
  const from = candidates.length > 0 ? candidates : pool;
  return from[Math.floor(Math.random() * from.length)];
}

export default function DialogueChoice() {
  const { t, language } = useLanguage();
  const speakSequence = useSpeakSequence();
  const { dialogues, loading, error } = useDialogues();
  const [dialogue, setDialogue] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    if (dialogues.length > 0 && !dialogue) setDialogue(pickDialogue(dialogues));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogues]);

  const play = () => speakSequence(dialogue.lines.map((l) => l.hanzi));

  const choose = (option) => {
    if (selected) return;
    setSelected(option);
    setScore((s) => ({
      correct: s.correct + (option.correct ? 1 : 0),
      total: s.total + 1,
    }));
  };

  const next = () => {
    setDialogue((d) => pickDialogue(dialogues, d.id));
    setSelected(null);
    setRevealed(false);
  };

  return (
    <div className="listening-panel">
      {loading && <p className="listening-progress-label">{t("common.loading")}</p>}
      {error && <p className="listening-banner">{error}</p>}

      {dialogue && (
        <>
          <div className="listening-card">
            <p className="listening-progress-label">{t("listening.dialogueChoice.hint")}</p>

            <button type="button" className="listening-play-btn" onClick={play}>
              🔊 {t("listening.dialogue.playAll")}
            </button>

            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              className="listening-toggle-btn"
            >
              {revealed ? t("hsk.reading.hideTranslation") : t("listening.dialogue.showScript")}
            </button>

            {revealed && (
              <div className="listening-dialogue-script">
                {dialogue.lines.map((line, i) => (
                  <p key={i}>
                    <strong>{line.speaker}:</strong> {line.hanzi}
                  </p>
                ))}
              </div>
            )}

            <p className="listening-practice-text">
              {language === "en" ? dialogue.question.en : dialogue.question.vi}
            </p>

            <div className="listening-choice-options">
              {dialogue.options.map((option) => {
                const isSelected = selected === option;
                let cls = "listening-choice-option";
                if (selected) {
                  if (option.correct) cls += " correct";
                  else if (isSelected) cls += " incorrect";
                }
                return (
                  <button
                    key={option.en}
                    type="button"
                    className={cls}
                    onClick={() => choose(option)}
                    disabled={!!selected}
                  >
                    {language === "en" ? option.en : option.vi}
                  </button>
                );
              })}
            </div>

            {selected && (
              <button
                type="button"
                className="btn-accent"
                onClick={next}
                style={{ alignSelf: "flex-start" }}
              >
                {t("hsk.common.next")} →
              </button>
            )}
          </div>

          <p className="listening-progress-label">
            {t("hsk.listening.score")}: {score.correct}/{score.total}
          </p>
        </>
      )}
    </div>
  );
}
