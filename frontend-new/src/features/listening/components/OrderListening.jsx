import { useEffect, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { HSK_LEVELS } from "../../../shared/contentApi";
import { useVocabulary } from "../../../shared/useVocabulary";
import { useSpeak } from "../../../shared/useSpeak";

function pickWord(words) {
  const candidates = words.filter((w) => w.hanzi.length >= 2);
  const pool = candidates.length > 0 ? candidates : words;
  return pool[Math.floor(Math.random() * pool.length)];
}

function shuffleTiles(word) {
  const tiles = word.hanzi.split("").map((char, i) => ({ id: `${i}-${char}`, char }));
  return tiles.sort(() => Math.random() - 0.5);
}

export default function OrderListening() {
  const { t, language } = useLanguage();
  const speak = useSpeak();
  const [level, setLevel] = useState(HSK_LEVELS[0]);
  const { words, loading, error } = useVocabulary(level);
  const [word, setWord] = useState(null);
  const [tiles, setTiles] = useState([]);
  const [attempt, setAttempt] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    if (words.length === 0) return;
    const nextWord = pickWord(words);
    setWord(nextWord);
    setTiles(shuffleTiles(nextWord));
    setPlaced([]);
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, attempt]);

  const changeLevel = (lvl) => {
    setLevel(lvl);
    setScore({ correct: 0, total: 0 });
  };

  const placedTiles = placed.map((id) => tiles.find((tl) => tl.id === id));
  const poolTiles = tiles.filter((tl) => !placed.includes(tl.id));

  const placeTile = (id) => {
    if (result) return;
    setPlaced((p) => [...p, id]);
  };

  const removeTile = (id) => {
    if (result) return;
    setPlaced((p) => p.filter((tid) => tid !== id));
  };

  const check = () => {
    const guess = placedTiles.map((tl) => tl.char).join("");
    const isCorrect = guess === word.hanzi;
    setResult(isCorrect ? "correct" : "incorrect");
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
  };

  const reset = () => setPlaced([]);
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

      {word && (
        <>
          <div className="listening-card">
            <p className="listening-progress-label">{t("listening.order.hint")}</p>

            <button type="button" className="listening-play-btn" onClick={() => speak(word.hanzi)}>
              🔊 {t("hsk.common.play")}
            </button>

            <div className="listening-order-target">
              {placedTiles.map((tl) => (
                <button
                  key={tl.id}
                  type="button"
                  className="listening-order-tile placed"
                  onClick={() => removeTile(tl.id)}
                  disabled={!!result}
                >
                  {tl.char}
                </button>
              ))}
            </div>

            <div className="listening-order-pool">
              {poolTiles.map((tl) => (
                <button
                  key={tl.id}
                  type="button"
                  className="listening-order-tile"
                  onClick={() => placeTile(tl.id)}
                  disabled={!!result}
                >
                  {tl.char}
                </button>
              ))}
            </div>

            {result && (
              <div className={`listening-result listening-result-${result}`}>
                {result === "correct" ? t("hsk.common.correct") : t("hsk.common.incorrect")}
                {result === "incorrect" && (
                  <span className="listening-result-answer">
                    {" "}
                    — {word.hanzi} ({word.pinyin}) · {language === "en" ? word.en : word.vi}
                  </span>
                )}
              </div>
            )}

            <div className="listening-footer">
              <button type="button" onClick={reset} disabled={!!result || placed.length === 0}>
                {t("listening.order.reset")}
              </button>
              {result ? (
                <button type="button" className="btn-accent" onClick={next}>
                  {t("hsk.common.next")} →
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-accent"
                  onClick={check}
                  disabled={placed.length !== tiles.length}
                >
                  {t("hsk.common.check")}
                </button>
              )}
            </div>
          </div>

          <p className="listening-progress-label">
            {t("hsk.listening.score")}: {score.correct}/{score.total}
          </p>
        </>
      )}
    </div>
  );
}
