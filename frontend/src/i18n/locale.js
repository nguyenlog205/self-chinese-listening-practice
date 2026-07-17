// BCP-47 locale per app language, for Intl.DateTimeFormat call sites.
// Single source of truth so adding a language (e.g. zh-TW) doesn't require
// hunting down every component that formats a date.
const LOCALES = { vi: "vi-VN", en: "en-US", zh: "zh-CN", "zh-TW": "zh-TW" };

export function localeFor(language) {
  return LOCALES[language] ?? LOCALES.vi;
}

// Labels for the last 7 calendar days ending today (oldest first), matching
// the backend's `weekly` streak array (`today - (6-i)` days) — NOT a
// fixed Mon..Sun week.
export function last7DayLabels(language, { weekday = "narrow" } = {}) {
  const formatter = new Intl.DateTimeFormat(localeFor(language), { weekday });
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return formatter.format(d);
  });
}
