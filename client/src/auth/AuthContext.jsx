import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiClient } from "../api/client.js";

const AuthContext = createContext(null);

function readCachedUser() {
  if (!localStorage.getItem("velura_token")) {
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem("velura_user") || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readCachedUser());
  const [token, setToken] = useState(() => localStorage.getItem("velura_token"));
  const [isBooting, setIsBooting] = useState(() => Boolean(localStorage.getItem("velura_token") && !readCachedUser()));

  useEffect(() => {
    let ignore = false;

    async function loadProfile() {
      if (!token) {
        localStorage.removeItem("velura_user");
        setUser(null);
        setIsBooting(false);
        return;
      }

      try {
        const { data } = await apiClient.get("/auth/me");
        if (!ignore) {
          setUser(data.user);
          localStorage.setItem("velura_user", JSON.stringify(data.user));
        }
      } catch {
        localStorage.removeItem("velura_token");
        localStorage.removeItem("velura_user");
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
    localStorage.setItem("velura_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("velura_token");
    localStorage.removeItem("velura_user");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(token && user),
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
