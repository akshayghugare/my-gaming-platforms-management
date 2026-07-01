// ─── Tab ────────────────────────────────────────────────────────────────────
export type SportsCatalogTabType = 'sports' | 'teams' | 'tournamets' | 'markets';

// ─── Game ────────────────────────────────────────────────────────────────────
export interface SportsCatalogSportItem {
  id: string;
  name: string;
}

export interface SportsCatalogSportItemFormData {
  id: string;
  name: string;
}

export interface SportsCatalogSportItemFormErrors {
  id?: string;
  name?: string;
}

// teams
export interface SportsCatalogTeam {
  id: string;
  name: string;
  sport?: string;
  tournament?: string;
}
export interface SportsCatalogTeamFormData {
  id: string;
  name: string;
  sport: string;
  tournament: string;
}

export interface SportsCatalogTeamFormErrors {
  id?: string;
  name?: string;
  sport?: string;
  tournament?: string;
}

//tournamets
export interface SportsCatalogTournament {
  id: string;
  name: string;
}
export interface SportsCatalogTournamentsFormData {
  id: string;
  name: string;
}

export interface SportsCatalogTournamentsFormErrors {
  id?: string;
  name?: string;
}
//markets
export interface SportsCatalogMarket {
  id: string;
  name: string;
}
export interface SportsCatalogMarketsFormData {
  id: string;
  name: string;
}

export interface SportsCatalogMarketsFormErrors {
  id?: string;
  name?: string;
}
