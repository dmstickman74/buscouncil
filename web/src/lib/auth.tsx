import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api, ApiError } from "./api";
import type { WhoAmI } from "./types";

interface AuthState {
  identity: WhoAmI | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: string) => boolean;
  refresh: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<WhoAmI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIdentity = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api<WhoAmI>("/me");
      setIdentity(data);
      setError(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setIdentity(null);
      } else {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdentity();
  }, [fetchIdentity]);

  const login = useCallback(
    async (email: string, password: string) => {
      await api("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await fetchIdentity();
    },
    [fetchIdentity],
  );

  const logout = useCallback(async () => {
    try {
      await api("/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setIdentity(null);
  }, []);

  const can = useCallback(
    (permission: string) => {
      if (!identity) return false;
      return permission in identity.permissions;
    },
    [identity],
  );

  return (
    <AuthContext value={{ identity, loading, error, login, logout, can, refresh: fetchIdentity }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
