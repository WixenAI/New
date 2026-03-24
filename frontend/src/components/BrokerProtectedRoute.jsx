import { Navigate } from "react-router-dom";
import { useBrokerAuth } from "../context/BrokerAuthContext";
import { ACCESS_ENTRY_PATH } from "../constants/accessConfig";

export default function BrokerProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useBrokerAuth();

  if (loading) {
    return (
      <div className="app-loader">
        <div className="app-loader__orb" />
        <p>Checking access...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ACCESS_ENTRY_PATH} replace />;
  }

  return children;
}
