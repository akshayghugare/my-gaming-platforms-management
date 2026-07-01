import BonusRepository from "../model/bonus.repository";
import UserBonusRepository from "../model/user-bonus.repository";
import Bonus from "../model/bonus.model";

/**
 * GAMRU ⇄ SDLCGames bonus mirror. GAMRU authors which bonus ids a rank/level
 * grants; the bonus DEFINITIONS live on SDLCGames. This service:
 *   - pulls the definition snapshot from SDLCGames when a rank pins an id, and
 *   - records a row when a player claims a bonus (pushed back by SDLCGames).
 * Every outbound call is best-effort and never throws into the caller.
 */

const gamesBaseUrl = (): string =>
  (process.env.GAMES_PLATFORM_BACKEND_URL || "https://my-game-platform-backend-4.onrender.com/api").replace(
    /\/$/,
    ""
  );

/** Shape SDLCGames returns from GET /bonuses/catalog/:id (camelCase BonusView). */
interface GamesBonusView {
  id: string;
  bonusName: string;
  bonusType: string;
  amount: number;
  amountType: string;
  status: string;
}

export interface BonusSnapshotInput {
  external_bonus_id: string;
  bonus_name: string;
  bonus_type?: string;
  amount?: number;
  amount_type?: string;
  status?: string;
  source?: string;
}

/** Upsert a bonus snapshot by external id (create or refresh). */
export const upsertBonusSnapshot = async (
  input: BonusSnapshotInput
): Promise<Bonus | null> => {
  if (!input.external_bonus_id) return null;
  const existing = await BonusRepository.byExternalId(input.external_bonus_id);
  const fields = {
    bonus_name: input.bonus_name,
    bonus_type: input.bonus_type ?? "BONUS_CASH",
    amount: Number(input.amount ?? 0),
    amount_type: input.amount_type ?? "RM",
    status: input.status ?? "ACTIVE",
    source: input.source ?? "SDLCGAMES",
    synced_at: new Date(),
  };
  if (existing) return existing.update(fields);
  return BonusRepository.create({
    external_bonus_id: input.external_bonus_id,
    ...fields,
  });
};

/** Outbound fetch timeout — keeps a cold/slow games service from hanging. */
const FETCH_TIMEOUT_MS = Number(process.env.GAMES_PLATFORM_TIMEOUT_MS || 10000);

/**
 * Fetch one bonus definition from SDLCGames. Returns null on any failure, but
 * LOGS why (status / error / url) so a misconfigured deploy is diagnosable. The
 * #1 cause of an empty `bonuses` table in production is an unset
 * GAMES_PLATFORM_BACKEND_URL falling back to localhost — which the logs make obvious.
 */
const fetchBonusFromGames = async (
  externalBonusId: string
): Promise<GamesBonusView | null> => {
  console.log(`[bonus-sync] fetching bonus id ${externalBonusId} from ${gamesBaseUrl()}`);
  const url = `${gamesBaseUrl()}/bonuses/catalog/${encodeURIComponent(externalBonusId)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    console.log(`get respsonse form games platform for bonus`,res);
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn(`[bonus-sync] GET ${url} -> HTTP ${res.status}; not synced`);
      return null;
    }
    const body = (await res.json()) as { data?: GamesBonusView } | GamesBonusView;
    const data =
      body && typeof body === "object" && "data" in body
        ? (body as { data?: GamesBonusView }).data
        : (body as GamesBonusView);
    if (!data || !data.id) {
      // eslint-disable-next-line no-console
      console.warn(`[bonus-sync] GET ${url} -> 200 but no bonus in body; not synced`);
      return null;
    }
    return data;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[bonus-sync] GET ${url} failed: ${(e as Error).message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
};

/** Collect the unique bonus ids pinned on a rank's data (levels + rank-wide). */
export const extractRankBonusIds = (
  data: Record<string, unknown> | null | undefined
): string[] => {
  const ids = new Set<string>();
  const add = (v: unknown) => {
    if (Array.isArray(v)) v.forEach((x) => x && ids.add(String(x).trim()));
    else if (typeof v === "string")
      v.split(",").forEach((s) => s.trim() && ids.add(s.trim()));
  };
  if (data && typeof data === "object") {
    add((data as Record<string, unknown>).bonus_ids);
    const levels = (data as Record<string, unknown>).levels;
    if (Array.isArray(levels)) {
      for (const lvl of levels) {
        add((lvl as Record<string, unknown>)?.bonus_ids);
      }
    }
  }
  ids.delete("");
  return [...ids];
};

/**
 * Sync every bonus id pinned on a rank's data into the GAMRU `bonuses` snapshot
 * table. Fire-and-forget — a games-platform outage must never fail the rank
 * create/update that triggered it.
 */
export const syncRankBonuses = async (
  data: Record<string, unknown> | null | undefined
): Promise<void> => {
  try {
    const ids = extractRankBonusIds(data);
    if (!ids.length) return;
    // eslint-disable-next-line no-console
    console.info(
      `[bonus-sync] syncing ${ids.length} bonus id(s) from ${gamesBaseUrl()}`
    );
    let synced = 0;
    for (const id of ids) {
      const def = await fetchBonusFromGames(id);
      if (!def) continue; // unknown id / games down — skip, retried on next save
      await upsertBonusSnapshot({
        external_bonus_id: def.id,
        bonus_name: def.bonusName,
        bonus_type: def.bonusType,
        amount: def.amount,
        amount_type: def.amountType,
        status: def.status,
      });
      synced += 1;
    }
    // eslint-disable-next-line no-console
    console.info(`[bonus-sync] synced ${synced}/${ids.length} bonus snapshot(s)`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("syncRankBonuses failed:", (e as Error).message);
  }
};

export interface RecordClaimInput {
  email?: string | null;
  external_id?: string | null;
  external_bonus_id: string;
  bonus_name: string;
  bonus_type?: string;
  source_type: string;
  source_id: string;
  amount: number;
  amount_type: string;
  source?: string;
}

/**
 * Record a bonus a player CLAIMED on SDLCGames into GAMRU's `user_bonuses`
 * ledger, and keep the `bonuses` snapshot in sync from the same payload.
 */
export const recordUserBonusClaim = async (input: RecordClaimInput) => {
  // Keep the snapshot table populated even if the rank-sync never ran.
  await upsertBonusSnapshot({
    external_bonus_id: input.external_bonus_id,
    bonus_name: input.bonus_name,
    bonus_type: input.bonus_type,
    amount: input.amount,
    amount_type: input.amount_type,
    status: "ACTIVE",
    source: input.source ?? "SDLCGAMES",
  });

  return UserBonusRepository.create({
    user_id: String(input.external_id ?? input.email ?? "unknown"),
    email: input.email ?? null,
    external_bonus_id: input.external_bonus_id,
    bonus_name: input.bonus_name,
    source_type: input.source_type,
    source_id: input.source_id,
    amount: Number(input.amount ?? 0),
    amount_type: input.amount_type,
    status: "CLAIMED",
    source: input.source ?? "SDLCGAMES",
    claimed_at: new Date(),
  });
};
