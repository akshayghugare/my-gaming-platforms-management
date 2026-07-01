export type PlayerStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'N/A';

export interface CategoryStat {
  name: string;
  perc: number;
  turnover: number;
}

export interface FavoriteGame {
  position: number;
  game: string;
  category: string;
  turnover: number;
  perc: number;
}

export interface PlayerPersonalization {
  casino?: {
    totalTurnover?: number;
    gameCategory?: CategoryStat[];
    gameProvider?: CategoryStat[];
    favoriteGames?: FavoriteGame[];
  };
  sports?: {
    sports?: unknown[];
    tournaments?: unknown[];
    teams?: unknown[];
    markets?: unknown[];
  };
}

export interface PlayerConsents {
  email?: boolean;
  sms?: boolean;
  onsite?: boolean;
  push?: boolean;
  phone?: boolean;
  post?: boolean;
}

export interface PlayerProgress {
  level: number;
  rank_name: string | null;
  xp_points: number;
  xp_to_next: number;
  max_level: number;
}

export interface PlayerNextRank {
  rank_name: string;
  level: number;
  xp_required: number;
  xp_remaining: number;
  reward_type: string | null;
  reward_value: number | null;
}

export interface PlayerGamificationSummary {
  progress: PlayerProgress;
  next_rank: PlayerNextRank | null;
}

export interface Player {
  id: string;
  player_id: string;
  username: string;
  name?: string | null;
  email?: string | null;
  status: PlayerStatus;
  registration_date?: string | null;
  country?: string | null;
  city?: string | null;
  avatar_url?: string | null;
  mobile_number?: string | null;
  birthday?: string | null;
  address?: string | null;
  language?: string | null;
  account_status?: string | null;
  gamification_active: boolean;
  level: number;
  max_level: number;
  xp_points: number;
  xp_to_next: number;
  rank_name?: string | null;
  tokens: number;
  consents?: PlayerConsents | null;
  personalization?: PlayerPersonalization | null;
  player_data?: Record<string, unknown> | null;
  custom_data?: Record<string, unknown> | null;
  transactional_data?: Record<string, unknown> | null;
  /** Live progression resolved against the configured rank ladder. */
  gamification?: PlayerGamificationSummary | null;
  created_at: string;
  updated_at: string;
}

export type CampaignChannel = 'WEB_PUSH' | 'ON_SITE' | 'EMAIL' | 'SMS' | 'PUSH';
export type CampaignDeliveryStatus = 'SENT' | 'OPEN' | 'ERROR' | 'CLICKED' | 'PENDING';

export interface PlayerCampaignHistory {
  id: string;
  player_id: string;
  channel: CampaignChannel;
  title: string;
  status: CampaignDeliveryStatus;
  event_label?: string | null;
  event_at: string;
  created_at: string;
}

export type RewardStatus = 'IN_PROGRESS' | 'GRANTED' | 'EXPIRED' | 'CANCELLED';

export interface PlayerReward {
  id: string;
  player_id: string;
  status: RewardStatus;
  granted_date?: string | null;
  gamification_source?: string | null;
  reward_type?: string | null;
  reward?: string | null;
  is_manual: boolean;
  created_at: string;
}

export interface PlayerLog {
  id: string;
  player_id: string;
  action: string;
  detail?: string | null;
  actor?: string | null;
  created_at: string;
}

export interface PlayerFilters {
  search: string;
  status: string;
  country: string;
}

export const PLAYER_STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Status', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Blocked', value: 'BLOCKED' },
  { label: 'N/A', value: 'N/A' },
];

export const REWARD_TYPE_OPTIONS: string[] = [
  'Bonus Offer',
  'Free Spins',
  'Token',
  'XP Points',
  'Cash',
];
