import { NavLink, Outlet } from "react-router-dom";

const brokerNavItems = [
  { to: "/broker/dashboard", label: "Home" },
  { to: "/broker/customers", label: "Customers" },
  { to: "/broker/trades", label: "Trades" },
  { to: "/broker/invoice", label: "Invoice" },
  { to: "/broker/profile", label: "Profile" },
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
