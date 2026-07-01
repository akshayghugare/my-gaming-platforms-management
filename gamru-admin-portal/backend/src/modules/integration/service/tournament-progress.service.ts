/**
 * GAMRU tournament progress engine — the single source of truth for tournament
 * participation, scoring, ranking and prize settlement.
 *
 * Tournaments are AUTHORED as `GamificationEntity` rows in the `tournaments`
 * table. This engine owns the per-player lifecycle GAMRU now computes (moved
 * here from the games platform): JOIN, SCORE, RANK, end-of-tournament SETTLE and
 * CLAIM — persisted in `tournament_scores` (the participation table of record).
 *
 * Unlike the old games-platform logic, settlement does NOT credit a local
 * wallet. It ranks players, computes the 50/30/20 prize split and marks winners
 * eligible; the player then CLAIMs, which grants a `player_reward` (source
 * "tournaments") into GAMRU's reward ledger.
 */
import { Op } from "sequelize";
import { AppError } from "../../../utils/AppError";
import sequelize from "../../../config/db";
import { gamificationModels } from "../../gamification/shared/gamification.model";
import TournamentScore from "../../tournament-leaderboard/model/tournament-score.model";
import { Player } from "../../player/model/player.model";
import PlayerReward from "../../player/model/player-reward.model";
import PlayerLog from "../../player/model/player-log.model";
import User from "../../user/model/user.model";
import {
  grantTournamentRewardService,
  claimRewardService,
} from "../../player/service/player.service";

export type TournamentState = "SCHEDULED" | "IN_PROGRESS" | "ENDED";

export interface TournamentDTO {
  id: string;
  name: string;
  description: string | null;
  industry: string;
  tournament_type: string | null;
  games: string[];
  period: string | null;
  large_image: string | null;
  small_image: string | null;
  min_bet: number | null;
  max_bets: number | null;
  buy_in: number | null;
  start_date: string | null;
  end_date: string | null;
  leaderboard_size: number | null;
  prize_pool: number | null;
  eligibility_type: string | null;
  segment: string | null;
  tags: string[];
  state: TournamentState;
}

export interface TournamentLeaderboardEntry {
  rank: number;
  email: string;
  name: string;
  score: number;
  is_me: boolean;
  prize: number;
  /** Whether this player has already claimed their prize (server-authoritative). */
  claimed: boolean;
}

type Data = Record<string, unknown>;

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toStr = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

const toGames = (d: Data): string[] => {
  const list = Array.isArray(d?.games) ? (d.games as unknown[]) : [];
  const cleaned = list.map((g) => String(g).trim()).filter(Boolean);
  if (cleaned.length > 0) return Array.from(new Set(cleaned));
  const single = toStr(d?.game);
  return single ? [single] : [];
};

/** Trust a tournament date only if it looks like a real date (free-text field). */
const parseTrustworthyDate = (v: string | null): number | null => {
  if (!v) return null;
  const s = v.trim();
  if (s.length < 6) return null;
  if (/^\d+$/.test(s)) return null;
  const ts = Date.parse(s);
  if (Number.isNaN(ts)) return null;
  const year = new Date(ts).getFullYear();
  if (year < 2000 || year > 2100) return null;
  return ts;
};

const deriveState = (
  startDate: string | null,
  endDate: string | null
): TournamentState => {
  const now = Date.now();
  const start = parseTrustworthyDate(startDate);
  const end = parseTrustworthyDate(endDate);
  if (end !== null && now > end) return "ENDED";
  if (start !== null && now < start) return "SCHEDULED";
  return "IN_PROGRESS";
};

interface TournamentEntity {
  id: string;
  name: string;
  description?: string | null;
  tags?: unknown;
  data?: Data | null;
  status?: string;
  archived?: boolean;
}

export const mapTournament = (t: TournamentEntity): TournamentDTO => {
  const d: Data = (t.data as Data) ?? {};
  const start_date = toStr(d.start_date);
  const end_date = toStr(d.end_date);
  return {
    id: t.id,
    name: t.name,
    description: t.description ?? null,
    industry: toStr(d.industry) ?? "Casino",
    tournament_type: toStr(d.tournament_type),
    games: toGames(d),
    period: toStr(d.period),
    large_image: toStr(d.large_image),
    small_image: toStr(d.small_image),
    min_bet: toNum(d.min_bet),
    max_bets: toNum(d.max_bets),
    buy_in: toNum(d.buy_in),
    start_date,
    end_date,
    leaderboard_size: toNum(d.leaderboard_size),
    prize_pool: toNum(d.prize_pool),
    eligibility_type: toStr(d.eligibility_type),
    segment: toStr(d.segment),
    tags: Array.isArray(t.tags) ? (t.tags as string[]) : [],
    state: deriveState(start_date, end_date),
  };
};

const Tournament = () => gamificationModels["tournaments"];

const loadCatalog = async (): Promise<TournamentEntity[]> => {
  const rows = await Tournament().findAll({
    where: { status: "ACTIVE", archived: false } as never,
    order: [
      ["priority", "DESC"],
      ["created_at", "DESC"],
    ],
  });
  return rows as unknown as TournamentEntity[];
};

const findTournamentDef = async (id: string): Promise<TournamentEntity> => {
  const t = (await Tournament().findByPk(id)) as unknown as TournamentEntity | null;
  if (!t || t.archived || t.status !== "ACTIVE") {
    throw new AppError("Tournament not available", 404);
  }
  return t;
};

const findRow = (tournamentId: string, email: string) =>
  TournamentScore.findOne({ where: { tournament_id: tournamentId, email } });

const resolvePlayerMeta = async (
  email: string
): Promise<{ playerId: string | null; name: string | null }> => {
  const [player, user] = await Promise.all([
    Player.findOne({ where: { email } }),
    User.findOne({ where: { email } }),
  ]);
  const name =
    player?.name ??
    (user ? (user.username || `${user.first_name} ${user.last_name}`).trim() : null) ??
    null;
  return { playerId: player?.id ?? null, name };
};

/* ── Read ─────────────────────────────────────────────────────────────────── */

export const listTournaments = async (): Promise<TournamentDTO[]> => {
  const mapped = (await loadCatalog()).map(mapTournament);
  await Promise.all(
    mapped
      .filter((t) => t.state === "ENDED")
      .map((t) => settleTournament(t.id, t.prize_pool))
  );
  return mapped;
};

export interface TournamentDetailResult {
  tournament: TournamentDTO;
  leaderboard: TournamentLeaderboardEntry[];
}

export const getTournament = async (
  email: string,
  tournamentId: string
): Promise<TournamentDetailResult> => {
  const def = await findTournamentDef(tournamentId);
  const tournament = mapTournament(def);
  if (tournament.state === "ENDED") {
    await settleTournament(tournamentId, tournament.prize_pool);
  }
  const leaderboard = await buildLeaderboard(
    tournamentId,
    email,
    tournament.leaderboard_size
  );
  return { tournament, leaderboard };
};

const round2 = (n: number): number => Math.round(n * 100) / 100;

export const buildLeaderboard = async (
  tournamentId: string,
  meEmail: string,
  size: number | null
): Promise<TournamentLeaderboardEntry[]> => {
  const rows = await TournamentScore.findAll({
    where: { tournament_id: tournamentId },
    order: [["score", "DESC"]],
    limit: size && size > 0 ? size : undefined,
  });
  return rows.map((r, i) => ({
    rank: i + 1,
    email: r.email,
    name: r.player_name ?? r.email ?? "Player",
    score: Number(r.score ?? 0),
    is_me: r.email === meEmail,
    prize: round2(Number(r.prize_amount ?? 0)),
    claimed: Boolean(r.claimed_at),
  }));
};

/** A player's standing + prize status in one tournament. */
export const getProgress = async (email: string, tournamentId: string) => {
  const row = await findRow(tournamentId, email);
  if (!row) {
    return {
      tournament_id: tournamentId,
      registered: false,
      score: 0,
      plays: 0,
      rank: null as number | null,
      prize_amount: 0,
      prize_awarded: false,
      claimed: false,
      status: null as string | null,
    };
  }
  // Live rank = how many players outscore me, +1.
  const better = await TournamentScore.count({
    where: { tournament_id: tournamentId, score: { [Op.gt]: Number(row.score ?? 0) } },
  });
  return {
    tournament_id: tournamentId,
    registered: Boolean(row.registered),
    score: Number(row.score ?? 0),
    plays: Number(row.plays ?? 0),
    rank: row.rank ?? better + 1,
    prize_amount: round2(Number(row.prize_amount ?? 0)),
    prize_awarded: Boolean(row.prize_awarded),
    claimed: Boolean(row.claimed_at),
    status: row.status ?? null,
  };
};

export interface TournamentHistoryEntry {
  tournament_id: string;
  name: string;
  industry: string;
  image: string | null;
  plays: number;
  games_played: Array<{ game: string; plays: number }>;
  xp: number;
  rank: number;
  prize: number;
  claimed: boolean;
  last_played_at: string | null;
}

export const listUserTournaments = async (
  email: string
): Promise<TournamentHistoryEntry[]> => {
  const rows = await TournamentScore.findAll({
    where: { email },
    order: [["updated_at", "DESC"]],
  });
  const ids = Array.from(new Set(rows.map((r) => r.tournament_id)));
  const defs = ids.length
    ? ((await Tournament().findAll({
        where: { id: { [Op.in]: ids } } as never,
      })) as unknown as TournamentEntity[])
    : [];
  const byId = new Map(defs.map((d) => [d.id, d]));

  const out: TournamentHistoryEntry[] = [];
  for (const r of rows) {
    const def = byId.get(r.tournament_id);
    const d: Data = (def?.data as Data) ?? {};
    const better = await TournamentScore.count({
      where: { tournament_id: r.tournament_id, score: { [Op.gt]: Number(r.score ?? 0) } },
    });
    const gp = (r.games_played as Record<string, number> | null) ?? {};
    const games_played = Object.entries(gp)
      .map(([game, plays]) => ({ game, plays: Number(plays) || 0 }))
      .filter((g) => g.plays > 0)
      .sort((a, b) => b.plays - a.plays);
    out.push({
      tournament_id: r.tournament_id,
      name: def?.name ?? "Tournament",
      industry: toStr(d.industry) ?? "Casino",
      image: toStr(d.large_image),
      plays: Number(r.plays ?? 0),
      games_played,
      xp: Number(r.score ?? 0),
      rank: r.rank ?? better + 1,
      prize: round2(Number(r.prize_amount ?? 0)),
      claimed: Boolean(r.claimed_at),
      last_played_at: r.updated_at ? new Date(r.updated_at).toISOString() : null,
    });
  }
  return out;
};

/* ── Mutations ────────────────────────────────────────────────────────────── */

export const joinTournament = async (
  email: string,
  tournamentId: string,
  externalId?: string | null
) => {
  const def = await findTournamentDef(tournamentId);
  const dto = mapTournament(def);
  const { playerId, name } = await resolvePlayerMeta(email);
  const optIn = Boolean((def.data as Data | null)?.opt_in) || Number(dto.buy_in ?? 0) > 0;

  const existing = await findRow(tournamentId, email);
  if (existing) {
    await existing.update({
      registered: true,
      opted_in: optIn || existing.opted_in,
      status: existing.status ?? "REGISTERED",
      player_id: playerId ?? existing.player_id ?? null,
      player_name: name ?? existing.player_name ?? null,
    });
    return getProgress(email, tournamentId);
  }
  await TournamentScore.create({
    tournament_id: tournamentId,
    email,
    player_id: playerId,
    player_name: name,
    score: 0,
    plays: 0,
    games_played: {},
    registered: true,
    opted_in: optIn,
    status: "REGISTERED",
  });
  return getProgress(email, tournamentId);
};

export interface RecordScoreResult {
  tournament_id: string;
  score: number;
  applied: number;
}

export const recordScore = async (
  email: string,
  tournamentId: string,
  points: number,
  game?: string | null,
  externalId?: string | null
): Promise<RecordScoreResult> => {
  const delta = Math.max(0, Math.round(Number(points) || 0));

  const def = await findTournamentDef(tournamentId);
  const tournamentGames = toGames((def.data as Data) ?? {});
  const row0 = await findRow(tournamentId, email);
  if (game && tournamentGames.length > 0 && !tournamentGames.includes(game)) {
    return { tournament_id: tournamentId, score: Number(row0?.score ?? 0), applied: 0 };
  }

  const { playerId, name } = await resolvePlayerMeta(email);
  const gamesPlayed: Record<string, number> = {
    ...((row0?.games_played as Record<string, number> | null) ?? {}),
  };
  if (game) gamesPlayed[game] = (gamesPlayed[game] ?? 0) + 1;

  let row = row0;
  if (!row) {
    row = await TournamentScore.create({
      tournament_id: tournamentId,
      email,
      player_id: playerId,
      player_name: name,
      score: delta,
      plays: 1,
      games_played: gamesPlayed,
      registered: true,
      status: "REGISTERED",
    });
  } else {
    await row.update({
      score: Number(row.score ?? 0) + delta,
      plays: Number(row.plays ?? 0) + 1,
      games_played: gamesPlayed,
      player_id: playerId ?? row.player_id ?? null,
      player_name: name ?? row.player_name ?? null,
      registered: true,
    });
  }
  return { tournament_id: tournamentId, score: Number(row.score ?? 0), applied: delta };
};

/** Prize-pool split for the top-3 finishers (1st / 2nd / 3rd). */
const PRIZE_SPLIT = [0.5, 0.3, 0.2];

/**
 * Settle a finished tournament: rank the top-3 scorers, compute their share of
 * the prize pool (50/30/20), and for each winner create an IN_PROGRESS
 * `player_reward` (so the prize shows in the player's rewards, claimable) +
 * write an audit log. The reward id is stored on the standing so claiming from
 * either surface (tournament page / rewards table) resolves to the same reward.
 * Idempotent via the `prize_awarded` guard inside a transaction.
 */
export const settleTournament = async (
  tournamentId: string,
  prizePool: number | null
): Promise<void> => {
  const pool = Number(prizePool);
  if (!Number.isFinite(pool) || pool <= 0) return;

  const def = (await Tournament().findByPk(tournamentId)) as unknown as
    | TournamentEntity
    | null;
  const tName = def?.name ?? "Tournament";
  const rewardType = String((def?.data as Data | null)?.reward_type ?? "bonus_cash");

  try {
    await sequelize.transaction(async (t) => {
      const winners = await TournamentScore.findAll({
        where: { tournament_id: tournamentId, score: { [Op.gt]: 0 } },
        order: [["score", "DESC"]],
        limit: PRIZE_SPLIT.length,
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (winners.length === 0) return;

      for (let i = 0; i < winners.length; i += 1) {
        const w = winners[i];
        const amount = round2(pool * PRIZE_SPLIT[i]);

        // Ensure each unclaimed winner has an IN_PROGRESS reward (so the prize
        // shows in the rewards table, claimable). Idempotent: once `reward_id`
        // is set we never create another — this also BACKFILLS standings that
        // were settled before reward-linking existed. Already-claimed winners
        // are left alone.
        let rewardId: string | null = w.reward_id ?? null;
        if (!rewardId && !w.claimed_at) {
          const player = w.player_id
            ? await Player.findByPk(w.player_id, { transaction: t })
            : await Player.findOne({ where: { email: w.email }, transaction: t });
          if (player) {
            // Amount last so claimRewardService's parseRewardAmount picks it up.
            const reward = await PlayerReward.create(
              {
                player_id: player.id,
                status: "IN_PROGRESS",
                granted_date: new Date(),
                gamification_source: "tournaments",
                reward_type: rewardType,
                reward: `${tName} prize — ${amount}`,
                is_manual: false,
              } as PlayerReward["_creationAttributes"],
              { transaction: t }
            );
            rewardId = reward.id;
            await PlayerLog.create(
              {
                player_id: player.id,
                action: "Tournament Prize Available",
                detail: `${tName} — rank ${i + 1}, claim your ${amount} prize`,
                actor: "system",
              } as PlayerLog["_creationAttributes"],
              { transaction: t }
            );
          }
        }

        await w.update(
          {
            rank: i + 1,
            prize_amount: amount,
            prize_awarded: true,
            status: w.claimed_at ? "CLAIMED" : "WON",
            reward_id: rewardId,
          },
          { transaction: t }
        );
      }
    });
  } catch (err) {
    console.warn("Tournament settlement failed", { tournamentId, err });
  }
};

/**
 * Claim a settled tournament prize. Resolves to the single IN_PROGRESS reward
 * created at settlement and claims it (idempotent — a second claim throws 409
 * because the reward is already GRANTED), then marks the standing CLAIMED. The
 * same reward backs the rewards-table claim, so the prize is granted once.
 */
export const claimTournament = async (
  email: string,
  tournamentId: string
): Promise<{ prize: number }> => {
  // Make sure an ended-but-unsettled tournament gets settled first.
  const def = await findTournamentDef(tournamentId).catch(() => null);
  if (def) {
    const dto = mapTournament(def);
    if (dto.state === "ENDED") await settleTournament(tournamentId, dto.prize_pool);
  }

  const row = await findRow(tournamentId, email);
  if (!row) throw new AppError("You did not take part in this tournament", 404);
  if (row.claimed_at) throw new AppError("Prize already claimed", 409);
  if (!row.prize_awarded || Number(row.prize_amount ?? 0) <= 0) {
    throw new AppError("No prize to claim for this tournament", 409);
  }

  const player = await Player.findOne({ where: { email } });
  if (!player) throw new AppError("Player not found", 404);

  if (row.reward_id) {
    // Claim the reward created at settlement (also reverse-syncs claimed_at).
    await claimRewardService(player.id, row.reward_id, "player");
  } else {
    // Legacy standings settled before reward linking — grant on the fly.
    await grantTournamentRewardService(
      player.id,
      tournamentId,
      Number(row.prize_amount ?? 0),
      "player"
    );
  }

  await row.update({ claimed_at: new Date(), status: "CLAIMED" });
  return { prize: round2(Number(row.prize_amount ?? 0)) };
};
