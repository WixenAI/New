import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const AppContext = createContext(null);
const STORAGE_KEY = "broker-platform:selected-broker";

export function AppProvider({ children }) {
  const [brokers, setBrokers] = useState([]);
  const [selectedBrokerId, setSelectedBrokerId] = useState(localStorage.getItem(STORAGE_KEY) || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refreshBrokers() {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/api/brokers");
      setBrokers(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Failed to load brokers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshBrokers();
  }, []);

  useEffect(() => {
    if (!brokers.length) {
      localStorage.removeItem(STORAGE_KEY);
      setSelectedBrokerId("");
      return;
    }

    const stillExists = brokers.some((broker) => broker._id === selectedBrokerId);
    if (selectedBrokerId && stillExists) {
      localStorage.setItem(STORAGE_KEY, selectedBrokerId);
      return;
    }

    localStorage.setItem(STORAGE_KEY, brokers[0]._id);
    setSelectedBrokerId(brokers[0]._id);
  }, [brokers, selectedBrokerId]);

  async function createBroker(payload) {
    const response = await api.post("/api/brokers", payload);
    setBrokers((current) => [...current, response.data]);
    setSelectedBrokerId(response.data._id);
    localStorage.setItem(STORAGE_KEY, response.data._id);
    return response.data;
  }

  async function updateBroker(brokerId, payload) {
    const response = await api.patch(`/api/brokers/${brokerId}`, payload);
    setBrokers((current) => current.map((broker) => (broker._id === brokerId ? response.data : broker)));
    return response.data;
  }

  async function deleteBroker(brokerId) {
    await api.delete(`/api/brokers/${brokerId}`);
    setBrokers((current) => current.filter((broker) => broker._id !== brokerId));
  }

  const selectedBroker = useMemo(
    () => brokers.find((broker) => broker._id === selectedBrokerId) || null,
    [brokers, selectedBrokerId]
  );

  const value = useMemo(
    () => ({
      brokers,
      selectedBroker,
      selectedBrokerId,
      setSelectedBrokerId,
      loading,
      error,
      refreshBrokers,
      createBroker,
      updateBroker,
      deleteBroker,
    }),
    [brokers, selectedBroker, selectedBrokerId, loading, error]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider.");
  }

  return context;
}
