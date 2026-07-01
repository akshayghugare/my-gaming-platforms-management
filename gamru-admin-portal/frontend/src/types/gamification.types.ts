export type GamificationStatus = 'ACTIVE' | 'INACTIVE';

/** Shape returned by the backend (snake_case columns). */
export interface GamificationEntity {
  id: string;
  name: string;
  description: string | null;
  status: GamificationStatus;
  archived: boolean;
  priority: number;
  tags: string[];
  data: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  /** Only present on missions / mission-bundles paginate rows. */
  participant_count?: number;
}

export interface GamificationUpsertPayload {
  name: string;
  description?: string | null;
  status?: GamificationStatus;
  priority?: number;
  tags?: string[];
  data?: Record<string, unknown>;
}

export interface GamificationListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: GamificationStatus;
  archived?: boolean;
  tag?: string;
}

/** All gamification feature keys (match backend URL segments). */
export type GamificationFeatureKey =
  | 'missions'
  | 'mission-bundles'
  | 'ranks'
  | 'token-rules-casino'
  | 'token-rules-sports'
  | 'xp-point-rules-casino'
  | 'xp-point-rules-sports'
  | 'player-categories'
  | 'reward-shop'
  | 'prizeshark-catalog'
  | 'purchase-feed'
  | 'tournaments';
