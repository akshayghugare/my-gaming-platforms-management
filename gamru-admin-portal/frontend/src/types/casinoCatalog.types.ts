// ─── Tab ────────────────────────────────────────────────────────────────────
export type CasinoCatalogTabType = 'games' | 'categories' | 'providers';

// ─── Game ────────────────────────────────────────────────────────────────────
export interface CasinoCatalogGame {
  id: string;
  name: string;
  provider: string;
  category: string;
  image?: string;
  gameThumbnail?: string;
  tournamentWidgetThumbnail?: string;
  bonusBuyAllow: boolean;
  deviceSupport: { mobile: boolean; desktop: boolean };
}

export interface CasinoCatalogGameFormData {
  id: string;
  name: string;
  provider: string;
  category: string;
  gameThumbnail?: string;
  tournamentWidgetThumbnail?: string;
  bonusBuyAllow: boolean;
  deviceSupport: { mobile: boolean; desktop: boolean };
}

export interface CasinoCatalogGameFormErrors {
  id?: string;
  name?: string;
  provider?: string;
  category?: string;
}

// ─── Category ─────────────────────────────────────────────────────────────────
export interface CasinoCatalogCategory {
  id: string;
  name: string;
}

export interface CasinoCatalogCategoryFormData {
  id: string;
  name: string;
}

export interface CasinoCatalogCategoryFormErrors {
  id?: string;
  name?: string;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export interface CasinoCatalogProvider {
  id: string;
  name: string;
}

export interface CasinoCatalogProviderFormData {
  id: string;
  name: string;
}

export interface CasinoCatalogProviderFormErrors {
  id?: string;
  name?: string;
}
