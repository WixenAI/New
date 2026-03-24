import { NavLink, Outlet } from "react-router-dom";
import { ACCOUNT_ROUTES } from "../constants/accessConfig";

const brokerNavItems = [
  { to: ACCOUNT_ROUTES.dashboard, label: "Home" },
  { to: ACCOUNT_ROUTES.customers, label: "Customers" },
  { to: ACCOUNT_ROUTES.trades, label: "Trades" },
  { to: ACCOUNT_ROUTES.invoice, label: "Invoice" },
  { to: ACCOUNT_ROUTES.profile, label: "Profile" },
];

export default function BrokerShell() {
  return (
    <div className="shell-bg broker-shell-bg">
      <div className="broker-shell">
        <nav className="mobile-bottom-nav broker-bottom-nav">
          {brokerNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "mobile-bottom-nav__link is-active" : "mobile-bottom-nav__link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
