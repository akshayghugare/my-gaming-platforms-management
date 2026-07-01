import apiService from '@/services/api';
import type { PaginatedData } from '@/types';

// ─── API record shapes (backend) ──────────────────────────────────────────────
export interface SportSimpleRecord {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface SportTeamRecord {
  id: string;
  name: string;
  sport: string | null;
  tournament: string | null;
  created_at?: string;
  updated_at?: string;
}

type ListParams = Record<string, string | number | undefined>;

const BASE = '/sport-catalog';

const simpleResource = (resource: string) => ({
  paginate: (params: ListParams) =>
    apiService.get<PaginatedData<SportSimpleRecord>>(`${BASE}/${resource}/paginate`, params),
  create: (payload: { name: string }) =>
    apiService.post<SportSimpleRecord>(`${BASE}/${resource}/add`, payload),
  update: (id: string, payload: { name: string }) =>
    apiService.post<SportSimpleRecord>(`${BASE}/${resource}/update-by/${id}`, payload),
});

export const sportsApi = simpleResource('sports');
export const sportTournamentsApi = simpleResource('tournaments');
export const sportMarketsApi = simpleResource('markets');

export const sportTeamsApi = {
  paginate: (params: ListParams) =>
    apiService.get<PaginatedData<SportTeamRecord>>(`${BASE}/teams/paginate`, params),
  create: (payload: { name: string; sport?: string; tournament?: string }) =>
    apiService.post<SportTeamRecord>(`${BASE}/teams/add`, payload),
  update: (id: string, payload: { name?: string; sport?: string; tournament?: string }) =>
    apiService.post<SportTeamRecord>(`${BASE}/teams/update-by/${id}`, payload),
};
