import { createContext, useContext, useEffect, useState, type FC, type ReactNode } from 'react';
import apiService from '@/services/api';
import type { ThemeName } from '@/types/profile';

interface ThemeContextType {
  theme: ThemeName;
  /** Apply a theme locally only (e.g. after loading the user from the server). */
  applyTheme: (theme: ThemeName) => void;
  /** Apply + persist the theme to the backend for the logged-in user. */
  saveTheme: (theme: ThemeName) => Promise<boolean>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'app_theme';
const DEFAULT_THEME: ThemeName = 'dark';

const setDocumentTheme = (theme: ThemeName): void => {
  document.documentElement.setAttribute('data-theme', theme);
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeName>(
    (sessionStorage.getItem(STORAGE_KEY) as ThemeName) || DEFAULT_THEME
  );

  useEffect(() => {
    setDocumentTheme(theme);
  }, [theme]);

  const applyTheme = (next: ThemeName): void => {
    sessionStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  };

  const saveTheme = async (next: ThemeName): Promise<boolean> => {
    const previous = theme;
    applyTheme(next); // optimistic
    try {
      const res = await apiService.patch('/users/me', { theme: next });
      if (!res?.success) {
        applyTheme(previous);
        return false;
      }
      return true;
    } catch {
      applyTheme(previous);
      return false;
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, applyTheme, saveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};
