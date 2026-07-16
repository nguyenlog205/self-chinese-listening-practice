import "./HomePage.css";
import { useLanguage } from "../../i18n/LanguageContext";
import { getUserName } from "../../shared/userSettings";
import StreakCard from "./components/StreakCard";

export default function HomePage() {
  const { t } = useLanguage();
  const name = getUserName();

  return (
    <div className="home-layout">
      <div className="home">
        <section className="home-hero">
          <span className="home-eyebrow">{t("home.eyebrow")}</span>
          <h1>{name ? t("home.titleWithName", { name }) : t("home.title")}</h1>
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

      <aside className="home-side">
        <StreakCard />
      </aside>
    </div>
  );
}
