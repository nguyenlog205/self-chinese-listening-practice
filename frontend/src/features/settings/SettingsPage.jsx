import "./SettingsPage.css";
import { useLanguage } from "../../i18n/LanguageContext";
import { usePreferences } from "../../shared/PreferencesContext";
import { useState } from "react";
import {
  USER_NAME_KEY,
  HSK_GOAL_KEY,
  EXAM_DATE_KEY,
  WORD_GOAL_KEY,
  SENTENCE_GOAL_KEY,
  LEARN_MODE_KEY,
  RANDOM_ORDER_KEY,
  getLearnMode,
  getRandomOrder,
} from "../../shared/userSettings";
import { ContentApi } from "../../shared/contentApi";
import { ActivityApi } from "../../shared/activityApi";
import { clearVocabularyCache } from "../../shared/useVocabulary";
import { clearGrammarCache } from "../../shared/useGrammar";
import { clearDialoguesCache } from "../../shared/useDialogues";
import { clearDialogueExercisesCache } from "../../shared/useDialogueExercises";
import { clearVocabProgressCache } from "../../shared/useVocabProgress";
import { resetLocalProgress } from "../../shared/localProgress";

const STORAGE = {
  NAME: USER_NAME_KEY,
  HSK: HSK_GOAL_KEY,
  EXAM_DATE: EXAM_DATE_KEY,
  GOAL: WORD_GOAL_KEY,
  SENTENCE_GOAL: SENTENCE_GOAL_KEY,
  RATE: "listening-app:playback-rate",
  LEARN_MODE: LEARN_MODE_KEY,
  RANDOM_ORDER: RANDOM_ORDER_KEY,
};

export default function SettingsPage() {
  const { t, language, setLanguage, languages } = useLanguage();
  const { showPinyin, setShowPinyin, scriptMode, setScriptMode, phoneticMode, setPhoneticMode } =
    usePreferences();

  const [name, setName] = useState(localStorage.getItem(STORAGE.NAME) || "");
  const [hsk, setHsk] = useState(localStorage.getItem(STORAGE.HSK) || "1");
  const [examDate, setExamDate] = useState(localStorage.getItem(STORAGE.EXAM_DATE) || "");
  const [goal, setGoal] = useState(() => {
    const v = localStorage.getItem(STORAGE.GOAL);
    return v ? parseInt(v, 10) : 10;
  });
  const [sentenceGoal, setSentenceGoal] = useState(() => {
    const v = localStorage.getItem(STORAGE.SENTENCE_GOAL);
    return v ? parseInt(v, 10) : 50;
  });
  const [rate, setRate] = useState(() => {
    const v = localStorage.getItem(STORAGE.RATE);
    return v ? parseFloat(v) : 1.0;
  });
  const [learnMode, setLearnMode] = useState(getLearnMode);
  const [randomOrder, setRandomOrder] = useState(getRandomOrder);

  const handleName = (e) => {
    const val = e.target.value;
    setName(val);
    localStorage.setItem(STORAGE.NAME, val);
  };
  const handleHsk = (e) => {
    const val = e.target.value;
    setHsk(val);
    localStorage.setItem(STORAGE.HSK, val);
  };
  const handleExamDate = (e) => {
    const val = e.target.value;
    setExamDate(val);
    localStorage.setItem(STORAGE.EXAM_DATE, val);
  };
  const handleGoal = (e) => {
    const val = parseInt(e.target.value, 10) || 0;
    setGoal(val);
    localStorage.setItem(STORAGE.GOAL, String(val));
  };
  const handleSentenceGoal = (e) => {
    const val = parseInt(e.target.value, 10) || 0;
    setSentenceGoal(val);
    localStorage.setItem(STORAGE.SENTENCE_GOAL, String(val));
  };
  const handleRate = (e) => {
    const val = parseFloat(e.target.value);
    setRate(val);
    localStorage.setItem(STORAGE.RATE, String(val));
  };
  const handleLearnMode = (e) => {
    const val = e.target.value;
    setLearnMode(val);
    localStorage.setItem(STORAGE.LEARN_MODE, val);
  };
  const handleRandomOrder = (e) => {
    const val = e.target.checked;
    setRandomOrder(val);
    localStorage.setItem(STORAGE.RANDOM_ORDER, String(val));
  };

  const [refreshState, setRefreshState] = useState({ status: "idle", message: "" });

  const handleRefreshContent = async () => {
    setRefreshState({ status: "loading", message: "" });
    try {
      const result = await ContentApi.refreshContent();
      clearVocabularyCache();
      clearGrammarCache();
      clearDialoguesCache();
      clearDialogueExercisesCache();
      const wordCount = Object.values(result.vocabulary).reduce((a, b) => a + b, 0);
      const grammarCount = Object.values(result.grammar ?? {}).reduce((a, b) => a + b, 0);
      const audioNote =
        result.dialogue_audio > 0
          ? t("settings.dataRefreshAudioNote", { count: result.dialogue_audio })
          : "";
      setRefreshState({
        status: "success",
        message: t("settings.dataRefreshSuccess", {
          words: wordCount,
          grammar: grammarCount,
          dialogues: result.dialogues,
          audioNote,
        }),
      });
    } catch (err) {
      setRefreshState({ status: "error", message: err.message });
    }
  };

  const [resetState, setResetState] = useState({ status: "idle", message: "" });

  const handleResetProgress = async () => {
    if (!window.confirm(t("settings.resetConfirm"))) return;
    setResetState({ status: "loading", message: "" });
    try {
      await Promise.all([ContentApi.resetVocabProgress(), ActivityApi.resetActivity()]);
      resetLocalProgress();
      clearVocabProgressCache();
      window.location.reload();
    } catch (err) {
      setResetState({ status: "error", message: err.message });
    }
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>{t("settings.title")}</h1>
        <p>{t("settings.description")}</p>
      </div>

      {/* Ngôn ngữ – giữ nguyên */}
      <section className="settings-card">
        <h2>{t("settings.languageLabel")}</h2>
        <p className="settings-card-desc">{t("settings.languageDescription")}</p>
        <div className="language-options" role="radiogroup">
          {languages.map((option) => (
            <button
              key={option.code}
              type="button"
              role="radio"
              aria-checked={option.code === language}
              className={`language-option${option.code === language ? " active" : ""}`}
              onClick={() => setLanguage(option.code)}
            >
              <span className="language-option-flag">{option.flag}</span>
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {/* Thông tin cá nhân – grid 2 cột */}
      <section className="settings-card">
        <h2>{t("settings.personalInfoTitle")}</h2>
        <div className="settings-grid">
          <div className="settings-field">
            <label htmlFor="name">{t("settings.nameLabel")}</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={handleName}
              placeholder={t("settings.namePlaceholder")}
            />
          </div>
          <div className="settings-field">
            <label htmlFor="hsk">{t("settings.hskLevelLabel")}</label>
            <select id="hsk" value={hsk} onChange={handleHsk}>
              <option value="1">HSK 1</option>
              <option value="2">HSK 2</option>
              <option value="3">HSK 3</option>
              <option value="4">HSK 4</option>
              <option value="5">HSK 5</option>
              <option value="6">HSK 6</option>
              <option value="7-9">HSK 7-9</option>
            </select>
          </div>
          <div className="settings-field">
            <label htmlFor="examDate">{t("settings.examDateLabel")}</label>
            <input id="examDate" type="date" value={examDate} onChange={handleExamDate} />
          </div>
        </div>
      </section>

      {/* Cài đặt học tập – grid 2 cột, checkbox chiếm cả 2 */}
      <section className="settings-card">
        <h2>{t("settings.learningSettingsTitle")}</h2>
        <div className="settings-grid">
          <div className="settings-field">
            <label htmlFor="goal">{t("settings.wordGoalLabel")}</label>
            <input id="goal" type="number" min="0" value={goal} onChange={handleGoal} />
          </div>
          <div className="settings-field">
            <label htmlFor="sentenceGoal">{t("settings.sentenceGoalLabel")}</label>
            <input
              id="sentenceGoal"
              type="number"
              min="0"
              value={sentenceGoal}
              onChange={handleSentenceGoal}
            />
          </div>
          <div className="settings-field">
            <label htmlFor="rate">{t("settings.rateLabel")}</label>
            <select id="rate" value={rate} onChange={handleRate}>
              <option value="0.8">0.8x</option>
              <option value="1">1.0x</option>
              <option value="1.2">1.2x</option>
            </select>
          </div>
          <div className="settings-field">
            <label htmlFor="learnMode">{t("settings.learnModeLabel")}</label>
            <select id="learnMode" value={learnMode} onChange={handleLearnMode}>
              <option value="all">{t("settings.learnModeAll")}</option>
              <option value="unknown">{t("settings.learnModeUnknown")}</option>
            </select>
          </div>
          <div className="settings-field">
            <label htmlFor="scriptMode">{t("settings.scriptModeLabel")}</label>
            <select id="scriptMode" value={scriptMode} onChange={(e) => setScriptMode(e.target.value)}>
              <option value="simplified">{t("settings.scriptSimplified")}</option>
              <option value="traditional">{t("settings.scriptTraditional")}</option>
            </select>
          </div>
          <div className="settings-field checkbox">
            <label>
              <input
                type="checkbox"
                checked={showPinyin}
                onChange={(e) => setShowPinyin(e.target.checked)}
              />
              {t("settings.showPhoneticLabel")}
            </label>
          </div>
          <div className="settings-field">
            <label htmlFor="phoneticMode">{t("settings.phoneticModeLabel")}</label>
            <select
              id="phoneticMode"
              value={phoneticMode}
              onChange={(e) => setPhoneticMode(e.target.value)}
              disabled={!showPinyin}
            >
              <option value="pinyin">{t("settings.phoneticPinyin")}</option>
              <option value="zhuyin">{t("settings.phoneticZhuyin")}</option>
            </select>
          </div>
          <div className="settings-field checkbox">
            <label>
              <input type="checkbox" checked={randomOrder} onChange={handleRandomOrder} />
              {t("settings.randomOrderLabel")}
            </label>
          </div>
        </div>
      </section>

      {/* Dữ liệu học tập – tải lại từ vựng/hội thoại mới nhất từ GitHub */}
      <section className="settings-card">
        <h2>{t("settings.dataTitle")}</h2>
        <p className="settings-card-desc">{t("settings.dataDescription")}</p>
        <button
          type="button"
          className="btn-accent"
          onClick={handleRefreshContent}
          disabled={refreshState.status === "loading"}
        >
          {refreshState.status === "loading"
            ? t("settings.dataRefreshing")
            : t("settings.dataRefreshButton")}
        </button>
        {refreshState.status === "success" && (
          <p className="settings-refresh-message success">{refreshState.message}</p>
        )}
        {refreshState.status === "error" && (
          <p className="settings-refresh-message error">{refreshState.message}</p>
        )}
      </section>

      {/* Vùng nguy hiểm – xoá sạch tiến trình học, không hoàn tác được */}
      <section className="settings-card settings-danger-zone">
        <h2>{t("settings.dangerZoneTitle")}</h2>
        <p className="settings-card-desc">{t("settings.dangerZoneDescription")}</p>
        <button
          type="button"
          className="btn-danger"
          onClick={handleResetProgress}
          disabled={resetState.status === "loading"}
        >
          {resetState.status === "loading" ? t("settings.resetting") : t("settings.resetButton")}
        </button>
        {resetState.status === "error" && (
          <p className="settings-refresh-message error">{resetState.message}</p>
        )}
      </section>
    </div>
  );
}