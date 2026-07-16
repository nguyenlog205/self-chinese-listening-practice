import { useEffect, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { HSK_LEVELS } from "../data/hskData";
import { useVocabulary } from "../../../shared/useVocabulary";
import { buildQuiz } from "../../../shared/buildQuiz";

export default function MockTest() {
  const { t, language } = useLanguage();
  const [level, setLevel] = useState(HSK_LEVELS[0]);
  const { words, loading, error } = useVocabulary(level);
  const [quiz, setQuiz] = useState([]);
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (words.length === 0) return;
    setQuiz(buildQuiz(words));
    setIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, attempt]);

  const question = quiz[index];

  const choose = (option) => {
    if (selected) return;
    setSelected(option);
    if (option.hanzi === question.answer) setScore((s) => s + 1);
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
            <p className="hsk-mocktest-pinyin">{question.pinyin}</p>

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
