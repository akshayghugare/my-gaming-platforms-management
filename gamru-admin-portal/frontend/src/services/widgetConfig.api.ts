import apiService from '@/services/api';
import type { WidgetAppearance } from '@/services/widget.api';

export type { WidgetAppearance };

export type WidgetConfigStatus = 'ACTIVE' | 'INACTIVE';

export const WIDGET_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'mission', label: 'Mission' },
  { value: 'mission-bundle', label: 'Mission Bundle' },
  { value: 'tournament', label: 'Tournament' },
  { value: 'reward-shop', label: 'Reward Shop' },
  { value: 'rewards', label: 'Rewards' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'rankings', label: 'Rankings' },
  { value: 'profile', label: 'User Profile' },
  { value: 'status', label: 'User Status' },
  { value: 'progress', label: 'Progress' },
  // Inline / compact "data" widgets
  { value: 'points', label: 'Points (Level / Rank / Tokens + XP)' },
  { value: 'avatar', label: 'Avatar' },
  { value: 'tokens', label: 'Tokens' },
  { value: 'badge-level', label: 'Level Badge' },
];

export interface WidgetConfig {
  id: string;
  client_id: string;
  name: string;
  type: string;
  allowed_domains: string[] | null;
  status: WidgetConfigStatus;
  expiry_date: string | null;
  appearance: WidgetAppearance | null;
  created_at: string;
  updated_at: string;
}

export interface WidgetConfigForm {
  client_id: string;
  name: string;
  type: string;
  allowed_domains?: string[] | null;
  status?: WidgetConfigStatus;
  expiry_date?: string | null;
  appearance?: WidgetAppearance | null;
}

interface Paginated<T> {
  data: T[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: WidgetConfigStatus;
  type?: string;
  client_id?: string;
}

const BASE = '/widget/configurations';

export const widgetConfigApi = {
  list: (params: ListParams = {}) =>
    apiService.get<Paginated<WidgetConfig>>(BASE, { page: 1, limit: 100, ...params }),

  create: (form: WidgetConfigForm) => apiService.post<WidgetConfig>(BASE, form),

  update: (id: string, form: Partial<WidgetConfigForm>) =>
    apiService.post<WidgetConfig>(`${BASE}/${id}`, form),

  toggleStatus: (id: string) => apiService.post<WidgetConfig>(`${BASE}/${id}/toggle-status`, {}),

  remove: (id: string) => apiService.delete<null>(`${BASE}/${id}`),
};
