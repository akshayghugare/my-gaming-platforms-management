import apiService from '@/services/api';
import type { PaginatedData } from '@/types';
import type {
  GamificationEntity,
  GamificationFeatureKey,
  GamificationListParams,
  GamificationUpsertPayload,
} from '@/types/gamification.types';

/** One row of the "participated players" list (missions / mission-bundles). */
export interface ParticipantRow {
  player_id: string | null;
  external_id: string | null;
  name: string;
  email: string;
  status: string | null;
  source: string | null;
  joined_at: string | null;
}

export interface ParticipantsResponse {
  data: ParticipantRow[];
  total: number;
  page: number;
  limit: number;
  /** Distinct player sources that have participants (for the filter dropdown). */
  sources: string[];
}

/**
 * Returns a typed CRUD client bound to a single gamification feature.
 * Mirrors the backend routes mounted under /api/gamification/<key>.
 */
export const gamificationApi = (key: GamificationFeatureKey) => {
  const BASE = `/gamification/${key}`;

  return {
    paginate: (params: GamificationListParams) =>
      apiService.get<PaginatedData<GamificationEntity>>(`${BASE}/paginate`, params),

    get: (id: string) => apiService.get<GamificationEntity>(`${BASE}/${id}`),

    /** Players who participated in this mission / mission-bundle. */
    participants: (id: string, params?: { page?: number; limit?: number; source?: string }) =>
      apiService.get<ParticipantsResponse>(`${BASE}/${id}/participants`, params),

    create: (payload: GamificationUpsertPayload) =>
      apiService.post<GamificationEntity>(`${BASE}/add`, payload),

    update: (id: string, payload: GamificationUpsertPayload) =>
      apiService.post<GamificationEntity>(`${BASE}/update-by/${id}`, payload),

    archive: (id: string, archived: boolean) =>
      apiService.post<GamificationEntity>(`${BASE}/archive-by/${id}`, { archived }),

    remove: (id: string) => apiService.delete(`${BASE}/${id}`),
  };
};

export type GamificationApi = ReturnType<typeof gamificationApi>;
