import { useMemo, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { usePreferences } from "../../../shared/PreferencesContext";
import { useDialogues } from "../../../shared/useDialogues";
import { useSpeak } from "../../../shared/useSpeak";
import { logSentencePractice } from "../../../shared/localProgress";
import { ActivityApi } from "../../../shared/activityApi";
import { toDisplayHanzi, toDisplayPhonetic } from "../../../shared/chineseText";

// Pool of practice sentences is every line from every dialogue — same
// source DialogueChoice/DialogueCloze draw from, just flattened instead of
// grouped by dialogue.
function flattenSentences(dialogues) {
  return dialogues.flatMap((d) =>
    d.lines.map((line, lineIndex) => ({ ...line, dialogueId: d.id, lineIndex, level: d.level }))
  );
}

export default function SentenceDictation() {
  const { t } = useLanguage();
  const { showPinyin, scriptMode, phoneticMode } = usePreferences();
  const speak = useSpeak();
  const { dialogues, loading, error } = useDialogues();
  const sentences = useMemo(() => flattenSentences(dialogues), [dialogues]);

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const current = sentences.length > 0 ? sentences[index % sentences.length] : null;

  const checkAnswer = () => {
    if (!current) return;
    const isCorrect = input.trim() === current.hanzi;
    setResult(isCorrect ? "correct" : "incorrect");
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
    logSentencePractice();
    ActivityApi.logEvent({
      mode: "sentence_dictation",
      item_type: "dialogue_line",
      item_id: `${current.dialogueId}:${current.lineIndex}`,
      level: current.level != null ? String(current.level) : null,
      is_correct: isCorrect,
    });
  };

  const next = () => {
    setIndex((i) => i + 1);
    setInput("");
    setResult(null);
    setRevealed(false);
  };

  return (
    <div className="listening-panel">
      {loading && <p className="listening-progress-label">{t("common.loading")}</p>}
      {error && <p className="listening-banner">{error}</p>}
      {!loading && !error && sentences.length === 0 && (
        <p className="listening-banner">{t("listening.sentenceDictation.empty")}</p>
      )}

      {current && (
        <>
          <div className="listening-card">
            <p className="listening-progress-label">{t("listening.sentenceDictation.hint")}</p>

            <button type="button" className="listening-play-btn" onClick={() => speak(current.hanzi)}>
              🔊 {t("hsk.common.play")}
            </button>

            <div className="listening-toggle-row" style={{ gap: 10 }}>
              <input
                type="text"
                className="listening-search"
                placeholder={t("hsk.listening.inputPlaceholder")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
              />
              <button type="button" className="btn-accent" onClick={checkAnswer}>
                {t("hsk.common.check")}
              </button>
            </div>

            {result && (
              <div className={`listening-result listening-result-${result}`}>
                {result === "correct" ? t("hsk.common.correct") : t("hsk.common.incorrect")}
                {result === "incorrect" && (
                  <span className="listening-result-answer"> — {toDisplayHanzi(current.hanzi, scriptMode)}</span>
                )}
              </div>
            )}

            <div className="listening-footer">
              <button type="button" onClick={() => setRevealed((r) => !r)}>
                {revealed ? t("hsk.listening.hideHint") : t("hsk.listening.showHint")}
              </button>
              <button type="button" onClick={next}>
                {t("hsk.common.next")} →
              </button>
            </div>

            {revealed && showPinyin && (
              <p className="listening-progress-label">{toDisplayPhonetic(current.pinyin, phoneticMode)}</p>
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
