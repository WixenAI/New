import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", shortLabel: "Home" },
  { to: "/admin/brokers", label: "Brokers", shortLabel: "Brokers" },
  { to: "/admin/trades", label: "Trades", shortLabel: "Trades" },
  { to: "/admin/holdings", label: "Holdings", shortLabel: "Holdings" },
  { to: "/admin/documents", label: "Invoice Template", shortLabel: "Template" },
  { to: "/admin/settings", label: "Branding", shortLabel: "Branding" },
];

const mobilePrimaryNav = [
  { to: "/admin/dashboard", label: "Home" },
  { to: "/admin/brokers", label: "Brokers" },
  { to: "/admin/settings", label: "Branding" },
];

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, error, selectedBroker } = useAppContext();
  const { admin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    setMobileMenuOpen(false);
    await logout();
  }

  function openWorkspace(pathname) {
    setMobileMenuOpen(false);
    navigate(pathname);
  }

  if (loading) {
    return (
      <div className="app-loader">
        <div className="app-loader__orb" />
        <p>Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="shell-bg">
      {mobileMenuOpen ? <button className="mobile-sheet-backdrop" type="button" onClick={() => setMobileMenuOpen(false)} /> : null}

      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand-mark">
            <div className="brand-mark__logo">BP</div>
            <div>
              <p>Broker Platform</p>
              <span>Admin</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "sidebar-nav__link is-active" : "sidebar-nav__link")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-note">
            <span className="sidebar-note__label">Admin</span>
            <strong>{admin?.displayName || admin?.username || "Platform Admin"}</strong>
            {selectedBroker ? <p>{selectedBroker.branding?.brokerageHouseName || selectedBroker.name}</p> : null}
            <button className="btn btn--ghost sidebar-note__logout" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </aside>

        <div className="shell-main">
          {error ? <div className="alert-strip">{error}</div> : null}
          <main className="page-body">
            <Outlet />
          </main>
        </div>
      </div>

      <nav className="mobile-bottom-nav">
        {mobilePrimaryNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "mobile-bottom-nav__link is-active" : "mobile-bottom-nav__link")}
          >
            {item.label}
          </NavLink>
        ))}

        <button
          className={location.pathname.startsWith("/admin/documents") || location.pathname.startsWith("/admin/trades") || location.pathname.startsWith("/admin/holdings") ? "mobile-bottom-nav__link is-active" : "mobile-bottom-nav__link"}
          type="button"
          onClick={() => setMobileMenuOpen(true)}
        >
          More
        </button>
      </nav>

      <div className={mobileMenuOpen ? "mobile-sheet is-open" : "mobile-sheet"}>
        <div className="mobile-sheet__header">
          <div>
            <span className="page-header__eyebrow">Admin Menu</span>
            <h3>{admin?.displayName || admin?.username || "Platform Admin"}</h3>
          </div>

          <button className="btn btn--ghost" type="button" onClick={() => setMobileMenuOpen(false)}>
            Close
          </button>
        </div>

        {selectedBroker ? (
          <div className="mobile-sheet__broker">
            <strong>{selectedBroker.branding?.brokerageHouseName || selectedBroker.name}</strong>
            <span>Token ID {selectedBroker.tokenId}</span>
          </div>
        ) : null}

        <div className="mobile-sheet__nav">
          {navItems.map((item) => (
            <button
              key={item.to}
              className={location.pathname.startsWith(item.to) ? "mobile-sheet__link is-active" : "mobile-sheet__link"}
              type="button"
              onClick={() => openWorkspace(item.to)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button className="btn btn--primary mobile-sheet__logout" type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
