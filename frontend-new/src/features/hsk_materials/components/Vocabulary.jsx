import { useMemo, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { usePreferences } from "../../../shared/PreferencesContext";
import { HSK_LEVELS } from "../data/hskData";
import { useSpeak } from "../../../shared/useSpeak";
import { useVocabulary } from "../../../shared/useVocabulary";
import { useVocabProgress } from "../../../shared/useVocabProgress";
import { resolveHskLevel } from "../../../shared/userSettings";

const PAGE_SIZE = 50;

export default function Vocabulary() {
  const { t, language } = useLanguage();
  const { showPinyin } = usePreferences();
  const speak = useSpeak();
  const [level, setLevel] = useState(() => resolveHskLevel(HSK_LEVELS));
  const [query, setQuery] = useState("");
  const { learned, toggleLearned } = useVocabProgress();
  const [page, setPage] = useState(0);

  const { words, loading, error } = useVocabulary(level);
  const filtered = useMemo(
    () =>
      words.filter((w) =>
        `${w.hanzi}${w.pinyin}${w.vi}${w.en}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      ),
    [words, query]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const changeLevel = (lvl) => {
    setLevel(lvl);
    setPage(0);
  };

  const changeQuery = (value) => {
    setQuery(value);
    setPage(0);
  };

  const learnedCount = words.filter((w) => learned.has(w.hanzi)).length;

  return (
    <div className="hsk-panel">
      <div className="hsk-level-row">
        {HSK_LEVELS.map((lvl) => (
          <button
            key={lvl}
            className={`hsk-level-chip${lvl === level ? " active" : ""}`}
            onClick={() => changeLevel(lvl)}
            type="button"
          >
            HSK {lvl}
          </button>
        ))}
      </div>

      <div className="hsk-toolbar">
        <input
          type="text"
          className="hsk-search"
          placeholder={t("hsk.vocab.searchPlaceholder")}
          value={query}
          onChange={(e) => changeQuery(e.target.value)}
        />
        <span className="hsk-progress-label">
          {t("hsk.vocab.progress")}: {learnedCount}/{words.length}
        </span>
      </div>

      {loading && <p className="hsk-progress-label">{t("common.loading")}</p>}
      {error && <p className="hsk-empty">{error}</p>}

      <div className="hsk-word-grid">
        {paged.map((word) => (
          <div
            key={`${word.hanzi}-${word.pinyin}`}
            className={`hsk-word-card${learned.has(word.hanzi) ? " learned" : ""}`}
          >
            <div className="hsk-word-main" onClick={() => speak(word.hanzi)}>
              <span className="hsk-word-hanzi">{word.hanzi}</span>
              {showPinyin && <span className="hsk-word-pinyin">{word.pinyin}</span>}
              <span className="hsk-word-meaning">
                {language === "en" ? word.en : word.vi}
              </span>
            </div>
            <div className="hsk-word-actions">
              <button type="button" onClick={() => speak(word.hanzi)} title={t("hsk.common.play")}>
                🔊
              </button>
              <button
                type="button"
                className={learned.has(word.hanzi) ? "active" : ""}
                onClick={() => toggleLearned(word.hanzi, level)}
              >
                {learned.has(word.hanzi) ? t("hsk.vocab.learned") : t("hsk.vocab.markLearned")}
              </button>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && (
          <p className="hsk-empty">{t("hsk.vocab.noResults")}</p>
        )}
      </div>

      {pageCount > 1 && (
        <div className="hsk-pagination">
          <button
            type="button"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ← {t("hsk.common.prev")}
          </button>
          <span className="hsk-progress-label">
            {t("hsk.vocab.page")} {safePage + 1}/{pageCount}
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            {t("hsk.common.next")} →
          </button>
        </div>
      )}
    </div>
  );
}
