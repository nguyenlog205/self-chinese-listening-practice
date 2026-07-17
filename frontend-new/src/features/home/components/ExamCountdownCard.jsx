import { Link } from "react-router-dom";
import { useLanguage } from "../../../i18n/LanguageContext";
import { localeFor } from "../../../i18n/locale";
import { getExamDate, getHskGoal } from "../../../shared/userSettings";

function daysUntil(dateStr) {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

export default function ExamCountdownCard() {
  const { t, language } = useLanguage();
  const examDate = getExamDate();
  const hskGoal = getHskGoal();

  if (!examDate) {
    return (
      <div className="exam-card">
        <h3>{t("home.exam.title")}</h3>
        <p className="exam-empty">{t("home.exam.notSet")}</p>
        <Link to="/settings" className="exam-settings-link">
          {t("home.exam.goToSettings")} →
        </Link>
      </div>
    );
  }

  const days = daysUntil(examDate);
  const locale = localeFor(language);
  const formattedDate = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${examDate}T00:00:00`));

  return (
    <div className="exam-card">
      <h3>{t("home.exam.title")}</h3>
      {days >= 0 ? (
        <div className="exam-days">
          {days} <span>{t("home.exam.daysLeft")}</span>
        </div>
      ) : (
        <p className="exam-passed">{t("home.exam.passed")}</p>
      )}
      <p className="exam-date-label">{formattedDate}</p>
      <div className="exam-goal-badge">
        {t("home.exam.goal")}: HSK {hskGoal}
      </div>
    </div>
  );
}
