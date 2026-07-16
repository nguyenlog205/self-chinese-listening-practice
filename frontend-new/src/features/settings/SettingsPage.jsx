import "./SettingsPage.css";
import { useLanguage } from "../../i18n/LanguageContext";

export default function SettingsPage() {
  const { t, language, setLanguage, languages } = useLanguage();

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>{t("settings.title")}</h1>
        <p>{t("settings.description")}</p>
      </div>

      <section className="settings-card">
        <h2>{t("settings.languageLabel")}</h2>
        <p className="settings-card-desc">{t("settings.languageDescription")}</p>
        <div className="language-options" role="radiogroup">
          {languages.map((option) => (
            <button
              key={option.code}
              type="button"
              role="radio"
              aria-checked={option.code === language}
              className={`language-option${option.code === language ? " active" : ""}`}
              onClick={() => setLanguage(option.code)}
            >
              <span className="language-option-flag">{option.flag}</span>
              {option.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
