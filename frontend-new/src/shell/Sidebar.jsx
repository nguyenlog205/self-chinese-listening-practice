import { NavLink } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

export default function Sidebar() {
  const { t } = useLanguage();

  const navItems = [
    { to: "/", label: t("nav.home"), end: true },
    { to: "/listening", label: t("nav.listening") },
    { to: "/hsk", label: t("nav.hsk") },
    { to: "/about", label: t("nav.about") }
    ];

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">听</div>
        <div className="sidebar-brand-text">
          <strong>{t("brand.title")}</strong>
          <span>{t("brand.subtitle")}</span>
        </div>
      </div>

      <ul>
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.end}>
              <span className="nav-dot" />
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <ul className="sidebar-bottom">
        <li>
          <NavLink to="/personal">
            <span className="nav-dot" />
            {t("nav.personal")}
          </NavLink>
        </li>
        <li>
          <NavLink to="/settings">
            <span className="nav-dot" />
            {t("nav.settings")}
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
