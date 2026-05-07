/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ACCESS_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
} from '@/services/authStorage';
import type { LoginSession } from '@/services/authService';
import type { User } from '@/types/domain';

type StoredAuthState = {
  token: string | null;
  user: User | null;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (session: LoginSession) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadStoredAuthState(): StoredAuthState {
  const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!token || !storedUser) {
    return { token: null, user: null };
  }

  try {
    return {
      token,
      user: JSON.parse(storedUser) as User,
    };
  } catch {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);

    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<StoredAuthState>(() =>
    loadStoredAuthState(),
  );

  const login = useCallback((session: LoginSession) => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, session.token);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(session.user));
    setAuthState({
      token: session.token,
      user: session.user,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    setAuthState({ token: null, user: null });
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({
      user: authState.user,
      token: authState.token,
      isAuthenticated: Boolean(authState.token && authState.user),
      login,
      logout,
    }),
    [authState.token, authState.user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider');
  }

  return context;
}
