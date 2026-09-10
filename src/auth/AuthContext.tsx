import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api/client";

interface AuthState {
  token: string | null;
  role: "volunteer" | "field_team" | "admin" | "guardian" | null;
  name: string | null;
  ready: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<AuthState["role"]>(null);
  const [name, setName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const [storedToken, storedRole, storedName] = await Promise.all([
        AsyncStorage.getItem("s360_token"),
        AsyncStorage.getItem("s360_role"),
        AsyncStorage.getItem("s360_name"),
      ]);
      setToken(storedToken);
      setRole(storedRole as AuthState["role"]);
      setName(storedName);
      setReady(true);
    })();
  }, []);

  async function login(phone: string, password: string) {
    const { data } = await api.post("/auth/login", { phone, password });
    await AsyncStorage.multiSet([
      ["s360_token", data.access_token],
      ["s360_role", data.role],
      ["s360_name", data.name],
    ]);
    setToken(data.access_token);
    setRole(data.role);
    setName(data.name);
  }

  async function logout() {
    await AsyncStorage.multiRemove(["s360_token", "s360_role", "s360_name"]);
    setToken(null);
    setRole(null);
    setName(null);
  }

  return <AuthContext.Provider value={{ token, role, name, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
