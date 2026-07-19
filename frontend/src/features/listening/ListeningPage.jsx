import { Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import RouteLoading from "../../shell/RouteLoading";
import { GROUPS } from "./registry";
import "./ListeningPage.css";

export default function ListeningPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { sectionKey } = useParams();

  for (const g of GROUPS) {
    const section = g.sections.find((s) => s.key === sectionKey);
    if (section) {
      const SectionComponent = section.component;
      return (
        <div className="listening-page">
          <button type="button" className="listening-back-btn" onClick={() => navigate("/listening")}>
            ← {t("listening.common.back")}
          </button>
          <div className="listening-page-header">
            <h1>{t(`listening.tab.${section.key}`)}</h1>
            <p>{t(`listening.menu.${section.key}`)}</p>
          </div>
          <div className="listening-content">
            <Suspense fallback={<RouteLoading />}>
              <SectionComponent />
            </Suspense>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="listening-page">
      <div className="listening-page-header">
        <h1>{t("listening.title")}</h1>
        <p>{t("listening.description")}</p>
      </div>

      {GROUPS.map((g) => (
        <section key={g.key} className="listening-group">
          <h2 className="listening-group-title">{t(`listening.group.${g.key}.title`)}</h2>
          <p className="listening-group-desc">{t(`listening.group.${g.key}.desc`)}</p>
          <div className="listening-menu-grid">
            {g.sections.map((s) => (
              <button
                key={s.key}
                type="button"
                className="listening-menu-card"
                onClick={() => navigate(`/listening/${s.key}`)}
              >
                <span className="listening-menu-icon">{s.icon}</span>
                <span className="listening-menu-title">{t(`listening.tab.${s.key}`)}</span>
                <span className="listening-menu-desc">{t(`listening.menu.${s.key}`)}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
