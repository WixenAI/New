import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BROKER_AUTH_STORAGE_KEY, LEGACY_BROKER_AUTH_STORAGE_KEY, brokerApi, publicApi } from "../api/client";

const BrokerAuthContext = createContext(null);

export function BrokerAuthProvider({ children }) {
  const [broker, setBroker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function hydrateBrokerAuth() {
      const token = localStorage.getItem(BROKER_AUTH_STORAGE_KEY) || localStorage.getItem(LEGACY_BROKER_AUTH_STORAGE_KEY);
      if (!token) {
        setLoading(false);
        return;
      }

      localStorage.setItem(BROKER_AUTH_STORAGE_KEY, token);

      try {
        const response = await brokerApi.get("/api/access/me");
        setBroker(response.data.broker);
      } catch (error) {
        localStorage.removeItem(BROKER_AUTH_STORAGE_KEY);
        localStorage.removeItem(LEGACY_BROKER_AUTH_STORAGE_KEY);
        setBroker(null);
      } finally {
        setLoading(false);
      }
    }

    hydrateBrokerAuth();
  }, []);

  async function login(tokenId) {
    const response = await publicApi.post("/api/access/login", { tokenId });
    localStorage.setItem(BROKER_AUTH_STORAGE_KEY, response.data.token);
    localStorage.removeItem(LEGACY_BROKER_AUTH_STORAGE_KEY);
    setBroker(response.data.broker);
    return response.data.broker;
  }

  async function refreshBroker() {
    const response = await brokerApi.get("/api/access/me");
    setBroker(response.data.broker);
    return response.data.broker;
  }

  async function logout() {
    try {
      await brokerApi.post("/api/access/logout");
    } catch (error) {
      // Token removal is enough to end the local broker session.
    } finally {
      localStorage.removeItem(BROKER_AUTH_STORAGE_KEY);
      localStorage.removeItem(LEGACY_BROKER_AUTH_STORAGE_KEY);
      setBroker(null);
    }
  }

  const value = useMemo(
    () => ({
      broker,
      isAuthenticated: Boolean(broker),
      loading,
      login,
      logout,
      refreshBroker,
    }),
    [broker, loading]
  );

  return <BrokerAuthContext.Provider value={value}>{children}</BrokerAuthContext.Provider>;
}

export function useBrokerAuth() {
  const context = useContext(BrokerAuthContext);
  if (!context) {
    throw new Error("useBrokerAuth must be used within BrokerAuthProvider.");
  }

  return context;
}
