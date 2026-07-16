import { useLanguage } from "../../../i18n/LanguageContext";
import { useDailyActivity } from "../../../shared/useDailyActivity";

const LOCALES = { vi: "vi-VN", en: "en-US", zh: "zh-CN" };

function levelFor(count) {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

// Splits the flat day list into GitHub-style week columns, padding the
// first (partial) week with nulls so every column has 7 rows (Mon..Sun).
function buildWeeks(days) {
  if (days.length === 0) return [];
  const firstWeekday = (new Date(days[0].date).getDay() + 6) % 7; // 0=Mon..6=Sun
  const padded = Array.from({ length: firstWeekday }, () => null).concat(days);
  const weeks = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }
  return weeks;
}

// A week column gets a month label when it contains that month's 1st day.
function monthLabelFor(week, locale) {
  const firstOfMonth = week.find((d) => d && new Date(d.date).getDate() === 1);
  if (!firstOfMonth) return "";
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(firstOfMonth.date));
}

export default function DailyActivityChart() {
  const { t, language } = useLanguage();
  const { days } = useDailyActivity();
  const locale = LOCALES[language] ?? LOCALES.vi;
  const weeks = buildWeeks(days);
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const dateFormatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });

  return (
    <div className="activity-card">
      <div className="activity-header">
        <h3>{t("home.activity.title")}</h3>
        <p className="activity-subtitle">
          {t("home.activity.subtitle", { count: total, days: days.length })}
        </p>
      </div>

      <div className="activity-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="activity-week">
            <span className="activity-month-label">{monthLabelFor(week, locale)}</span>
            {week.map((day, di) =>
              day ? (
                <span
                  key={di}
                  className={`activity-cell level-${levelFor(day.count)}`}
                  title={`${dateFormatter.format(new Date(day.date))}: ${day.count} ${t(
                    "home.activity.sentences"
                  )}`}
                />
              ) : (
                <span key={di} className="activity-cell empty" />
              )
            )}
          </div>
        ))}
      </div>

      <div className="activity-legend">
        <span>{t("home.activity.less")}</span>
        <span className="activity-cell level-0" />
        <span className="activity-cell level-1" />
        <span className="activity-cell level-2" />
        <span className="activity-cell level-3" />
        <span className="activity-cell level-4" />
        <span>{t("home.activity.more")}</span>
      </div>
    </div>
  );
}
