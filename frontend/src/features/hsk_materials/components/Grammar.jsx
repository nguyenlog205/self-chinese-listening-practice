import { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { usePreferences } from "../../../shared/PreferencesContext";
import { HSK_LEVELS } from "../data/hskData";
import { useSpeak } from "../../../shared/useSpeak";
import { useGrammar } from "../../../shared/useGrammar";
import { useGrammarProgress } from "../../../shared/useGrammarProgress";
import { resolveHskLevel } from "../../../shared/userSettings";
import { toDisplayHanzi, toDisplayPhonetic } from "../../../shared/chineseText";
import { ActivityApi } from "../../../shared/activityApi";
import SpeakerIcon from "../../../shared/SpeakerIcon";

const PAGE_SIZE = 30;

export default function Grammar() {
  const { t, language } = useLanguage();
  const { showPinyin, scriptMode, phoneticMode } = usePreferences();
  const speak = useSpeak();
  const { known, toggleKnown } = useGrammarProgress();
  const [level, setLevel] = useState(() => resolveHskLevel(HSK_LEVELS));
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);

  const { points, loading, error } = useGrammar(level);

  // Only the "not known -> known" transition counts as a practice event --
  // un-marking is just correcting a mistake, not new activity.
  const handleToggleKnown = (pointId) => {
    const wasKnown = known.has(pointId);
    toggleKnown(pointId);
    if (!wasKnown) {
      ActivityApi.logEvent({
        mode: "hsk_grammar",
        item_type: "grammar",
        item_id: pointId,
        level: String(level),
      });
    }
  };

  const changeLevel = (lvl) => {
    setLevel(lvl);
    setPage(0);
    setSelectedId(null);
  };

  const pageCount = Math.max(1, Math.ceil(points.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const paged = points.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const knownCount = points.filter((p) => known.has(p.id)).length;

  const selected = points.find((p) => p.id === selectedId);

  if (selected) {
    return (
      <div className="hsk-panel">
        <button type="button" className="hsk-back-btn" onClick={() => setSelectedId(null)}>
          ← {t("hsk.common.back")}
        </button>

        <div className="hsk-grammar-detail">
          <div className="hsk-grammar-detail-header">
            <div>
              <h2>{selected.title[language] ?? selected.title.vi}</h2>
              <span className="hsk-grammar-structure">{selected.structure}</span>
            </div>
            <button
              type="button"
              className={known.has(selected.id) ? "active" : ""}
              onClick={() => handleToggleKnown(selected.id)}
            >
              {known.has(selected.id) ? t("hsk.grammar.known") : t("hsk.grammar.markKnown")}
            </button>
          </div>

          <p className="hsk-grammar-explanation">
            {selected.explanation[language] ?? selected.explanation.vi}
          </p>

          <div className="hsk-grammar-examples">
            {selected.examples.map((ex) => (
              <div key={ex.hanzi} className="hsk-grammar-example">
                <div className="hsk-grammar-example-main" onClick={() => speak(ex.hanzi)}>
                  <span className="hsk-grammar-example-hanzi">
                    {toDisplayHanzi(ex.hanzi, scriptMode)}
                  </span>
                  {showPinyin && (
                    <span className="hsk-grammar-example-pinyin">
                      {toDisplayPhonetic(ex.pinyin, phoneticMode)}
                    </span>
                  )}
                  <span className="hsk-grammar-example-translation">
                    {ex.translation[language] ?? ex.translation.vi}
                  </span>
                </div>
                <button
                  type="button"
                  className="hsk-grammar-play-btn"
                  onClick={() => speak(ex.hanzi)}
                  title={t("hsk.common.play")}
                >
                  <SpeakerIcon />
                </button>
              </div>
            ))}
          </div>
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
        <span className="hsk-progress-label">
          {t("hsk.grammar.progress")}: {knownCount}/{points.length}
        </span>
      </div>

      {loading && <p className="hsk-progress-label">{t("common.loading")}</p>}
      {error && <p className="hsk-empty">{error}</p>}
      {!loading && points.length === 0 && <p className="hsk-empty">{t("hsk.grammar.noResults")}</p>}

      <div className="hsk-grammar-grid">
        {paged.map((point) => (
          <div
            key={point.id}
            className={`hsk-grammar-card${known.has(point.id) ? " known" : ""}`}
          >
            <div className="hsk-grammar-card-main" onClick={() => setSelectedId(point.id)}>
              <span className="hsk-grammar-title">{point.title[language] ?? point.title.vi}</span>
              <span className="hsk-grammar-structure">{point.structure}</span>
            </div>
            <button
              type="button"
              className={`hsk-grammar-known-btn${known.has(point.id) ? " active" : ""}`}
              onClick={() => handleToggleKnown(point.id)}
            >
              {known.has(point.id) ? t("hsk.grammar.known") : t("hsk.grammar.markKnown")}
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
