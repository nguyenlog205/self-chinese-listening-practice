import { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { HSK_LEVELS, VOCABULARY } from "../../hsk_materials/data/hskData";
import { useSpeak } from "../../../shared/useSpeak";

export default function DictationPractice() {
  const { t, language } = useLanguage();
  const speak = useSpeak();
  const [level, setLevel] = useState(HSK_LEVELS[0]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const words = VOCABULARY[level];
  const current = words[index];

  const changeLevel = (lvl) => {
    setLevel(lvl);
    setIndex(0);
    setInput("");
    setResult(null);
    setRevealed(false);
    setScore({ correct: 0, total: 0 });
  };

  const checkAnswer = () => {
    const isCorrect = input.trim() === current.hanzi;
    setResult(isCorrect ? "correct" : "incorrect");
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
  };

  const next = () => {
    setIndex((i) => (i + 1) % words.length);
    setInput("");
    setResult(null);
    setRevealed(false);
  };

  return (
    <div className="listening-panel">
      <div className="listening-level-row">
        {HSK_LEVELS.map((lvl) => (
          <button
            key={lvl}
            className={`listening-level-chip${lvl === level ? " active" : ""}`}
            onClick={() => changeLevel(lvl)}
            type="button"
          >
            HSK {lvl}
          </button>
        ))}
      </div>

      <div className="listening-card">
        <p className="listening-progress-label">{t("listening.dictation.hint")}</p>

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
              <span className="listening-result-answer">
                {" "}
                — {current.hanzi} ({current.pinyin})
              </span>
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

        {revealed && (
          <p className="listening-progress-label">
            {current.pinyin} · {language === "en" ? current.en : current.vi}
          </p>
        )}
      </div>

      <p className="listening-progress-label">
        {t("hsk.listening.score")}: {score.correct}/{score.total} · {index + 1}/{words.length}
      </p>
    </div>
  );
}
