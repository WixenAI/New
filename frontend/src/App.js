import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppShell from "./components/AppShell";
import BrokerProtectedRoute from "./components/BrokerProtectedRoute";
import BrokerShell from "./components/BrokerShell";
import ProtectedRoute from "./components/ProtectedRoute";
import { AppProvider } from "./context/AppContext";
import { AuthProvider } from "./context/AuthContext";
import { BrokerAuthProvider } from "./context/BrokerAuthContext";
import { ACCESS_ENTRY_PATH, ACCOUNT_ROUTES, mapLegacyBrokerPath } from "./constants/accessConfig";
import BrokerInvoicePage from "./pages/broker/BrokerInvoicePage";
import BrokerDashboardPage from "./pages/broker/BrokerDashboardPage";
import BrokerCustomersPage from "./pages/broker/BrokerCustomersPage";
import BrokerLoginPage from "./pages/broker/BrokerLoginPage";
import BrokerProfilePage from "./pages/broker/BrokerProfilePage";
import BrokerTradesPage from "./pages/broker/BrokerTradesPage";
import BrokersPage from "./pages/BrokersPage";
import DashboardPage from "./pages/DashboardPage";
import DocumentsPage from "./pages/DocumentsPage";
import HoldingsPage from "./pages/HoldingsPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import TradesPage from "./pages/TradesPage";

function ProtectedAdminLayout() {
  return (
    <ProtectedRoute>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </ProtectedRoute>
  );
}

function ProtectedBrokerLayout() {
  return (
    <BrokerProtectedRoute>
      <BrokerShell />
    </BrokerProtectedRoute>
  );
}

function LegacyBrokerRedirect() {
  const location = useLocation();

  return <Navigate to={mapLegacyBrokerPath(location.pathname, location.search, location.hash)} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BrokerAuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to={ACCESS_ENTRY_PATH} replace />} />
            <Route path="/app/*" element={<Navigate to="/admin/dashboard" replace />} />

            <Route path="/admin/login" element={<LoginPage />} />
            <Route path="/admin" element={<ProtectedAdminLayout />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="brokers" element={<BrokersPage />} />
              <Route path="overview" element={<Navigate to="/admin/brokers" replace />} />
              <Route path="clients" element={<Navigate to="/admin/brokers" replace />} />
              <Route path="trades" element={<TradesPage />} />
              <Route path="holdings" element={<HoldingsPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="brokerage" element={<Navigate to="/admin/brokers" replace />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>

            <Route path={ACCESS_ENTRY_PATH} element={<BrokerLoginPage />} />
            <Route path="/account" element={<ProtectedBrokerLayout />}>
              <Route path="dashboard" element={<BrokerDashboardPage />} />
              <Route path="customers" element={<BrokerCustomersPage />} />
              <Route path="trades" element={<BrokerTradesPage />} />
              <Route path="invoice" element={<BrokerInvoicePage />} />
              <Route path="profile" element={<BrokerProfilePage />} />
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>

            <Route path="/broker/login" element={<Navigate to={ACCESS_ENTRY_PATH} replace />} />
            <Route path="/broker" element={<Navigate to={ACCOUNT_ROUTES.dashboard} replace />} />
            <Route path="/broker/*" element={<LegacyBrokerRedirect />} />

            <Route path="*" element={<Navigate to={ACCESS_ENTRY_PATH} replace />} />
          </Routes>
        </BrokerAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
