import { useLanguage } from "../i18n/LanguageContext";

// Suspense fallback for lazy-loaded routes/tabs. Inline-styled (not a class
// from a feature's own CSS file) since this can render before that
// feature's chunk -- and its stylesheet -- has loaded.
export default function RouteLoading() {
  const { t } = useLanguage();
  return (
    <p style={{ padding: "24px", color: "var(--text-muted)", fontSize: "14px" }}>
      {t("common.loading")}
    </p>
  );
}
