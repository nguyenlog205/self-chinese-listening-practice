import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { usePreferences } from "../../../shared/PreferencesContext";
import { HSK_LEVELS } from "../data/hskData";
import { useVocabulary } from "../../../shared/useVocabulary";
import { useVocabProgress } from "../../../shared/useVocabProgress";
import { selectPracticeWords } from "../../../shared/practiceWords";
import { buildQuiz } from "../../../shared/buildQuiz";
import { resolveHskLevel, getLearnMode, getRandomOrder } from "../../../shared/userSettings";
import { logWordPractice } from "../../../shared/localProgress";
import { ActivityApi } from "../../../shared/activityApi";
import { useSpeak } from "../../../shared/useSpeak";
import { toDisplayHanzi, toDisplayPhonetic } from "../../../shared/chineseText";
import SpeakerIcon from "../../../shared/SpeakerIcon";

export default function MockTest() {
  const { t, language } = useLanguage();
  const { showPinyin, scriptMode, phoneticMode } = usePreferences();
  const speak = useSpeak();
  const [level, setLevel] = useState(() => resolveHskLevel(HSK_LEVELS));
  const [learnMode] = useState(getLearnMode);
  const [randomOrder] = useState(getRandomOrder);
  const { learned } = useVocabProgress();
  const { words, loading, error } = useVocabulary(level);
  const practiceWords = useMemo(
    () => selectPracticeWords(words, { learned, learnMode, randomOrder }),
    [words, learned, learnMode, randomOrder]
  );
  const [quiz, setQuiz] = useState([]);
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (practiceWords.length === 0) {
      setQuiz([]);
      return;
    }
    setQuiz(buildQuiz(practiceWords));
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceWords, attempt]);

  const question = quiz[index];

  const choose = (option) => {
    if (selected) return;
    setSelected(option);
    const isCorrect = option.hanzi === question.answer;
    if (isCorrect) setScore((s) => s + 1);
    logWordPractice();
    ActivityApi.logEvent({
      mode: "hsk_mocktest",
      item_type: "vocab",
      item_id: question.answer,
      level: String(level),
      is_correct: isCorrect,
    });
  };

  const next = () => {
    if (index + 1 >= quiz.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  };

  const restart = () => setAttempt((a) => a + 1);

  return (
    <div className="hsk-panel">
      <div className="hsk-level-row">
        {HSK_LEVELS.map((lvl) => (
          <button
            key={lvl}
            className={`hsk-level-chip${lvl === level ? " active" : ""}`}
            onClick={() => setLevel(lvl)}
            type="button"
          >
            HSK {lvl}
          </button>
        ))}
      </div>

      {loading && <p className="hsk-progress-label">{t("common.loading")}</p>}
      {error && <p className="hsk-empty">{error}</p>}
      {!loading && !error && words.length > 0 && practiceWords.length === 0 && (
        <p className="hsk-empty">{t("practice.allLearned")}</p>
      )}

      {question &&
        (finished ? (
          <div className="hsk-mocktest-card hsk-mocktest-result">
            <h2>{t("hsk.mocktest.done")}</h2>
            <p className="hsk-mocktest-score">
              {score}/{quiz.length}
            </p>
            <button type="button" className="btn-accent" onClick={restart}>
              {t("hsk.mocktest.restart")}
            </button>
          </div>
        ) : (
          <div className="hsk-mocktest-card">
            <div className="hsk-mocktest-progress">
              {t("hsk.mocktest.question")} {index + 1}/{quiz.length}
            </div>
            <p className="hsk-mocktest-prompt">{t("hsk.mocktest.prompt")}</p>
            <div className="hsk-mocktest-hanzi-row">
              <span className="hsk-mocktest-hanzi">{toDisplayHanzi(question.question, scriptMode)}</span>
              <button
                type="button"
                className="hsk-grammar-play-btn"
                onClick={() => speak(question.question)}
                title={t("hsk.common.play")}
              >
                <SpeakerIcon />
              </button>
            </div>
            {showPinyin && (
              <p className="hsk-mocktest-pinyin">{toDisplayPhonetic(question.pinyin, phoneticMode)}</p>
            )}

            <div className="hsk-mocktest-options">
              {question.options.map((option) => {
                const isAnswer = option.hanzi === question.answer;
                const isSelected = selected?.hanzi === option.hanzi;
                let cls = "hsk-mocktest-option";
                if (selected) {
                  if (isAnswer) cls += " correct";
                  else if (isSelected) cls += " incorrect";
                }
                return (
                  <button
                    key={`${option.hanzi}-${option.pinyin}`}
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
              <button type="button" className="btn-accent" onClick={next}>
                {index + 1 >= quiz.length ? t("hsk.mocktest.finish") : t("hsk.common.next")}
              </button>
            )}
          </div>
        ))}
    </div>
  );
}
