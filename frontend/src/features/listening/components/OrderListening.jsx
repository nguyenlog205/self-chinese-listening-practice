import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { usePreferences } from "../../../shared/PreferencesContext";
import { HSK_LEVELS } from "../../../shared/contentApi";
import { useVocabulary } from "../../../shared/useVocabulary";
import { useVocabProgress } from "../../../shared/useVocabProgress";
import { selectPracticeWords } from "../../../shared/practiceWords";
import { useSpeak } from "../../../shared/useSpeak";
import { resolveHskLevel, getLearnMode, getRandomOrder } from "../../../shared/userSettings";
import { ActivityApi } from "../../../shared/activityApi";
import { toDisplayHanzi, toDisplayPhonetic } from "../../../shared/chineseText";
import SpeakerIcon from "../../../shared/SpeakerIcon";

// `index` walks `words` round-robin instead of a fresh Math.random() pick
// each round — see ChoiceListening.jsx for why.
function pickWord(words, index) {
  const candidates = words.filter((w) => w.hanzi.length >= 2);
  const pool = candidates.length > 0 ? candidates : words;
  return pool[index % pool.length];
}

function shuffleTiles(word) {
  const tiles = word.hanzi.split("").map((char, i) => ({ id: `${i}-${char}`, char }));
  return tiles.sort(() => Math.random() - 0.5);
}

export default function OrderListening() {
  const { t, language } = useLanguage();
  const { showPinyin, scriptMode, phoneticMode } = usePreferences();
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
  const [word, setWord] = useState(null);
  const [tiles, setTiles] = useState([]);
  const [attempt, setAttempt] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    if (practiceWords.length === 0) {
      setWord(null);
      return;
    }
    const nextWord = pickWord(practiceWords, attempt);
    setWord(nextWord);
    setTiles(shuffleTiles(nextWord));
    setPlaced([]);
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [practiceWords, attempt]);

  const placedTiles = placed.map((id) => tiles.find((tl) => tl.id === id));
  const poolTiles = tiles.filter((tl) => !placed.includes(tl.id));

  // Converted as a whole word, not tile-by-tile: some characters change
  // differently depending on their neighbors (e.g. 后 alone -> 後, but 皇后
  // "empress" stays 皇后; 干净 -> 乾淨 but 干活 -> 幹活), so converting each
  // already-split tile in isolation silently picks the wrong variant.
  const displayChars = useMemo(
    () => (word ? toDisplayHanzi(word.hanzi, scriptMode).split("") : []),
    [word, scriptMode]
  );
  const displayFor = (tl) => displayChars[Number(tl.id.split("-")[0])] ?? tl.char;

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
    ActivityApi.logEvent({
      mode: "listening_order",
      item_type: "vocab",
      item_id: word.hanzi,
      level: String(level),
      is_correct: isCorrect,
    });
  };

  const reset = () => setPlaced([]);
  const next = () => setAttempt((a) => a + 1);

  return (
    <div className="listening-panel">
      {loading && <p className="listening-progress-label">{t("common.loading")}</p>}
      {error && <p className="listening-banner">{error}</p>}
      {!loading && !error && words.length > 0 && practiceWords.length === 0 && (
        <p className="listening-banner">{t("practice.allLearned")}</p>
      )}

      {word && (
        <>
          <div className="listening-card">
            <p className="listening-progress-label">{t("listening.order.hint")}</p>

            <button type="button" className="listening-play-btn" onClick={() => speak(word.hanzi)}>
              <SpeakerIcon /> {t("hsk.common.play")}
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
                  {displayFor(tl)}
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
                  {displayFor(tl)}
                </button>
              ))}
            </div>

            {result && (
              <div className={`listening-result listening-result-${result}`}>
                {result === "correct" ? t("hsk.common.correct") : t("hsk.common.incorrect")}
                {result === "incorrect" && (
                  <span className="listening-result-answer">
                    {" "}
                    — {toDisplayHanzi(word.hanzi, scriptMode)}{" "}
                    {showPinyin && `(${toDisplayPhonetic(word.pinyin, phoneticMode)})`} ·{" "}
                    {language === "en" ? word.en : word.vi}
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
