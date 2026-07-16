import { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useSpeakSequence } from "../../../shared/useSpeak";
import DIALOGUES from "../data/dialogues";

function pickDialogue(excludeId) {
  const pool = DIALOGUES.filter((d) => d.id !== excludeId);
  const from = pool.length > 0 ? pool : DIALOGUES;
  return from[Math.floor(Math.random() * from.length)];
}

function blankFor(dialogue, lineIndex) {
  return dialogue.blanks.find((b) => b.lineIndex === lineIndex);
}

export default function DialogueCloze() {
  const { t } = useLanguage();
  const speakSequence = useSpeakSequence();
  const [dialogue, setDialogue] = useState(() => pickDialogue());
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);

  const play = () => speakSequence(dialogue.lines.map((l) => l.hanzi));

  const setAnswer = (lineIndex, value) => {
    setAnswers((a) => ({ ...a, [lineIndex]: value }));
  };

  const allFilled = dialogue.blanks.every((b) => (answers[b.lineIndex] || "").trim().length > 0);

  const check = () => setChecked(true);

  const next = () => {
    setDialogue((d) => pickDialogue(d.id));
    setAnswers({});
    setChecked(false);
  };

  const allCorrect =
    checked && dialogue.blanks.every((b) => (answers[b.lineIndex] || "").trim() === b.answer);

  return (
    <div className="listening-panel">
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
                  <strong>{line.speaker}:</strong> {line.hanzi}
                </p>
              );
            }
            const blankStart = line.hanzi.indexOf(blank.answer);
            const before = line.hanzi.slice(0, blankStart);
            const after = line.hanzi.slice(blankStart + blank.answer.length);
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
          <div className={`listening-result listening-result-${allCorrect ? "correct" : "incorrect"}`}>
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
    </div>
  );
}
