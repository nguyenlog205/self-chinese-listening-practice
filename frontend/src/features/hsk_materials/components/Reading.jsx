import { useMemo, useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { usePreferences } from "../../../shared/PreferencesContext";
import { HSK_LEVELS } from "../data/hskData";
import { useSpeak } from "../../../shared/useSpeak";
import { useReading } from "../../../shared/useReading";
import { useReadingProgress } from "../../../shared/useReadingProgress";
import { resolveHskLevel } from "../../../shared/userSettings";
import { toDisplayHanzi, toDisplayPhonetic } from "../../../shared/chineseText";
import { ActivityApi } from "../../../shared/activityApi";
import SpeakerIcon from "../../../shared/SpeakerIcon";

const PAGE_SIZE = 15;
const FILTERS = ["all", "unlearned", "learned"];

export default function Reading() {
  const { t, language } = useLanguage();
  const { showPinyin, scriptMode, phoneticMode } = usePreferences();
  const speak = useSpeak();
  const { learned, toggleLearned } = useReadingProgress();
  const [level, setLevel] = useState(() => resolveHskLevel(HSK_LEVELS));
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);

  const { passages, loading, error } = useReading(level);

  // Only the "not learned -> learned" transition counts as a practice
  // event -- un-marking is just correcting a mistake, not new activity.
  const handleToggleLearned = (passageId) => {
    const wasLearned = learned.has(passageId);
    toggleLearned(passageId);
    if (!wasLearned) {
      ActivityApi.logEvent({
        mode: "hsk_reading",
        item_type: "reading",
        item_id: passageId,
        level: String(level),
      });
    }
  };

  const changeLevel = (lvl) => {
    setLevel(lvl);
    setPage(0);
    setSelectedId(null);
  };

  const changeFilter = (f) => {
    setFilter(f);
    setPage(0);
  };

  const filtered = useMemo(() => {
    if (filter === "learned") return passages.filter((p) => learned.has(p.id));
    if (filter === "unlearned") return passages.filter((p) => !learned.has(p.id));
    return passages;
  }, [passages, learned, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const learnedCount = passages.filter((p) => learned.has(p.id)).length;

  const selected = passages.find((p) => p.id === selectedId);

  const openPassage = (id) => {
    setSelectedId(id);
    setShowTranslation(false);
  };

  if (selected) {
    return (
      <div className="hsk-panel">
        <button type="button" className="hsk-back-btn" onClick={() => setSelectedId(null)}>
          ← {t("hsk.common.back")}
        </button>

        <div className="hsk-reading-card">
          <div className="hsk-reading-header">
            <h2>{selected.title[language] ?? selected.title.vi}</h2>
            <div className="hsk-reading-header-actions">
              <button type="button" className="hsk-play-btn" onClick={() => speak(selected.hanzi)}>
                <SpeakerIcon /> {t("hsk.common.play")}
              </button>
              <button
                type="button"
                className={learned.has(selected.id) ? "active" : ""}
                onClick={() => handleToggleLearned(selected.id)}
              >
                {learned.has(selected.id) ? t("hsk.reading.learned") : t("hsk.reading.markLearned")}
              </button>
            </div>
          </div>

          <p className="hsk-reading-hanzi">{toDisplayHanzi(selected.hanzi, scriptMode)}</p>
          {showPinyin && (
            <p className="hsk-reading-pinyin">{toDisplayPhonetic(selected.pinyin, phoneticMode)}</p>
          )}

          <div className="hsk-reading-toggles">
            <button type="button" onClick={() => setShowTranslation((v) => !v)}>
              {showTranslation ? t("hsk.reading.hideTranslation") : t("hsk.reading.showTranslation")}
            </button>
          </div>

          {showTranslation && (
            <p className="hsk-reading-translation">
              {selected.translation[language] ?? selected.translation.vi}
            </p>
          )}
        </div>
      </div>
    );
  }

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
        <div className="hsk-level-row">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`hsk-level-chip${filter === f ? " active" : ""}`}
              onClick={() => changeFilter(f)}
            >
              {t(`hsk.reading.filter.${f}`)}
            </button>
          ))}
        </div>
        <span className="hsk-progress-label">
          {t("hsk.reading.progress")}: {learnedCount}/{passages.length}
        </span>
      </div>

      {loading && <p className="hsk-progress-label">{t("common.loading")}</p>}
      {error && <p className="hsk-empty">{error}</p>}
      {!loading && passages.length === 0 && <p className="hsk-empty">{t("hsk.reading.noResults")}</p>}
      {!loading && passages.length > 0 && filtered.length === 0 && (
        <p className="hsk-empty">{t("hsk.reading.noFilterResults")}</p>
      )}

      <div className="hsk-grammar-grid">
        {paged.map((passage) => (
          <div
            key={passage.id}
            className={`hsk-grammar-card${learned.has(passage.id) ? " known" : ""}`}
          >
            <div className="hsk-grammar-card-main" onClick={() => openPassage(passage.id)}>
              <span className="hsk-grammar-title">{passage.title[language] ?? passage.title.vi}</span>
            </div>
            <button
              type="button"
              className={`hsk-grammar-known-btn${learned.has(passage.id) ? " active" : ""}`}
              onClick={() => handleToggleLearned(passage.id)}
            >
              {learned.has(passage.id) ? t("hsk.reading.learned") : t("hsk.reading.markLearned")}
            </button>
          </div>
        ))}
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
