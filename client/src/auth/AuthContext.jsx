import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiClient } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("velura_token"));
  const [isBooting, setIsBooting] = useState(Boolean(token));

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      if (!token) {
        setIsBooting(false);
        return;
      }

      try {
        const { data } = await apiClient.get("/auth/me");
        if (!ignore) {
          setUser(data.user);
        }
      } catch {
        localStorage.removeItem("velura_token");
        if (!ignore) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setIsBooting(false);
        }
      }
    }

    loadProfile();

    return () => {
      ignore = true;
    };
  }, [token]);

  async function login(payload) {
    const { data } = await apiClient.post("/auth/login", payload);
    localStorage.setItem("velura_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("velura_token");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(user),
      isBooting,
      login,
      logout,
      token,
      user
    }),
    [isBooting, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
