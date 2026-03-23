import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api, { AUTH_STORAGE_KEY } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function hydrateAuth() {
      const token = localStorage.getItem(AUTH_STORAGE_KEY);

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/api/auth/me");
        setAdmin(response.data.admin);
      } catch (error) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    }

    hydrateAuth();
  }, []);

  async function login(username, password) {
    const response = await api.post("/api/auth/login", { username, password });
    localStorage.setItem(AUTH_STORAGE_KEY, response.data.token);
    setAdmin(response.data.admin);
    return response.data.admin;
  }

  async function logout() {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      // Ignore logout errors because removing the local token is enough for this client.
    } finally {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setAdmin(null);
    }
  }

  const value = useMemo(
    () => ({
      admin,
      isAuthenticated: Boolean(admin),
      loading,
      login,
      logout,
    }),
    [admin, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
