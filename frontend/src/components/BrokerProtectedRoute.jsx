import { Navigate } from "react-router-dom";
import { useBrokerAuth } from "../context/BrokerAuthContext";

export default function BrokerProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useBrokerAuth();

  if (loading) {
    return (
      <div className="app-loader">
        <div className="app-loader__orb" />
        <p>Loading broker panel...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/broker/login" replace />;
  }

  return children;
}
