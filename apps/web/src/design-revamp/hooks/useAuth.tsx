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
import { toast } from 'sonner';

type LoginRole = 'public' | 'cleaner' | 'supervisor' | 'master';

const ROLE_MISMATCH_MESSAGE = 'Unauthorized: Please use the correct login portal for your role.';

function requireLoginRole(user: User, expectedRole?: LoginRole) {
  if (expectedRole && user.role !== expectedRole) {
    clearSession();
    clearV2Session();
    toast.error(ROLE_MISMATCH_MESSAGE);
    throw new Error(ROLE_MISMATCH_MESSAGE);
  }
  return user;
}

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
  login: (identifier: string, password: string, expectedRole?: LoginRole) => Promise<User>;
  register: (data: { name: string; email: string; idNumber: string; phone: string; password: string }) => Promise<User>;
  loginWithGoogle: (idToken: string, expectedRole?: LoginRole) => Promise<User>;
  loginMaster: (username: string, password: string, expectedRole?: LoginRole) => Promise<User>;
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

  const login = useCallback(async (identifier: string, password: string, expectedRole?: LoginRole) => {
    const nextUser = await apiLogin({ identifier, password });
    requireLoginRole(nextUser, expectedRole);
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

  const loginWithGoogle = useCallback(async (idToken: string, expectedRole?: LoginRole) => {
    const nextUser = await apiGoogleLogin(idToken);
    requireLoginRole(nextUser, expectedRole);
    setUser(nextUser);
    upgradeV2Session();
    return nextUser;
  }, []);

  const loginMaster = useCallback(async (username: string, password: string, expectedRole?: LoginRole) => {
    const nextUser = await apiMasterLogin({ username, password });
    requireLoginRole(nextUser, expectedRole);
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
