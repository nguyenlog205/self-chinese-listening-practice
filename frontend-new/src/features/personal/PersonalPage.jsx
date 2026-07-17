import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useStreak } from "../../shared/useStreak";
import { useVocabProgress } from "../../shared/useVocabProgress";
import { useVocabulary } from "../../shared/useVocabulary";
import { HSK_LEVELS } from "../hsk_materials/data/hskData";
import "./PersonalPage.css";

const STORAGE = {
  NAME: "listening-app:user-name",
  HSK: "listening-app:hsk-goal",
  EXAM_DATE: "listening-app:exam-date",
};

export default function PersonalPage() {
  const { t, language } = useLanguage();
  const { streak, loading: streakLoading } = useStreak();
  const { learned } = useVocabProgress();
  const [editMode, setEditMode] = useState(false);

  const [name, setName] = useState(localStorage.getItem(STORAGE.NAME) || "");
  const [hsk, setHsk] = useState(localStorage.getItem(STORAGE.HSK) || "1");
  const [examDate, setExamDate] = useState(localStorage.getItem(STORAGE.EXAM_DATE) || "");

  const handleSave = () => {
    localStorage.setItem(STORAGE.NAME, name);
    localStorage.setItem(STORAGE.HSK, hsk);
    localStorage.setItem(STORAGE.EXAM_DATE, examDate);
    setEditMode(false);
  };

  const handleCancel = () => {
    setName(localStorage.getItem(STORAGE.NAME) || "");
    setHsk(localStorage.getItem(STORAGE.HSK) || "1");
    setExamDate(localStorage.getItem(STORAGE.EXAM_DATE) || "");
    setEditMode(false);
  };

  return (
    <div className="personal-page">
      <div className="personal-header">
        <h1>{t("personal.title")}</h1>
        <button
          type="button"
          className="btn-edit"
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? t("personal.cancel") : t("personal.edit")}
        </button>
      </div>

      {/* Personal Info Section */}
      <section className="personal-card">
        <h2>{t("personal.personalInfo")}</h2>
        {editMode ? (
          <div className="personal-form">
            <div className="form-group">
              <label>{t("personal.name")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("personal.name")}
              />
            </div>
            <div className="form-group">
              <label>{t("personal.hskLevel")}</label>
              <select value={hsk} onChange={(e) => setHsk(e.target.value)}>
                <option value="1">HSK 1</option>
                <option value="2">HSK 2</option>
                <option value="3">HSK 3</option>
                <option value="4">HSK 4</option>
                <option value="5">HSK 5</option>
                <option value="6">HSK 6</option>
                <option value="7-9">HSK 7-9</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t("personal.examDate")}</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-save" onClick={handleSave}>
                {t("personal.save")}
              </button>
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                {t("personal.cancel")}
              </button>
            </div>
          </div>
        ) : (
          <div className="personal-info-view">
            <div className="info-row">
              <span className="label">{t("personal.name")}:</span>
              <span className="value">{name || t("personal.notSet")}</span>
            </div>
            <div className="info-row">
              <span className="label">{t("personal.hskLevel")}:</span>
              <span className="value">HSK {hsk}</span>
            </div>
            <div className="info-row">
              <span className="label">{t("personal.examDate")}:</span>
              <span className="value">{examDate ? new Date(examDate).toLocaleDateString(language === "vi" ? "vi-VN" : language === "en" ? "en-US" : "zh-CN") : t("personal.notSet")}</span>
            </div>
          </div>
        )}
      </section>

      {/* Streak Section */}
      {!streakLoading && streak && (
        <section className="personal-card">
          <h2>{t("personal.streak")}</h2>
          <div className="streak-info">
            <div className="streak-stat">
              <div className="stat-value">{streak.current}</div>
              <div className="stat-label">{t("personal.streakCurrent")}</div>
            </div>
            <div className="streak-stat">
              <div className="stat-value">{streak.longest}</div>
              <div className="stat-label">{t("personal.streakLongest")}</div>
            </div>
          </div>
          <div className="weekly-chart">
            <h3>{t("personal.weekChart")}</h3>
            <div className="weekly-bars">
              {streak.weekly.map((active, idx) => (
                <div
                  key={idx}
                  className={`day-bar${active ? " active" : ""}`}
                  title={["T2", "T3", "T4", "T5", "T6", "T7", "CN"][idx]}
                >
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"][idx]}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Progress by Level Section */}
      <section className="personal-card">
        <h2>{t("personal.progress")}</h2>
        <div className="progress-grid">
          {HSK_LEVELS.map((level) => (
            <ProgressByLevel
              key={level}
              level={level}
              learned={learned}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProgressByLevel({ level, learned }) {
  const { t } = useLanguage();
  const { words } = useVocabulary(level);
  const learnedCount = words.filter((w) => learned.has(w.hanzi)).length;
  const percentage = words.length ? Math.round((learnedCount / words.length) * 100) : 0;

  return (
    <div className="progress-card">
      <div className="progress-header">
        <span className="level-name">HSK {level}</span>
        <span className="progress-percent">{percentage}{t("personal.percentage")}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
      </div>
      <div className="progress-text">
        {learnedCount}/{words.length} {t("personal.wordsLearned")}
      </div>
    </div>
  );
}
