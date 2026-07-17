import { useLanguage } from "../../../i18n/LanguageContext";
import { last7DayLabels } from "../../../i18n/locale";
import { useStreak } from "../../../shared/useStreak";

export default function StreakCard() {
  const { t, language } = useLanguage();
  const { streak } = useStreak();
  const labels = last7DayLabels(language);

  return (
    <div className="streak-card">
      <div className="streak-header">
        <span className="streak-flame">🔥</span>
        <div>
          <div className="streak-current">
            {streak.current} <span>{t("home.streak.days")}</span>
          </div>
          <p className="streak-subtitle">{t("home.streak.subtitle")}</p>
        </div>
      </div>

      <div className="streak-week">
        {streak.weekly.map((done, i) => (
          <div key={i} className={`streak-day${done ? " done" : ""}`}>
            <span className="streak-day-label">{labels[i]}</span>
            <span className="streak-day-dot" />
          </div>
        ))}
      </div>

      <div className="streak-best">
        {t("home.streak.longest")}: <strong>{streak.longest}</strong> {t("home.streak.days")}
      </div>
    </div>
  );
}
