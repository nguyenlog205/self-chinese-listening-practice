import { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { usePreferences } from "../../../shared/PreferencesContext";
import { HSK_LEVELS } from "../data/hskData";
import { useSpeak } from "../../../shared/useSpeak";
import { useReading } from "../../../shared/useReading";
import { resolveHskLevel } from "../../../shared/userSettings";
import { toDisplayHanzi, toDisplayPhonetic } from "../../../shared/chineseText";

const PAGE_SIZE = 10;

export default function Reading() {
  const { t, language } = useLanguage();
  const { showPinyin, scriptMode, phoneticMode } = usePreferences();
  const speak = useSpeak();
  const [level, setLevel] = useState(() => resolveHskLevel(HSK_LEVELS));
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);

  const { passages, loading, error } = useReading(level);

  const changeLevel = (lvl) => {
    setLevel(lvl);
    setPage(0);
    setSelectedId(null);
  };

  const pageCount = Math.max(1, Math.ceil(passages.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const paged = passages.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

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
            <button type="button" className="hsk-play-btn" onClick={() => speak(selected.hanzi)}>
              🔊 {t("hsk.common.play")}
            </button>
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

      {loading && <p className="hsk-progress-label">{t("common.loading")}</p>}
      {error && <p className="hsk-empty">{error}</p>}
      {!loading && passages.length === 0 && <p className="hsk-empty">{t("hsk.reading.noResults")}</p>}

      <div className="hsk-grammar-grid">
        {paged.map((passage) => (
          <div key={passage.id} className="hsk-grammar-card">
            <div className="hsk-grammar-card-main" onClick={() => openPassage(passage.id)}>
              <span className="hsk-grammar-title">{passage.title[language] ?? passage.title.vi}</span>
            </div>
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
