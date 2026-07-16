import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/listening", label: "Listening Practice" },
];

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">听力 App</div>
      <ul>
        {navItems.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}