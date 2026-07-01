import apiService from '@/services/api';
import type { PaginatedData } from '@/types';

// ─── API record shapes (backend, snake_case) ──────────────────────────────────
export interface CasinoGameRecord {
  id: string;
  name: string;
  provider: string;
  category: string;
  game_thumbnail: string | null;
  tournament_widget_thumbnail: string | null;
  bonus_buy_allow: boolean;
  device_support: { mobile: boolean; desktop: boolean };
  created_at?: string;
  updated_at?: string;
}

export interface CasinoSimpleRecord {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CasinoGamePayload {
  id?: string;
  name: string;
  provider: string;
  category: string;
  game_thumbnail?: string | null;
  tournament_widget_thumbnail?: string | null;
  bonus_buy_allow: boolean;
  device_support: { mobile: boolean; desktop: boolean };
}

type ListParams = Record<string, string | number | undefined>;

const BASE = '/casino-catalog';

// ─── Games ────────────────────────────────────────────────────────────────────
export const casinoGamesApi = {
  paginate: (params: ListParams) =>
    apiService.get<PaginatedData<CasinoGameRecord>>(`${BASE}/games/paginate`, params),
  create: (payload: CasinoGamePayload) =>
    apiService.post<CasinoGameRecord>(`${BASE}/games/add`, payload),
  update: (id: string, payload: Omit<CasinoGamePayload, 'id'>) =>
    apiService.post<CasinoGameRecord>(`${BASE}/games/update-by/${id}`, payload),
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const casinoCategoriesApi = {
  paginate: (params: ListParams) =>
    apiService.get<PaginatedData<CasinoSimpleRecord>>(`${BASE}/categories/paginate`, params),
  create: (payload: { id: string; name: string }) =>
    apiService.post<CasinoSimpleRecord>(`${BASE}/categories/add`, payload),
  update: (id: string, payload: { name: string }) =>
    apiService.post<CasinoSimpleRecord>(`${BASE}/categories/update-by/${id}`, payload),
};

// ─── Providers ────────────────────────────────────────────────────────────────
export const casinoProvidersApi = {
  paginate: (params: ListParams) =>
    apiService.get<PaginatedData<CasinoSimpleRecord>>(`${BASE}/providers/paginate`, params),
  create: (payload: { id: string; name: string }) =>
    apiService.post<CasinoSimpleRecord>(`${BASE}/providers/add`, payload),
  update: (id: string, payload: { name: string }) =>
    apiService.post<CasinoSimpleRecord>(`${BASE}/providers/update-by/${id}`, payload),
};
