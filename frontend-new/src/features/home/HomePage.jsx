import "./HomePage.css";
import { useLanguage } from "../../i18n/LanguageContext";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="home">
      <section className="home-hero">
        <span className="home-eyebrow">{t("home.eyebrow")}</span>
        <h1>{t("home.title")}</h1>
        <p>{t("home.description")}</p>
      </section>

      <section className="home-add-card">
        <h2>{t("home.addTitle")}</h2>
        <div className="home-add-row">
          <input type="text" placeholder={t("home.addPlaceholder")} />
          <button className="btn-accent" type="button">
            {t("home.addButton")}
          </button>
        </div>
      </section>

      <section className="home-library">
        <h2>{t("home.libraryTitle")}</h2>
        <div className="home-empty">
          <div className="home-empty-mark">卷</div>
          <p>{t("home.emptyText")}</p>
        </div>
      </section>
    </div>
  );
}
