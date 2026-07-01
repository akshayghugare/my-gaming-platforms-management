import axios from 'axios';

/**
 * Widget pages run INSIDE an embedded iframe with no operator login, so they
 * must not reuse the shared `services/api.ts` instance (which attaches the
 * admin bearer token). Instead they authenticate exactly like an external
 * consumer backend: with the embedding client's auth key sent as
 * `x-client-auth-key`. This standalone axios instance keeps that auth context
 * isolated from the admin console.
 */
const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const widgetClient = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export interface WidgetAppearance {
  theme?: 'dark' | 'light';
  accent_color?: string;
  /** Page / root background. */
  bg_color?: string;
  /** Optional background image URL (covers the widget background). */
  bg_image?: string;
  /** Card / panel background. */
  surface_color?: string;
  text_color?: string;
  /** Secondary / label text. */
  muted_color?: string;
  border_color?: string;
  /** Corner radius in px. */
  radius?: number;
  /** Base font size (desktop) in px. */
  font_size?: number;
  /** Base padding / gap (desktop) in px. */
  spacing?: number;
  /** Density of the layout. */
  layout?: 'comfortable' | 'compact';
  /** Outer container padding in px. */
  padding?: number;
  /** Outer container margin in px. */
  margin?: number;
  /** Horizontal alignment of the widget block. */
  align?: 'left' | 'center' | 'right';
  /** Max content width in px (0 / empty = full width). */
  max_width?: number;
  /** Size preset for inline widgets (avatar diameter / level-badge size). */
  size?: 'small' | 'medium' | 'large';
  /** Stretch the widget block to the full container width. */
  full_width?: boolean;
  /** Explicit content width in px (overrides max_width when > 0). */
  width?: number;
  /** Minimum container height in px. */
  min_height?: number;
  /** Per-breakpoint overrides for phones. */
  mobile?: { font_size?: number; spacing?: number };
}

export interface WidgetValidateResult {
  validated: boolean;
  widget_type: string | null;
  widget_config_id?: string | null;
  appearance?: WidgetAppearance | null;
  client: { id: string; name: string; slug: string; skin_id: string };
}

// The player payload mirrors `getPlayerByEmailService` on the backend. Kept
// loose (Record) — widgets read individual fields defensively.
export type WidgetPlayer = Record<string, unknown> & {
  gamification?: Record<string, unknown>;
};

/**
 * Per-player mission / tournament / bundle state, as returned by GAMRU's
 * integration progression API (the SAME shape the games-platform Mission tab
 * consumes). Kept loose — the widget reads fields defensively.
 */
export type WidgetMission = Record<string, unknown> & {
  id: string;
  name?: string;
  status?: 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'CLAIMED' | string;
  progress?: number;
  target?: number;
  games?: string[];
  reward_label?: string;
  reward_amount?: number;
};
export type WidgetTournament = Record<string, unknown> & {
  id: string;
  name?: string;
  games?: string[];
};
export type WidgetBundle = Record<string, unknown> & {
  id: string;
  name?: string;
  missions?: WidgetMission[];
};

/** The play signal a game iframe posts; relayed to GAMRU `/api/activity`. */
export interface WidgetActivityPayload {
  email: string;
  kind?: 'play' | 'login';
  stake?: number;
  win?: boolean;
  winAmount?: number;
  gameKey?: string | null;
  missionId?: string | null;
  bundleId?: string | null;
  tournamentId?: string | null;
  points?: number;
  external_id?: string;
}

const clientAuth = (authKey: string) => ({
  headers: { 'x-client-auth-key': authKey },
});

/** Peel GAMRU's `{ success, message, data }` envelope to `data` (defensive). */
const unwrap = <T>(res: { data?: { data?: T } }): T | null => (res?.data?.data as T) ?? null;

export const widgetApi = {
  validate: async (params: {
    type: string;
    clientId?: string;
    authKey: string;
    domain?: string;
  }) => {
    const res = await widgetClient.get('/widget/validate', { params });
    return res.data as { success: boolean; message: string; data: WidgetValidateResult };
  },

  playerByEmail: async (email: string, authKey: string) => {
    const res = await widgetClient.post(
      '/players/by-email',
      { email },
      { headers: { 'x-client-auth-key': authKey } }
    );
    return res.data as { success: boolean; message: string; data: WidgetPlayer };
  },

  // In-iframe actions (clientAuth) — performed without leaving the widget.
  claimReward: async (playerId: string, rewardId: string, authKey: string) => {
    const res = await widgetClient.post(
      `/players/${playerId}/rewards/${rewardId}/claim`,
      {},
      { headers: { 'x-client-auth-key': authKey } }
    );
    return res.data as { success: boolean; message: string };
  },

  purchaseRewardShop: async (
    playerId: string,
    shopItemId: string,
    authKey: string,
    quantity = 1
  ) => {
    const res = await widgetClient.post(
      `/players/${playerId}/reward-shop/purchase`,
      { shop_item_id: shopItemId, quantity },
      { headers: { 'x-client-auth-key': authKey } }
    );
    return res.data as { success: boolean; message: string };
  },

  /* ── Mission / tournament / bundle progression (clientAuth) ──────────────
   * These hit GAMRU's integration progression API at top-level resource paths
   * (the SAME endpoints the games platform uses), so in-iframe play behaves
   * exactly like the Mission tab — only the API source differs. Player by email.
   */

  // Per-player state (status / progress / target / games[]).
  listMissions: async (email: string, authKey: string) => {
    const res = await widgetClient.get('/missions', {
      params: { email },
      ...clientAuth(authKey),
    });
    return unwrap<{ missions: WidgetMission[] }>(res)?.missions ?? [];
  },
  listTournaments: async (email: string, authKey: string) => {
    const res = await widgetClient.get('/tournaments', {
      params: { email },
      ...clientAuth(authKey),
    });
    return unwrap<{ tournaments: WidgetTournament[] }>(res)?.tournaments ?? [];
  },
  getTournament: async (id: string, email: string, authKey: string) => {
    const res = await widgetClient.get(`/tournaments/${id}`, {
      params: { email },
      ...clientAuth(authKey),
    });
    return unwrap<{ tournament: WidgetTournament; leaderboard: unknown[] }>(res);
  },
  listMissionBundles: async (email: string, authKey: string) => {
    const res = await widgetClient.get('/mission-bundles', {
      params: { email },
      ...clientAuth(authKey),
    });
    return unwrap<{ bundles: WidgetBundle[] }>(res)?.bundles ?? [];
  },

  // Missions — join / cancel / claim.
  joinMission: (id: string, email: string, authKey: string) =>
    widgetClient.post(`/missions/${id}/join`, { email }, clientAuth(authKey)),
  cancelMission: (id: string, email: string, authKey: string) =>
    widgetClient.post(`/missions/${id}/cancel`, { email }, clientAuth(authKey)),
  claimMission: (id: string, email: string, authKey: string) =>
    widgetClient.post(`/missions/${id}/claim`, { email }, clientAuth(authKey)),

  // Bundle-track missions — join / cancel / claim on the bundle's own track.
  joinBundleMission: (bundleId: string, missionId: string, email: string, authKey: string) =>
    widgetClient.post(
      `/mission-bundles/${bundleId}/missions/${missionId}/join`,
      { email },
      clientAuth(authKey)
    ),
  cancelBundleMission: (bundleId: string, missionId: string, email: string, authKey: string) =>
    widgetClient.post(
      `/mission-bundles/${bundleId}/missions/${missionId}/cancel`,
      { email },
      clientAuth(authKey)
    ),
  claimBundleMission: (bundleId: string, missionId: string, email: string, authKey: string) =>
    widgetClient.post(
      `/mission-bundles/${bundleId}/missions/${missionId}/claim`,
      { email },
      clientAuth(authKey)
    ),

  // Tournaments — per-player standing (registered / score / prize / claimed).
  tournamentProgress: async (id: string, email: string, authKey: string) => {
    const res = await widgetClient.get(`/tournaments/${id}/progress`, {
      params: { email },
      ...clientAuth(authKey),
    });
    return unwrap<{
      registered: boolean;
      score: number;
      rank: number | null;
      prize_amount: number;
      prize_awarded: boolean;
      claimed: boolean;
      status: string | null;
    }>(res);
  },
  // Tournaments — join / claim.
  joinTournament: (id: string, email: string, authKey: string) =>
    widgetClient.post(`/tournaments/${id}/join`, { email }, clientAuth(authKey)),
  claimTournament: (id: string, email: string, authKey: string) =>
    widgetClient.post(`/tournaments/${id}/claim`, { email }, clientAuth(authKey)),

  /**
   * Relay one play to GAMRU. Identical payload + endpoint the games backend
   * uses (`gamru.integration.activity`): advances mission/bundle progress and
   * records tournament score in a single call. Returns the fresh mission list.
   */
  activity: async (payload: WidgetActivityPayload, authKey: string) => {
    const res = await widgetClient.post(
      '/activity',
      { kind: 'play', ...payload },
      clientAuth(authKey)
    );
    return unwrap<{ missions: WidgetMission[] }>(res)?.missions ?? [];
  },

  /** XP parity — mirror the play's XP so level/rank/XP widgets also move. */
  addXp: (
    email: string,
    amount: number,
    game: Record<string, unknown> | undefined,
    authKey: string
  ) => widgetClient.post('/players/by-email/add-xp', { email, amount, game }, clientAuth(authKey)),
};
