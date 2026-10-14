import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  bootstrapSession,
  login as apiLogin,
  registerAndLogin as apiRegister,
  loginWithGoogle as apiGoogleLogin,
  loginMaster as apiMasterLogin,
  logout as apiLogout,
  clearSession,
  clearV2Session,
  ensureV2Session,
  revokeV2Device,
  type User,
} from '@/design-revamp/lib/api';

/** Best-effort v2 workflow session upgrade after a v1 user sign-in. */
function upgradeV2Session() {
  ensureV2Session().catch(() => {
    // Staff pages degrade gracefully when the v2 session is unavailable
    // (e.g. master logins, which intentionally stay on the v1 API).
  });
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (identifier: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; idNumber: string; phone: string; password: string }) => Promise<User>;
  loginWithGoogle: (idToken: string) => Promise<User>;
  loginMaster: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const sessionUser = await bootstrapSession();
        if (!cancelled && sessionUser) {
          setUser(sessionUser);
          if (sessionUser.authType !== 'master') upgradeV2Session();
        }
      } catch {
        clearSession();
        clearV2Session();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const nextUser = await apiLogin({ identifier, password });
    setUser(nextUser);
    upgradeV2Session();
    return nextUser;
  }, []);

  const register = useCallback(async (data: { name: string; email: string; idNumber: string; phone: string; password: string }) => {
    const nextUser = await apiRegister(data);
    setUser(nextUser);
    upgradeV2Session();
    return nextUser;
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const nextUser = await apiGoogleLogin(idToken);
    setUser(nextUser);
    upgradeV2Session();
    return nextUser;
  }, []);

  const loginMaster = useCallback(async (username: string, password: string) => {
    const nextUser = await apiMasterLogin({ username, password });
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await revokeV2Device().catch(() => undefined);
      await apiLogout();
    } finally {
      clearSession();
      clearV2Session();
      setUser(null);
      window.history.replaceState(null, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const sessionUser = await bootstrapSession();
    if (sessionUser) setUser(sessionUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithGoogle,
        loginMaster,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
