import { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { HSK_LEVELS, READING_PASSAGES } from "../data/hskData";
import { useSpeak } from "../../../shared/useSpeak";

export default function Reading() {
  const { t, language } = useLanguage();
  const speak = useSpeak();
  const [level, setLevel] = useState(HSK_LEVELS[0]);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);

  const passage = READING_PASSAGES[level];

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

      <div className="hsk-reading-card">
        <div className="hsk-reading-header">
          <h2>{passage.title[language] ?? passage.title.vi}</h2>
          <button type="button" className="hsk-play-btn" onClick={() => speak(passage.hanzi)}>
            🔊 {t("hsk.common.play")}
          </button>
        </div>

        <p className="hsk-reading-hanzi">{passage.hanzi}</p>
        {showPinyin && <p className="hsk-reading-pinyin">{passage.pinyin}</p>}

        <div className="hsk-reading-toggles">
          <button type="button" onClick={() => setShowPinyin((v) => !v)}>
            {showPinyin ? t("hsk.reading.hidePinyin") : t("hsk.reading.showPinyin")}
          </button>
          <button type="button" onClick={() => setShowTranslation((v) => !v)}>
            {showTranslation ? t("hsk.reading.hideTranslation") : t("hsk.reading.showTranslation")}
          </button>
        </div>

        {showTranslation && (
          <p className="hsk-reading-translation">
            {passage.translation[language] ?? passage.translation.vi}
          </p>
        )}
      </div>
    </div>
  );
}
