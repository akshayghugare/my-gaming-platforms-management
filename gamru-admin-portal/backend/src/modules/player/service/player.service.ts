import {
  playerRepository,
  playerCampaignHistoryRepository,
  playerRewardRepository,
  playerLogRepository,
  PlayerFilter,
} from "../model/player.repository";
import { Player } from "../model/player.model";
import PlayerReward from "../model/player-reward.model";
import PlayerLog from "../model/player-log.model";
import sequelize from "../../../config/db";
import playerDataRepository from "../../player-data/model/player-data.repository";
import { PlayerDataType } from "../../player-data/model/player-data.model";
import { AppError } from "../../../utils/AppError";
import {
  loadLadder,
  firstRung,
  resolveProgress,
  resolveNextRank,
} from "../../integration/service/gam.engine";
import { applyXpToPlayer } from "../../integration/service/integration.service";
import {
  listUserMissions,
  listUserBundles,
} from "../../integration/service/mission-progress.service";
import { listUserTournaments } from "../../integration/service/tournament-progress.service";
import TournamentScore from "../../tournament-leaderboard/model/tournament-score.model";
import { gamificationModels } from "../../gamification/shared/gamification.model";
import {
  recomputeDynamicSegmentCounts,
  getPlayerSegmentNamesService,
} from "../../segment/service/segment.service";
import SystemSetting from "../../system-settings/model/system-setting.model";

type Json = Record<string, unknown>;

/** Default value shown for a custom field a player has no value for yet. */
const defaultForType = (t: PlayerDataType): unknown =>
  t === "BOOLEAN" ? false : null;

/** All CRM custom-data field definitions, in CRM display order. */
const fetchCustomDefs = () =>
  playerDataRepository.findWhere(
    { is_custom: true },
    { order: [["created_at", "ASC"]] }
  );

/**
 * Merge the CRM custom-data definitions into a player's stored
 * `custom_data` bucket. The CRM definitions decide which keys exist;
 * the player's own stored value wins, otherwise a typed default is
 * shown. Any previously-stored key whose definition was deleted in CRM
 * is preserved so no per-player data is silently lost.
 */
const applyCustomData = (
  stored: Json | null | undefined,
  defs: { name: string; data_type: PlayerDataType }[]
): Json => {
  const current: Json = stored ?? {};
  const synced: Json = {};
  for (const d of defs) {
    synced[d.name] =
      d.name in current ? current[d.name] : defaultForType(d.data_type);
  }
  return { ...current, ...synced };
};

export interface PlayerInput {
  player_id: string;
  username: string;
  name?: string | null;
  email?: string | null;
  status?: string;
  source?: string;
  registration_date?: Date | string | null;
  country?: string | null;
  city?: string | null;
  avatar_url?: string | null;
  mobile_number?: string | null;
  birthday?: Date | string | null;
  address?: string | null;
  language?: string | null;
  account_status?: string | null;
  gamification_active?: boolean;
  level?: number;
  max_level?: number;
  xp_points?: number;
  xp_to_next?: number;
  rank_name?: string | null;
  tokens?: number;
  tags?: string[] | null;
  consents?: Record<string, unknown> | null;
  personalization?: Record<string, unknown> | null;
  player_data?: Record<string, unknown> | null;
  custom_data?: Record<string, unknown> | null;
  transactional_data?: Record<string, unknown> | null;
}

export const paginatePlayersService = async (
  page: number,
  limit: number,
  filter: PlayerFilter
) => {
  const result = await playerRepository.paginatePlayers(page, limit, filter);
  const defs = await fetchCustomDefs();
  return {
    ...result,
    data: result.data.map((p) => ({
      ...p.toJSON(),
      custom_data: applyCustomData(p.custom_data as Json | null, defs),
    })),
  };
};

export const getPlayerService = async (id: string) => {
  const player = await playerRepository.findByPk(id);
  if (!player) throw new AppError("Player not found", 404);
  const [defs, ladder] = await Promise.all([fetchCustomDefs(), loadLadder()]);

  const xp = Number(player.xp_points ?? 0);
  const progress = resolveProgress(xp, ladder) ?? {
    level: Number(player.level ?? 1),
    rank_name: player.rank_name ?? null,
    xp_points: xp,
    xp_to_next: Number(player.xp_to_next ?? 0),
    max_level: Number(player.max_level ?? 0),
  };
  const next_rank = resolveNextRank(xp, ladder);

  return {
    ...player.toJSON(),
    custom_data: applyCustomData(player.custom_data as Json | null, defs),
    gamification: {
      progress,
      next_rank,
    },
  };
};

/** ACTIVE, non-archived rows of one gamification feature, priority first. */
const fetchFeature = (key: keyof typeof gamificationModels) =>
  gamificationModels[key].findAll({
    where: { status: "ACTIVE", archived: false } as never,
    order: [
      ["priority", "DESC"],
      ["created_at", "DESC"],
    ],
  });

/**
 * Full player snapshot for the gamify frontend: the player profile plus
 * everything that drives the gamification UI — the live rank ladder
 * (ranks + their levels), the player's resolved progression against it,
 * the catalog of missions / mission bundles / reward-shop items, and the
 * player's own earned rewards and recent activity logs.
 */
export const getPlayerByEmailService = async (email: string) => {
  const player = await playerRepository.findOne({ email });
  if (!player) {
    throw new AppError("Player not found", 404);
  }

  const defs = await fetchCustomDefs();

  const [ranks, missions, missionBundles, rewardShop, tournaments, ladder] =
    await Promise.all([
      fetchFeature("ranks"),
      fetchFeature("missions"),
      fetchFeature("mission-bundles"),
      fetchFeature("reward-shop"),
      fetchFeature("tournaments"),
      loadLadder(),
    ]);

  // Player-facing widgets customization (page banners + casino/sport tag
  // colors) configured in Settings → Widgets. Optional — absent until an
  // operator saves it.
  const widgetsConfigRow = await SystemSetting.findOne({
    where: { panel: "widgets", key: "configuration" },
  });

  const [rewards, logs] = await Promise.all([
    playerRewardRepository.findWhere(
      { player_id: player.id },
      { order: [["created_at", "DESC"]] }
    ),
    playerLogRepository.findWhere(
      { player_id: player.id },
      { order: [["created_at", "DESC"]], limit: 50 }
    ),
  ]);

  const xpTotal = Number(player.xp_points ?? 0);
  const progress =
    resolveProgress(xpTotal, ladder) ?? {
      level: Number(player.level ?? 1),
      rank_name: player.rank_name ?? null,
      xp_points: xpTotal,
      xp_to_next: Number(player.xp_to_next ?? 0),
      max_level: Number(player.max_level ?? 0),
    };
  const next_rank = resolveNextRank(xpTotal, ladder);

  // Segments the player currently belongs to — lets the games platform gate
  // segment-restricted content (e.g. mission bundles). Best-effort.
  const segments = await getPlayerSegmentNamesService(player.id).catch(
    () => [] as string[]
  );

  return {
    ...player.toJSON(),
    custom_data: applyCustomData(player.custom_data as Json | null, defs),
    gamification: {
      progress,
      next_rank,
      levels: ladder,
      ranks,
      missions,
      mission_bundles: missionBundles,
      reward_shop: rewardShop,
      tournaments,
      rewards,
      logs,
    },
    segments,
    widgets_config: (widgetsConfigRow?.value as Json | null) ?? null,
  };
};

/**
 * Per-player mission progress for the operator console (admin JWT). Reuses the
 * integration mission engine — GAMRU owns the progress, so the backoffice and
 * the games platform read the exact same rows.
 */
export const getPlayerMissionsService = async (playerId: string) => {
  const player = await playerRepository.findByPk(playerId);
  if (!player) throw new AppError("Player not found", 404);
  if (!player.email) return [];
  return listUserMissions(player.email);
};

/** Per-player tournament standings + prizes for the operator console. */
export const getPlayerTournamentsService = async (playerId: string) => {
  const player = await playerRepository.findByPk(playerId);
  if (!player) throw new AppError("Player not found", 404);
  if (!player.email) return [];
  return listUserTournaments(player.email);
};

/** Per-player mission BUNDLES (grouped progress) for the operator console. */
export const getPlayerBundlesService = async (playerId: string) => {
  const player = await playerRepository.findByPk(playerId);
  if (!player) throw new AppError("Player not found", 404);
  if (!player.email) return [];
  return listUserBundles(player.email);
};

/** Optional per-play game metadata pushed alongside an XP delta. */
export interface PlayGameInput {
  id?: string | null;
  name?: string | null;
  category?: string | null;
  provider?: string | null;
  turnover?: number | null;
}

interface CasinoStat {
  name: string;
  perc: number;
  turnover: number;
}

interface CasinoFav {
  position: number;
  game: string;
  category: string;
  turnover: number;
  perc: number;
}

interface CasinoPersonalization {
  totalTurnover?: number;
  gameCategory?: CasinoStat[];
  gameProvider?: CasinoStat[];
  favoriteGames?: CasinoFav[];
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

const upsertStat = (
  rows: CasinoStat[],
  name: string,
  turnover: number,
  total: number
): CasinoStat[] => {
  const next = rows.slice();
  const i = next.findIndex((r) => r.name === name);
  if (i >= 0) next[i] = { ...next[i], turnover: round2(next[i].turnover + turnover) };
  else next.push({ name, perc: 0, turnover: round2(turnover) });
  const safe = total > 0 ? total : 1;
  return next
    .map((r) => ({ ...r, perc: round2((r.turnover / safe) * 100) }))
    .sort((a, b) => b.turnover - a.turnover);
};

const upsertFavorite = (
  rows: CasinoFav[],
  gameName: string,
  category: string,
  turnover: number,
  total: number
): CasinoFav[] => {
  const next = rows.slice();
  const i = next.findIndex((r) => r.game === gameName);
  if (i >= 0)
    next[i] = {
      ...next[i],
      category: category || next[i].category,
      turnover: round2(next[i].turnover + turnover),
    };
  else
    next.push({
      position: 0,
      game: gameName,
      category: category || "—",
      turnover: round2(turnover),
      perc: 0,
    });
  const safe = total > 0 ? total : 1;
  return next
    .map((r) => ({ ...r, perc: round2((r.turnover / safe) * 100) }))
    .sort((a, b) => b.turnover - a.turnover)
    .map((r, idx) => ({ ...r, position: idx + 1 }));
};

/**
 * Fold a single play into the player's casino personalization bucket.
 * Increments totalTurnover and recomputes category/provider/favorite
 * percentages against the new total.
 */
const applyPlayToPersonalization = (
  existing: Record<string, unknown> | null | undefined,
  game: PlayGameInput
): Record<string, unknown> => {
  const turnover = Math.max(0, Number(game.turnover ?? 0) || 0);
  const root = (existing ?? {}) as Record<string, unknown>;
  const casino = ((root.casino as CasinoPersonalization | undefined) ?? {}) as CasinoPersonalization;
  const total = round2(Number(casino.totalTurnover ?? 0) + turnover);

  let gameCategory = casino.gameCategory ?? [];
  let gameProvider = casino.gameProvider ?? [];
  let favoriteGames = casino.favoriteGames ?? [];

  if (turnover > 0 && game.category)
    gameCategory = upsertStat(gameCategory, game.category, turnover, total);
  if (turnover > 0 && game.provider)
    gameProvider = upsertStat(gameProvider, game.provider, turnover, total);
  if (turnover > 0 && (game.name || game.id))
    favoriteGames = upsertFavorite(
      favoriteGames,
      game.name || (game.id as string),
      game.category ?? "",
      turnover,
      total
    );

  return {
    ...root,
    casino: {
      ...casino,
      totalTurnover: total,
      gameCategory,
      gameProvider,
      favoriteGames,
    },
  };
};

/**
 * Admin/integration helper: give a player (resolved by email) an XP delta.
 * Reuses the single gamification engine so level, rank, xp_to_next and any
 * crossed per-level rewards update exactly like the gamify sync path.
 */
export const addPlayerXpByEmailService = async (
  email: string,
  amount: number,
  actor?: string | null,
  game?: PlayGameInput | null
) => {
  const player = await playerRepository.findOne({ email });
  if (!player) {
    throw new AppError("Player not found", 404);
  }

  const delta = Number(amount);
  const hasGame = !!(
    game && (game.category || game.provider || game.name || game.id)
  );
  if (!Number.isFinite(delta)) {
    throw new AppError("amount must be a number", 400);
  }
  // 0 is only meaningful when a game payload is attached — it lets a
  // losing round still record its bet as turnover for personalization.
  if (delta === 0 && !hasGame) {
    throw new AppError("amount must be a non-zero number", 400);
  }

  let updated: Player = player;
  let nextXp = Number(player.xp_points ?? 0);
  let progress: ReturnType<typeof resolveProgress> = null;
  if (delta !== 0) {
    const r = await applyXpToPlayer(player, delta);
    updated = r.player;
    nextXp = r.nextXp;
    progress = r.progress;
  }

  if (hasGame) {
    const nextPersonalization = applyPlayToPersonalization(
      updated.personalization as Record<string, unknown> | null,
      game!
    );
    updated = (await playerRepository.updateByPk(updated.id, {
      personalization: nextPersonalization,
    } as Partial<Player["_creationAttributes"]>)) as Player;
  }

  if (delta !== 0) {
    await playerLogRepository.create({
      player_id: player.id,
      action: "XP Adjusted",
      detail: `${delta > 0 ? "+" : ""}${delta} XP (total ${nextXp})${
        progress ? ` • Lvl ${progress.level} ${progress.rank_name}` : ""
      }`,
      actor: actor ?? "admin",
    });
  }

  return {
    id: updated.id,
    player_id: updated.player_id,
    email: updated.email,
    xp_points: Number(updated.xp_points ?? 0),
    level: Number(updated.level ?? 1),
    rank_name: updated.rank_name ?? null,
    xp_to_next: Number(updated.xp_to_next ?? 0),
    max_level: Number(updated.max_level ?? 0),
    leveled_up: progress
      ? Number(player.level ?? 1) !== progress.level
      : false,
    rank_changed: progress
      ? (player.rank_name ?? null) !== progress.rank_name
      : false,
  };
};

/**
 * Keep the `player_data` JSON bucket in sync with the player's core
 * columns so the "Player Data" tab always shows a populated record.
 * Derived keys are recomputed from the latest core values; any extra
 * keys the caller supplied in player_data are preserved.
 */
const buildPlayerData = (p: Partial<PlayerInput>, existing?: Json): Json => {
  const derived: Json = {
    "Player ID": p.player_id ?? existing?.["Player ID"] ?? null,
    Username: p.username ?? existing?.["Username"] ?? null,
    "First Name": p.name ?? existing?.["First Name"] ?? null,
    Email: p.email ?? existing?.["Email"] ?? null,
    Country: p.country ?? existing?.["Country"] ?? null,
    City: p.city ?? existing?.["City"] ?? null,
    Language: p.language ?? existing?.["Language"] ?? null,
    Phone: p.mobile_number ?? existing?.["Phone"] ?? null,
    "Birth Date": p.birthday ?? existing?.["Birth Date"] ?? null,
    "Registration Date":
      p.registration_date ?? existing?.["Registration Date"] ?? null,
    "Gamification Opt-In":
      p.gamification_active ?? existing?.["Gamification Opt-In"] ?? true,
  };
  // caller-supplied attributes first, then refreshed derived keys win.
  return { ...(existing ?? {}), ...(p.player_data ?? {}), ...derived };
};

const withBuckets = (
  input: Partial<PlayerInput>,
  current?: Player
): Partial<PlayerInput> => {
  const existing = (current?.player_data as Json | undefined) ?? undefined;
  return {
    ...input,
    consents:
      input.consents ??
      current?.consents ?? {
        email: true,
        sms: true,
        onsite: true,
        push: true,
        phone: true,
        post: true,
      },
    personalization:
      input.personalization ??
      current?.personalization ?? { casino: {}, sports: {} },
    transactional_data:
      input.transactional_data ??
      current?.transactional_data ?? {
        "Player ID": input.player_id ?? current?.player_id ?? null,
      },
    custom_data: input.custom_data ?? current?.custom_data ?? {},
    player_data: buildPlayerData(input, existing),
  };
};

/**
 * Allocate a brand-new player onto the configured rank ladder: the first
 * rank and its entry-level XP. Falls back to the model defaults when no
 * ranks are configured or the caller already supplied progression values.
 */
const applyInitialGamification = async (
  input: PlayerInput
): Promise<PlayerInput> => {
  if (
    input.level !== undefined ||
    input.rank_name !== undefined ||
    input.xp_points !== undefined
  ) {
    return input;
  }
  try {
    const ladder = await loadLadder();
    const start = firstRung(ladder);
    if (!start) return input;
    const xp = start.xp_start;
    const progress = resolveProgress(xp, ladder);
    if (!progress) return input;
    return {
      ...input,
      xp_points: progress.xp_points,
      level: progress.level,
      rank_name: progress.rank_name,
      xp_to_next: progress.xp_to_next,
      max_level: progress.max_level,
    };
  } catch (err) {
    console.error("Failed to allocate initial rank for player:", err);
    return input;
  }
};

export const createPlayerService = async (input: PlayerInput) => {
  const existing = await playerRepository.findOne({
    player_id: input.player_id,
  });
  if (existing) throw new AppError("player_id already exists", 409);
  const seeded = await applyInitialGamification(input);
  // Every brand-new player joins the "new_player" + "no_deposit" segment
  // tags unless the caller explicitly supplied tags (e.g. a CRM import).
  // This is what makes game-platform registrations land in the "New players"
  // and "No deposit" segment counts; the first deposit later swaps
  // "no_deposit" for "depositor" (see integration.service applyDeposit).
  const tagged: PlayerInput = {
    ...seeded,
    tags:
      seeded.tags && seeded.tags.length
        ? seeded.tags
        : ["new_player", "no_deposit"],
  };
  const player = await playerRepository.create(
    withBuckets(tagged) as Partial<Player["_creationAttributes"]>
  );

  // Dynamic segment counts are now stale — refresh them in the background.
  // Best-effort: a recount failure must never block player creation.
  void recomputeDynamicSegmentCounts().catch((err) =>
    console.error("Failed to recompute segment counts after player create:", err)
  );

  return player;
};

export const updatePlayerService = async (
  id: string,
  data: Partial<PlayerInput>
) => {
  const current = await playerRepository.findByPk(id);
  if (!current) throw new AppError("Player not found", 404);
  const updated = await playerRepository.updateByPk(
    id,
    withBuckets(data, current) as Partial<Player["_creationAttributes"]>
  );
  if (!updated) throw new AppError("Player not found", 404);
  return updated;
};

export const deletePlayerService = async (id: string) => {
  const deleted = await playerRepository.deleteByPk(id);
  if (!deleted) throw new AppError("Player not found", 404);
  return null;
};

const ensurePlayer = async (id: string) => {
  const player = await playerRepository.findByPk(id);
  if (!player) throw new AppError("Player not found", 404);
  return player;
};

export const getCampaignHistoryService = async (
  id: string,
  page: number,
  limit: number,
  search?: string
) => {
  await ensurePlayer(id);
  return playerCampaignHistoryRepository.paginateForPlayer(
    id,
    page,
    limit,
    search
  );
};

export const getRewardsService = async (
  id: string,
  page: number,
  limit: number
) => {
  await ensurePlayer(id);
  return playerRewardRepository.paginateForPlayer(id, page, limit);
};

export const addManualRewardService = async (
  id: string,
  data: { reward_type: string; reward?: string | null; actor?: string | null }
) => {
  await ensurePlayer(id);
  const reward = await playerRewardRepository.create({
    player_id: id,
    status: "IN_PROGRESS",
    granted_date: new Date(),
    gamification_source: "Manual",
    reward_type: data.reward_type,
    reward: data.reward ?? null,
    is_manual: true,
  });
  await playerLogRepository.create({
    player_id: id,
    action: "Manual Reward Added",
    detail: `${data.reward_type}${data.reward ? ` — ${data.reward}` : ""}`,
    actor: data.actor ?? null,
  });
  return reward;
};

export const getLogsService = async (
  id: string,
  page: number,
  limit: number
) => {
  await ensurePlayer(id);
  return playerLogRepository.paginateForPlayer(id, page, limit);
};

/**
 * Extract a trailing numeric value from a reward label like
 * "Level 5 – xp 100" → 100 or a plain "25" → 25. Returns 0 when no
 * number is present (e.g. a manual badge with only a name).
 */
const parseRewardAmount = (reward?: string | null): number => {
  if (!reward) return 0;
  const m = String(reward).match(/(-?\d+(?:\.\d+)?)\s*$/);
  return m ? Number(m[1]) : 0;
};

/** Normalise the many spellings of reward_type to a single canonical key. */
const normalizeRewardType = (t?: string | null): string => {
  const s = String(t ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
  if (s === "xp_points" || s === "xp_point") return "xp";
  if (s === "token") return "tokens";
  if (s === "cash" || s === "bonus_offer") return "bonus_cash";
  return s || "unknown";
};

/**
 * Apply a granted reward's effect to the player. `xp` runs through the
 * gamification engine so level/rank/xp_to_next stay consistent;
 * `tokens` updates the column; everything else accumulates under
 * `transactional_data[<type>]` so manual / shop rewards still get
 * recorded against the player without needing new columns.
 */
export const claimRewardService = async (
  playerId: string,
  rewardId: string,
  actor?: string | null
) => {
  const player = await playerRepository.findByPk(playerId);
  if (!player) throw new AppError("Player not found", 404);

  const reward = await playerRewardRepository.findByPk(rewardId);
  if (!reward || reward.player_id !== playerId) {
    throw new AppError("Reward not found", 404);
  }
  if (reward.status !== "IN_PROGRESS") {
    throw new AppError(
      `Reward is already ${reward.status.toLowerCase()}`,
      409
    );
  }

  const amount = parseRewardAmount(reward.reward);
  const type = normalizeRewardType(reward.reward_type);

  let updatedPlayer: Player = player;
  if (amount > 0) {
    if (type === "xp") {
      const r = await applyXpToPlayer(player, amount);
      updatedPlayer = r.player;
    } else if (type === "tokens") {
      updatedPlayer =
        ((await playerRepository.updateByPk(player.id, {
          tokens: Number(player.tokens ?? 0) + amount,
        } as Partial<Player["_creationAttributes"]>)) as Player) ?? player;
    } else {
      const td =
        (player.transactional_data as Record<string, unknown> | null) ?? {};
      const current = Number((td[type] as number | undefined) ?? 0);
      updatedPlayer =
        ((await playerRepository.updateByPk(player.id, {
          transactional_data: { ...td, [type]: current + amount },
        } as Partial<Player["_creationAttributes"]>)) as Player) ?? player;
    }
  }

  const updatedReward = await playerRewardRepository.updateByPk(rewardId, {
    status: "GRANTED",
    granted_date: reward.granted_date ?? new Date(),
  });

  // A tournament prize can be claimed from the rewards table OR the tournament
  // page — both resolve to this one reward. Mark the linked standing CLAIMED so
  // the tournament page reflects it regardless of which surface claimed.
  if (reward.gamification_source === "tournaments") {
    await TournamentScore.update(
      { claimed_at: new Date(), status: "CLAIMED" },
      { where: { reward_id: rewardId } }
    );
  }

  await playerLogRepository.create({
    player_id: playerId,
    action: "Reward Claimed",
    detail: `${reward.reward_type ?? "—"}${
      reward.reward ? ` — ${reward.reward}` : ""
    }`,
    actor: actor ?? null,
  });

  return {
    reward: updatedReward,
    player: {
      id: updatedPlayer.id,
      xp_points: Number(updatedPlayer.xp_points ?? 0),
      tokens: Number(updatedPlayer.tokens ?? 0),
      level: Number(updatedPlayer.level ?? 1),
      rank_name: updatedPlayer.rank_name ?? null,
      transactional_data:
        (updatedPlayer.transactional_data as Record<string, unknown> | null) ??
        {},
    },
  };
};

/**
 * Grant a mission's reward to a player. Called by an external service backend
 * (the games platform) over `x-client-auth-key` when a player claims a
 * completed mission. The mission's reward type/amount come from the trusted
 * gamru mission definition (the caller only names the mission) so the reward
 * is authored once, in gamru, and lands in the player's reward ledger →
 * "Special Bonuses". Reuses `claimRewardService` so the reward's effect
 * (xp / tokens / bonus cash) is applied exactly like any other claim.
 */
export const grantMissionRewardService = async (
  playerId: string,
  missionId: string,
  actor?: string | null
) => {
  const player = await playerRepository.findByPk(playerId);
  if (!player) throw new AppError("Player not found", 404);

  const Mission = gamificationModels["missions"];
  const mission = await Mission.findByPk(missionId);
  if (!mission || mission.archived || mission.status !== "ACTIVE") {
    throw new AppError("Mission not available", 404);
  }

  const data = (mission.data as Record<string, unknown>) ?? {};
  const rewardType = String(data.reward_type ?? "bonus_cash");
  const amount = Number(data.reward_amount ?? 0) || 0;
  // Amount last so claimRewardService's parseRewardAmount picks it up.
  const label = `${mission.name} — ${amount}`;

  // Create the reward IN_PROGRESS, then claim it so the effect is applied,
  // the status flips to GRANTED and a "Reward Claimed" audit log is written.
  const reward = await playerRewardRepository.create({
    player_id: playerId,
    status: "IN_PROGRESS",
    granted_date: new Date(),
    gamification_source: "missions",
    reward_type: rewardType,
    reward: label,
    is_manual: false,
  });

  const claimed = await claimRewardService(
    playerId,
    reward.id,
    actor ?? "player"
  );
  return { mission_id: missionId, ...claimed };
};

/**
 * Grant a tournament prize to a player. Called when a player claims their share
 * of a settled tournament's prize pool. The prize `amount` is computed by the
 * tournament progress engine (GAMRU owns ranking + the 50/30/20 split), and the
 * reward type is read from the trusted tournament definition (default bonus
 * cash). Lands in the player's reward ledger → "Special Bonuses". Reuses
 * `claimRewardService` so the effect (cash / tokens / xp) is applied exactly
 * like any other claim.
 */
export const grantTournamentRewardService = async (
  playerId: string,
  tournamentId: string,
  amount: number,
  actor?: string | null
) => {
  const player = await playerRepository.findByPk(playerId);
  if (!player) throw new AppError("Player not found", 404);

  const prize = Number(amount) || 0;
  if (prize <= 0) throw new AppError("No prize to claim", 400);

  const Tournament = gamificationModels["tournaments"];
  const tournament = await Tournament.findByPk(tournamentId);
  const data = (tournament?.data as Record<string, unknown>) ?? {};
  const rewardType = String(data.reward_type ?? "bonus_cash");
  const name = tournament?.name ?? "Tournament";
  // Amount last so claimRewardService's parseRewardAmount picks it up.
  const label = `${name} prize — ${prize}`;

  const reward = await playerRewardRepository.create({
    player_id: playerId,
    status: "IN_PROGRESS",
    granted_date: new Date(),
    gamification_source: "tournaments",
    reward_type: rewardType,
    reward: label,
    is_manual: false,
  });

  const claimed = await claimRewardService(playerId, reward.id, actor ?? "player");
  return { tournament_id: tournamentId, prize, ...claimed };
};

/**
 * Spend a player's tokens to buy a reward-shop product. Called by external
 * service backends (e.g. the games platform) over `x-client-auth-key`.
 *
 * Runs in a single transaction with a row lock on the player so concurrent
 * purchases can't double-spend: it re-reads the live token balance, the
 * product (price + stock) from the `reward_shop` gamification table,
 * validates affordability and stock, then atomically deducts tokens,
 * decrements stock, records the purchase as a GRANTED player_reward and
 * writes an audit log. The trusted price/stock come from gamru, never the
 * caller — the caller only names the product and quantity.
 */
export const purchaseRewardShopService = async (
  playerId: string,
  shopItemId: string,
  quantity: number,
  actor?: string | null
) => {
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));

  return sequelize.transaction(async (t) => {
    const player = await Player.findByPk(playerId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!player) throw new AppError("Player not found", 404);

    const RewardShop = gamificationModels["reward-shop"];
    const item = await RewardShop.findByPk(shopItemId, { transaction: t });
    if (!item || item.archived || item.status !== "ACTIVE") {
      throw new AppError("Reward shop product not available", 404);
    }

    const data = (item.data as Record<string, unknown>) ?? {};
    const tokenPrice = Number(data.token_price ?? 0);
    if (!Number.isFinite(tokenPrice) || tokenPrice <= 0) {
      throw new AppError("This product is not purchasable with tokens", 400);
    }
    const cost = tokenPrice * qty;

    // Stock is only enforced when the product actually tracks it.
    const hasStock =
      data.stock_total !== undefined && data.stock_total !== null;
    let nextStock: number | null = null;
    if (hasStock) {
      const available = Number(data.stock_available ?? data.stock_total ?? 0);
      if (available < qty) throw new AppError("Product is out of stock", 409);
      nextStock = available - qty;
    }

    const balance = Number(player.tokens ?? 0);
    if (balance < cost) {
      throw new AppError("Insufficient tokens for this purchase", 400);
    }
    const remaining = balance - cost;

    await player.update({ tokens: remaining }, { transaction: t });

    if (nextStock !== null) {
      await item.update(
        { data: { ...data, stock_available: nextStock } },
        { transaction: t }
      );
    }

    const label = `${item.name}${qty > 1 ? ` ×${qty}` : ""} — tokens ${cost}`;
    const reward = await PlayerReward.create(
      {
        player_id: playerId,
        status: "GRANTED",
        granted_date: new Date(),
        gamification_source: "reward-shop",
        reward_type: "reward_shop_purchase",
        reward: label,
        is_manual: false,
      } as PlayerReward["_creationAttributes"],
      { transaction: t }
    );

    await PlayerLog.create(
      {
        player_id: playerId,
        action: "Reward Shop Purchase",
        detail: `${label} (balance ${remaining})`,
        actor: actor ?? "player",
      } as PlayerLog["_creationAttributes"],
      { transaction: t }
    );

    return {
      item_id: item.id,
      item_name: item.name,
      quantity: qty,
      tokens_spent: cost,
      tokens_remaining: remaining,
      stock_available: nextStock,
      reward,
      player: {
        id: player.id,
        tokens: remaining,
        xp_points: Number(player.xp_points ?? 0),
        level: Number(player.level ?? 1),
        rank_name: player.rank_name ?? null,
      },
    };
  });
};
