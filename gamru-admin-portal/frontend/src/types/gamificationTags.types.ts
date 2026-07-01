export type TagsGamificationsNavItemId =
  | 'all-gamification-tags'
  | 'mission-gamification-tags'
  | 'ranks-gamification-tags'
  | 'reward-shop-gamification-tags'
  | 'token-rules-gamification-tags'
  | 'tournaments-gamification-tags'
  | 'xp-points-gamification-tags';

export interface TagsGamificationsNavItem {
  id: TagsGamificationsNavItemId;
  label: string;
  icon: React.ReactNode;
}

export type GamificationTagCategory =
  | 'mission'
  | 'ranks'
  | 'reward-shop'
  | 'token-rules'
  | 'tournaments'
  | 'xp-points';

/** Shape returned by the backend (snake_case columns). */
export interface GamificationTag {
  id: string;
  name: string;
  description?: string | null;
  category: GamificationTagCategory;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GamificationTagForm {
  id?: string;
  name: string;
  description?: string;
  category: GamificationTagCategory | '';
}

export interface GamificationTagErrors {
  name?: string;
  category?: string;
  description?: string;
}

export const GAMIFICATION_CATEGORY_OPTIONS: {
  label: string;
  value: GamificationTagCategory;
}[] = [
  { label: 'Mission', value: 'mission' },
  { label: 'Ranks', value: 'ranks' },
  { label: 'Reward Shop', value: 'reward-shop' },
  { label: 'Token Rules', value: 'token-rules' },
  { label: 'Tournaments', value: 'tournaments' },
  { label: 'XP Points', value: 'xp-points' },
];
