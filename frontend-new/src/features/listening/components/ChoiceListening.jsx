import { useEffect, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { HSK_LEVELS } from "../../../shared/contentApi";
import { useVocabulary } from "../../../shared/useVocabulary";
import { useSpeak } from "../../../shared/useSpeak";

function buildRound(words) {
  const answer = words[Math.floor(Math.random() * words.length)];
  const distractors = words
    .filter((w) => w.hanzi !== answer.hanzi)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const options = [answer, ...distractors].sort(() => Math.random() - 0.5);
  return { answer, options };
}

export default function ChoiceListening() {
  const { t, language } = useLanguage();
  const speak = useSpeak();
  const [level, setLevel] = useState(HSK_LEVELS[0]);
  const { words, loading, error } = useVocabulary(level);
  const [round, setRound] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    if (words.length > 0) {
      setRound(buildRound(words));
      setSelected(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, attempt]);

  const changeLevel = (lvl) => {
    setLevel(lvl);
    setScore({ correct: 0, total: 0 });
  };

  const choose = (option) => {
    if (selected) return;
    setSelected(option);
    setScore((s) => ({
      correct: s.correct + (option.hanzi === round.answer.hanzi ? 1 : 0),
      total: s.total + 1,
    }));
  };

  const next = () => setAttempt((a) => a + 1);

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

      {loading && <p className="listening-progress-label">{t("common.loading")}</p>}
      {error && <p className="listening-banner">{error}</p>}

      {round && (
        <>
          <div className="listening-card">
            <p className="listening-progress-label">{t("listening.choice.hint")}</p>

            <button
              type="button"
              className="listening-play-btn"
              onClick={() => speak(round.answer.hanzi)}
            >
              🔊 {t("hsk.common.play")}
            </button>

            <div className="listening-choice-options">
              {round.options.map((option) => {
                const isAnswer = option.hanzi === round.answer.hanzi;
                const isSelected = selected?.hanzi === option.hanzi;
                let cls = "listening-choice-option";
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
