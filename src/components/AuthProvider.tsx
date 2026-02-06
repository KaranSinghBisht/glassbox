"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Button, Card } from "@/components/ui/primitives";
import { Lock, LogOut } from "lucide-react";

interface AuthState {
  authRequired: boolean;
  authenticated: boolean;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function LoginModal({ onLogin }: { onLogin: (token: string) => Promise<boolean> }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    setError("");

    const success = await onLogin(token);
    if (!success) {
      setError("Invalid token");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 bg-slate-900 border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Authentication Required</h2>
            <p className="text-sm text-slate-400">Enter admin token to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter GLASSBOX_ADMIN_TOKEN"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-4 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all placeholder:text-slate-500 mb-4"
            autoFocus
          />

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          <Button type="submit" disabled={loading || !token.trim()} className="w-full">
            {loading ? "Authenticating..." : "Login"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export interface AuthProviderProps {
  children: ReactNode;
  initialAuthRequired?: boolean;
  initialAuthenticated?: boolean;
}

export function AuthProvider({
  children,
  initialAuthRequired = false,
  initialAuthenticated = true,
}: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(() => ({
    authRequired: initialAuthRequired,
    authenticated: initialAuthenticated,
    loading: false,
  }));

  const login = async (token: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        setState((s) => ({ ...s, authenticated: true }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState((s) => ({ ...s, authenticated: false }));
  };

  if (state.loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  const showLogin = state.authRequired && !state.authenticated;

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {showLogin && <LoginModal onLogin={login} />}
      {children}
    </AuthContext.Provider>
  );
}

export function LogoutButton() {
  const { authRequired, logout } = useAuth();

  if (!authRequired) return null;

  return (
    <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5">
      <LogOut className="w-3 h-3" />
      Logout
    </Button>
  );
}
