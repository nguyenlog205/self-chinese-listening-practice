import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { GROUPS } from "./registry";
import "./ListeningPage.css";

export default function ListeningPage() {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState(null);

  for (const g of GROUPS) {
    const section = g.sections.find((s) => s.key === activeSection);
    if (section) {
      const SectionComponent = section.component;
      return (
        <div className="listening-page">
          <button type="button" className="listening-back-btn" onClick={() => setActiveSection(null)}>
            ← {t("listening.common.back")}
          </button>
          <div className="listening-page-header">
            <h1>{t(`listening.tab.${section.key}`)}</h1>
            <p>{t(`listening.menu.${section.key}`)}</p>
          </div>
          <div className="listening-content">
            <SectionComponent />
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
                onClick={() => setActiveSection(s.key)}
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
