import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Trang chủ", end: true },
  { to: "/listening", label: "Luyện nghe" },
];

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">听</div>
        <div className="sidebar-brand-text">
          <strong>听力练习</strong>
          <span>Luyện nghe tiếng Trung</span>
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
    </nav>
  );
}
