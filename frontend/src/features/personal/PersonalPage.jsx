import { useMemo, useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { localeFor } from "../../i18n/locale";
import { useStreak } from "../../shared/useStreak";
import { useVocabProgress } from "../../shared/useVocabProgress";
import { useVocabulary } from "../../shared/useVocabulary";
import { useAllGrammarLevels } from "../../shared/useGrammar";
import { useGrammarProgress } from "../../shared/useGrammarProgress";
import { useAllReadingLevels } from "../../shared/useReading";
import { useReadingProgress } from "../../shared/useReadingProgress";
import DailyActivityChart from "../home/components/DailyActivityChart";
import { HSK_LEVELS } from "../hsk_materials/data/hskData";
import "./PersonalPage.css";

const YEAR_DAYS = 365;

const STORAGE = {
  NAME: "listening-app:user-name",
  HSK: "listening-app:hsk-goal",
  EXAM_DATE: "listening-app:exam-date",
};

export default function PersonalPage() {
  const { t, language } = useLanguage();
  const { streak, loading: streakLoading } = useStreak();
  const { learned } = useVocabProgress();
  const { known: grammarKnown } = useGrammarProgress();
  const { byLevel: grammarByLevel } = useAllGrammarLevels();
  const { learned: readingLearned } = useReadingProgress();
  const { byLevel: readingByLevel } = useAllReadingLevels();
  const [editMode, setEditMode] = useState(false);

  const totalGrammarPoints = useMemo(
    () => Object.values(grammarByLevel).reduce((sum, points) => sum + points.length, 0),
    [grammarByLevel]
  );
  const grammarKnownCount = useMemo(
    () =>
      Object.values(grammarByLevel).reduce(
        (sum, points) => sum + points.filter((p) => grammarKnown.has(p.id)).length,
        0
      ),
    [grammarByLevel, grammarKnown]
  );

  const totalReadingPassages = useMemo(
    () => Object.values(readingByLevel).reduce((sum, passages) => sum + passages.length, 0),
    [readingByLevel]
  );
  const readingLearnedCount = useMemo(
    () =>
      Object.values(readingByLevel).reduce(
        (sum, passages) => sum + passages.filter((p) => readingLearned.has(p.id)).length,
        0
      ),
    [readingByLevel, readingLearned]
  );

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

      {/* Overview: the four numbers that matter at a glance */}
      <section className="personal-stats">
        <div className="personal-stat-tile">
          <span className="personal-stat-value">{streakLoading ? "–" : streak?.current ?? 0}</span>
          <span className="personal-stat-label">{t("personal.streakCurrent")}</span>
        </div>
        <div className="personal-stat-tile">
          <span className="personal-stat-value">{streakLoading ? "–" : streak?.longest ?? 0}</span>
          <span className="personal-stat-label">{t("personal.streakLongest")}</span>
        </div>
        <div className="personal-stat-tile">
          <span className="personal-stat-value">{learned.size}</span>
          <span className="personal-stat-label">{t("personal.wordsKnown")}</span>
        </div>
        <div className="personal-stat-tile">
          <span className="personal-stat-value">
            {grammarKnownCount}
            <span className="personal-stat-value-total">/{totalGrammarPoints}</span>
          </span>
          <span className="personal-stat-label">{t("personal.grammarKnown")}</span>
        </div>
        <div className="personal-stat-tile">
          <span className="personal-stat-value">
            {readingLearnedCount}
            <span className="personal-stat-value-total">/{totalReadingPassages}</span>
          </span>
          <span className="personal-stat-label">{t("personal.readingLearned")}</span>
        </div>
      </section>

      <DailyActivityChart days={YEAR_DAYS} />

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
              <span className="value">
                {examDate ? new Date(examDate).toLocaleDateString(localeFor(language)) : t("personal.notSet")}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Progress by Level Section: vocabulary and grammar side by side per level */}
      <section className="personal-card">
        <h2>{t("personal.progress")}</h2>
        <div className="progress-grid">
          {HSK_LEVELS.map((level) => (
            <ProgressByLevel
              key={level}
              level={level}
              learned={learned}
              grammarKnown={grammarKnown}
              grammarPoints={grammarByLevel[level] ?? []}
              readingLearned={readingLearned}
              readingPassages={readingByLevel[level] ?? []}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProgressByLevel({
  level,
  learned,
  grammarKnown,
  grammarPoints,
  readingLearned,
  readingPassages,
}) {
  const { t } = useLanguage();
  const { words } = useVocabulary(level);
  const vocabLearnedCount = words.filter((w) => learned.has(w.hanzi)).length;
  const vocabPercent = words.length ? Math.round((vocabLearnedCount / words.length) * 100) : 0;

  const grammarKnownCount = grammarPoints.filter((p) => grammarKnown.has(p.id)).length;
  const grammarPercent = grammarPoints.length
    ? Math.round((grammarKnownCount / grammarPoints.length) * 100)
    : 0;

  const readingLearnedCount = readingPassages.filter((p) => readingLearned.has(p.id)).length;
  const readingPercent = readingPassages.length
    ? Math.round((readingLearnedCount / readingPassages.length) * 100)
    : 0;

  return (
    <div className="progress-card">
      <span className="level-name">HSK {level}</span>

      <div className="progress-row">
        <div className="progress-row-header">
          <span className="progress-row-label">{t("personal.vocabLabel")}</span>
          <span className="progress-row-count">{vocabLearnedCount}/{words.length}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${vocabPercent}%` }}></div>
        </div>
      </div>

      <div className="progress-row">
        <div className="progress-row-header">
          <span className="progress-row-label">{t("personal.grammarLabel")}</span>
          <span className="progress-row-count">{grammarKnownCount}/{grammarPoints.length}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill progress-fill-alt" style={{ width: `${grammarPercent}%` }}></div>
        </div>
      </div>

      <div className="progress-row">
        <div className="progress-row-header">
          <span className="progress-row-label">{t("personal.readingLabel")}</span>
          <span className="progress-row-count">{readingLearnedCount}/{readingPassages.length}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${readingPercent}%` }}></div>
        </div>
      </div>
    </div>
  );
}
