import { useState } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { usePreferences } from "../../../shared/PreferencesContext";
import { HSK_LEVELS, READING_PASSAGES } from "../data/hskData";
import { useSpeak } from "../../../shared/useSpeak";
import { resolveHskLevel } from "../../../shared/userSettings";
import { toDisplayHanzi, toDisplayPhonetic } from "../../../shared/chineseText";

export default function Reading() {
  const { t, language } = useLanguage();
  const { showPinyin, scriptMode, phoneticMode } = usePreferences();
  const speak = useSpeak();
  const [level, setLevel] = useState(() => resolveHskLevel(HSK_LEVELS));
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

        <p className="hsk-reading-hanzi">{toDisplayHanzi(passage.hanzi, scriptMode)}</p>
        {showPinyin && (
          <p className="hsk-reading-pinyin">{toDisplayPhonetic(passage.pinyin, phoneticMode)}</p>
        )}

        <div className="hsk-reading-toggles">
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
