import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { HSK_LEVELS } from "../../../shared/contentApi";
import { useVocabulary } from "../../../shared/useVocabulary";
import { useVocabProgress } from "../../../shared/useVocabProgress";
import { selectPracticeWords } from "../../../shared/practiceWords";
import { useSpeak } from "../../../shared/useSpeak";
import { resolveHskLevel, getLearnMode, getRandomOrder } from "../../../shared/userSettings";
import { logWordPractice } from "../../../shared/localProgress";
import { ActivityApi } from "../../../shared/activityApi";

// `index` walks `words` sequentially (round-robin) instead of picking with
// Math.random() each round, so the "xáo trộn thứ tự" setting — which
// shuffles `words` once up front — actually controls whether this feels
// random or not, and repeats only after a full pass.
function buildRound(words, index) {
  const answer = words[index % words.length];
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
  const level = resolveHskLevel(HSK_LEVELS);
  const [learnMode] = useState(getLearnMode);
  const [randomOrder] = useState(getRandomOrder);
  const { learned } = useVocabProgress();
  const { words, loading, error } = useVocabulary(level);
  const practiceWords = useMemo(
    () => selectPracticeWords(words, { learned, learnMode, randomOrder }),
    [words, learned, learnMode, randomOrder]
  );
  const [round, setRound] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    if (practiceWords.length > 0) {
      setRound(buildRound(practiceWords, attempt));
      setSelected(null);
    } else {
      setRound(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceWords, attempt]);

  const choose = (option) => {
    if (selected) return;
    setSelected(option);
    const isCorrect = option.hanzi === round.answer.hanzi;
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
    logWordPractice();
    ActivityApi.logEvent({
      mode: "listening_choice",
      item_type: "vocab",
      item_id: round.answer.hanzi,
      level: String(level),
      is_correct: isCorrect,
    });
  };

  const next = () => setAttempt((a) => a + 1);

  return (
    <div className="listening-panel">
      {loading && <p className="listening-progress-label">{t("common.loading")}</p>}
      {error && <p className="listening-banner">{error}</p>}
      {!loading && !error && words.length > 0 && practiceWords.length === 0 && (
        <p className="listening-banner">{t("practice.allLearned")}</p>
      )}

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
