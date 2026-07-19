import { useMemo, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { usePreferences } from "../../../shared/PreferencesContext";
import { HSK_LEVELS } from "../../../shared/contentApi";
import { useVocabulary } from "../../../shared/useVocabulary";
import { useVocabProgress } from "../../../shared/useVocabProgress";
import { selectPracticeWords } from "../../../shared/practiceWords";
import { useSpeak } from "../../../shared/useSpeak";
import { resolveHskLevel, getLearnMode, getRandomOrder } from "../../../shared/userSettings";
import { logWordPractice } from "../../../shared/localProgress";
import { ActivityApi } from "../../../shared/activityApi";
import { toDisplayHanzi, toDisplayPhonetic } from "../../../shared/chineseText";

export default function DictationPractice() {
  const { t, language } = useLanguage();
  const { showPinyin, scriptMode, phoneticMode } = usePreferences();
  const speak = useSpeak();
  const level = resolveHskLevel(HSK_LEVELS);
  const [learnMode] = useState(getLearnMode);
  const [randomOrder] = useState(getRandomOrder);
  const { learned } = useVocabProgress();
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const { words, loading, error } = useVocabulary(level);
  const practiceWords = useMemo(
    () => selectPracticeWords(words, { learned, learnMode, randomOrder }),
    [words, learned, learnMode, randomOrder]
  );
  const current = practiceWords[index];

  const checkAnswer = () => {
    // Compare against the script the user is actually shown/expected to type
    // (Simplified or Traditional), not always the Simplified data as-stored --
    // otherwise a correct Traditional answer gets marked wrong.
    const isCorrect = input.trim() === toDisplayHanzi(current.hanzi, scriptMode);
    setResult(isCorrect ? "correct" : "incorrect");
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
    logWordPractice();
    ActivityApi.logEvent({
      mode: "listening_dictation",
      item_type: "vocab",
      item_id: current.hanzi,
      level: String(level),
      is_correct: isCorrect,
    });
  };

  const next = () => {
    setIndex((i) => (i + 1) % practiceWords.length);
    setInput("");
    setResult(null);
    setRevealed(false);
  };

  return (
    <div className="listening-panel">
      {loading && <p className="listening-progress-label">{t("common.loading")}</p>}
      {error && <p className="listening-banner">{error}</p>}
      {!loading && !error && words.length > 0 && practiceWords.length === 0 && (
        <p className="listening-banner">{t("practice.allLearned")}</p>
      )}

      {current && (
        <>
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
                    — {toDisplayHanzi(current.hanzi, scriptMode)}{" "}
                    {showPinyin && `(${toDisplayPhonetic(current.pinyin, phoneticMode)})`}
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
                {showPinyin && `${toDisplayPhonetic(current.pinyin, phoneticMode)} · `}
                {language === "en" ? current.en : current.vi}
              </p>
            )}
          </div>

          <p className="listening-progress-label">
            {t("hsk.listening.score")}: {score.correct}/{score.total} · {index + 1}/{practiceWords.length}
          </p>
        </>
      )}
    </div>
  );
}
