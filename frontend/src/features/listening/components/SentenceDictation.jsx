import { useMemo, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { usePreferences } from "../../../shared/PreferencesContext";
import { useDialogues } from "../../../shared/useDialogues";
import { useSpeak } from "../../../shared/useSpeak";
import { ActivityApi } from "../../../shared/activityApi";
import { toDisplayHanzi, toDisplayPhonetic } from "../../../shared/chineseText";
import { alignedDiff, isDictationCorrect } from "../../../shared/dictationCheck";
import SpeakerIcon from "../../../shared/SpeakerIcon";

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

  const diff = useMemo(() => {
    if (!current || !result) return [];
    return alignedDiff(input, toDisplayHanzi(current.hanzi, scriptMode));
  }, [current, result, input, scriptMode]);

  const checkAnswer = () => {
    if (!current) return;
    const isCorrect = isDictationCorrect(input, toDisplayHanzi(current.hanzi, scriptMode));
    setResult(isCorrect ? "correct" : "incorrect");
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
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
              <SpeakerIcon /> {t("hsk.common.play")}
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
                <p className="listening-practice-text" style={{ marginTop: 8 }}>
                  {diff.map((d, i) => (
                    <span key={i} style={{ color: d.ok ? "var(--accent-2)" : "var(--accent)" }}>
                      {d.ok ? d.ch : "*"}
                    </span>
                  ))}
                </p>
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
