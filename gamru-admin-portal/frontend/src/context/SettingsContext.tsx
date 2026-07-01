import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type FC,
  type ReactNode,
} from 'react';
import apiService from '@/services/api';
import { settingsApi } from '@/services/systemSettings.service';
import { useAuth } from './AuthContext';
import type { ApiResponse } from '@/types';

export const SIDEBAR_MODULE_KEYS = [
  'dashboard',
  'players',
  'crm',
  'gamification',
  'settings',
  'configurations',
] as const;
export type SidebarModuleKey = (typeof SIDEBAR_MODULE_KEYS)[number];

const DEFAULTS: SidebarModuleKey[] = [...SIDEBAR_MODULE_KEYS];

interface SettingsContextValue {
  enabledSidebarModules: SidebarModuleKey[];
  enabledWidgets: string[];
  isAdmin: boolean;
  loaded: boolean;
  setEnabledSidebarModules: (next: string[]) => void;
  setEnabledWidgets: (next: string[]) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<SettingsContextValue | undefined>(undefined);

const sanitizeModules = (list: unknown): SidebarModuleKey[] => {
  if (!Array.isArray(list)) return DEFAULTS;
  const valid = SIDEBAR_MODULE_KEYS as readonly string[];
  return list.filter((k): k is SidebarModuleKey => typeof k === 'string' && valid.includes(k));
};

interface MeResponse {
  role?: string;
}

export const SettingsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [enabledSidebarModules, setEnabledSidebarModulesState] =
    useState<SidebarModuleKey[]>(DEFAULTS);
  const [enabledWidgets, setEnabledWidgetsState] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!token) {
      setLoaded(false);
      setEnabledSidebarModulesState(DEFAULTS);
      setEnabledWidgetsState([]);
      setIsAdmin(false);
      return;
    }
    try {
      const [me, widgets] = await Promise.all([
        apiService.get<MeResponse>('/users/me'),
        settingsApi.getByPanel('widgets'),
      ]);
      const role = (me as ApiResponse<MeResponse>)?.data?.role ?? '';
      setIsAdmin(role.toUpperCase() === 'ADMIN');

      const data = widgets?.data ?? {};
      setEnabledSidebarModulesState(sanitizeModules(data.enabled_sidebar_modules));
      setEnabledWidgetsState(
        Array.isArray(data.enabled_widgets) ? (data.enabled_widgets as string[]) : []
      );
    } catch {
      // keep defaults on failure
    } finally {
      setLoaded(true);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value: SettingsContextValue = {
    enabledSidebarModules,
    enabledWidgets,
    isAdmin,
    loaded,
    setEnabledSidebarModules: (next) => setEnabledSidebarModulesState(sanitizeModules(next)),
    setEnabledWidgets: (next) => setEnabledWidgetsState(Array.isArray(next) ? next : []),
    refresh,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAppSettings = (): SettingsContextValue => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppSettings must be used within SettingsProvider');
  return ctx;
};

/**
 * Returns true if the given module should be visible in the sidebar.
 * `settings` is always visible so admins cannot lock themselves out of
 * the panel that controls these toggles.
 */
export const useIsModuleVisible = (): ((key: SidebarModuleKey) => boolean) => {
  const { enabledSidebarModules } = useAppSettings();
  return (key: SidebarModuleKey) =>
    key === 'settings' || key === 'configurations' || enabledSidebarModules.includes(key);
};
