import { useEffect, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { usePreferences } from "../../../shared/PreferencesContext";
import { useDialogueAudio } from "../../../shared/useDialogueAudio";
import { useDialogues } from "../../../shared/useDialogues";
import { logSentencePractice } from "../../../shared/localProgress";
import { ActivityApi } from "../../../shared/activityApi";
import { toDisplayHanzi } from "../../../shared/chineseText";

function pickDialogue(pool, excludeId) {
  const candidates = pool.filter((d) => d.id !== excludeId);
  const from = candidates.length > 0 ? candidates : pool;
  return from[Math.floor(Math.random() * from.length)];
}

function blankFor(dialogue, lineIndex) {
  return dialogue.blanks.find((b) => b.lineIndex === lineIndex);
}

export default function DialogueCloze() {
  const { t } = useLanguage();
  const { scriptMode } = usePreferences();
  const playDialogue = useDialogueAudio();
  const { dialogues, loading, error } = useDialogues();
  const [dialogue, setDialogue] = useState(null);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (dialogues.length > 0 && !dialogue) setDialogue(pickDialogue(dialogues));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogues]);

  const play = () => playDialogue(dialogue);

  const setAnswer = (lineIndex, value) => {
    setAnswers((a) => ({ ...a, [lineIndex]: value }));
  };

  const allFilled =
    !!dialogue && dialogue.blanks.every((b) => (answers[b.lineIndex] || "").trim().length > 0);

  const check = () => {
    setChecked(true);
    logSentencePractice();
    const isCorrect = dialogue.blanks.every(
      (b) => (answers[b.lineIndex] || "").trim() === b.answer
    );
    ActivityApi.logEvent({
      mode: "dialogue_cloze",
      item_type: "dialogue",
      item_id: dialogue.id,
      level: null,
      is_correct: isCorrect,
    });
  };

  const next = () => {
    setDialogue((d) => pickDialogue(dialogues, d.id));
    setAnswers({});
    setChecked(false);
  };

  const allCorrect =
    checked &&
    !!dialogue &&
    dialogue.blanks.every((b) => (answers[b.lineIndex] || "").trim() === b.answer);

  return (
    <div className="listening-panel">
      {loading && <p className="listening-progress-label">{t("common.loading")}</p>}
      {error && <p className="listening-banner">{error}</p>}

      {dialogue && (
        <div className="listening-card">
          <p className="listening-progress-label">{t("listening.dialogueCloze.hint")}</p>

          <button type="button" className="listening-play-btn" onClick={play}>
            🔊 {t("listening.dialogue.playAll")}
          </button>

          <div className="listening-dialogue-script">
            {dialogue.lines.map((line, i) => {
              const blank = blankFor(dialogue, i);
              if (!blank) {
                return (
                  <p key={i}>
                    <strong>{line.speaker}:</strong> {toDisplayHanzi(line.hanzi, scriptMode)}
                  </p>
                );
              }
              // Convert the whole line first, then slice by the original
              // (length-preserving 1:1) indices — converting `before`/`after`
              // as isolated fragments would drop the neighboring context that
              // some characters need to pick the right variant (e.g. 以后
              // -> 以後, but a cut right after 以 would isolate 后 and could
              // mis-convert it).
              const blankStart = line.hanzi.indexOf(blank.answer);
              const displayLine = toDisplayHanzi(line.hanzi, scriptMode);
              const before = displayLine.slice(0, blankStart);
              const after = displayLine.slice(blankStart + blank.answer.length);
              const isCorrect = checked && (answers[i] || "").trim() === blank.answer;
              const inputCls = checked ? (isCorrect ? " correct" : " incorrect") : "";
              return (
                <p key={i}>
                  <strong>{line.speaker}:</strong> {before}
                  <input
                    type="text"
                    className={`listening-cloze-input${inputCls}`}
                    value={answers[i] || ""}
                    onChange={(e) => setAnswer(i, e.target.value)}
                    disabled={checked}
                    style={{ width: `${Math.max(3, blank.answer.length + 1)}em` }}
                  />
                  {after}
                </p>
              );
            })}
          </div>

          {checked && (
            <div
              className={`listening-result listening-result-${allCorrect ? "correct" : "incorrect"}`}
            >
              {allCorrect ? t("hsk.common.correct") : t("hsk.common.incorrect")}
            </div>
          )}

          <div className="listening-footer">
            {checked ? (
              <button type="button" className="btn-accent" onClick={next}>
                {t("hsk.common.next")} →
              </button>
            ) : (
              <button type="button" className="btn-accent" onClick={check} disabled={!allFilled}>
                {t("hsk.common.check")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
