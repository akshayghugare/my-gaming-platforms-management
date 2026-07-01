import { createContext, useContext, useMemo, useState, type ReactNode, type FC } from 'react';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import type { AuthContextType, AuthUser, JwtPayload } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_KEY = 'token';
const EXPIRY_KEY = 'token_expiry';

const getValidToken = (): string | null => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const expiry = sessionStorage.getItem(EXPIRY_KEY);

  if (token && expiry && Date.now() < Number(expiry)) {
    return token;
  }

  sessionStorage.clear();
  return null;
};

/** Safely decode the access token into an AuthUser (id, email, role). */
const decodeUser = (token: string | null): AuthUser | null => {
  if (!token) {
    return null;
  }

  try {
    const payload = jwtDecode<JwtPayload>(token);
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
};

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getValidToken());

  const login = (newToken: string): void => {
    const expiryTime = Date.now() + 30 * 60 * 1000;

    sessionStorage.setItem(TOKEN_KEY, newToken);
    sessionStorage.setItem(EXPIRY_KEY, expiryTime.toString());

    setToken(newToken);
  };

  const logout = (): void => {
    sessionStorage.clear();
    setToken(null);
    toast.success('Logged out successfully');
  };

  const value = useMemo<AuthContextType>(() => {
    const user = decodeUser(token);
    const role = user?.role ?? '';

    return {
      token,
      user,
      role,
      isAdmin: role === 'ADMIN',
      login,
      logout,
    };
  }, [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
