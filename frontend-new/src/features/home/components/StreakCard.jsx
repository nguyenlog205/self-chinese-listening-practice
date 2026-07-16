import { useLanguage } from "../../../i18n/LanguageContext";
import { useStreak } from "../../../shared/useStreak";

const LOCALES = { vi: "vi-VN", en: "en-US", zh: "zh-CN" };

function last7DayLabels(language) {
  const locale = LOCALES[language] ?? LOCALES.vi;
  const formatter = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return formatter.format(d);
  });
}

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
