/**
 * GAMRU mission progress engine — the single source of truth for mission
 * participation & progress.
 *
 * Missions are AUTHORED as `GamificationEntity` rows in the `missions` table.
 * This engine owns the per-player lifecycle that GAMRU now computes (moved here
 * from the games platform): JOIN, gameplay-driven PROGRESS, COMPLETE, CLAIM and
 * CANCEL — persisted in `mission_participants` (the progress table of record,
 * keyed by feature + mission id + email + participation track).
 *
 * The games platform forwards gameplay events (`advanceForActivity`) and caches
 * the snapshot we return; it no longer calculates anything.
 */
import { Op } from "sequelize";
import { AppError } from "../../../utils/AppError";
import { gamificationModels } from "../../gamification/shared/gamification.model";
import MissionParticipant from "../../gamification/shared/mission-participant.model";
import { Player } from "../../player/model/player.model";
import User from "../../user/model/user.model";
import { grantMissionRewardService } from "../../player/service/player.service";
import { getPlayerSegmentNamesService } from "../../segment/service/segment.service";
import { recordParticipation } from "../../gamification/shared/participation.service";

/** GAMRU missions are lifetime/special — one row per (mission, track). */
export const PERIOD = "GAMRU";

/** A bundle's participation track key — mirrors the games engine. */
export const bundlePeriodKey = (bundleId: string): string =>
  ("B" + bundleId.replace(/-/g, "")).slice(0, 20);

export type MissionStatus = "AVAILABLE" | "IN_PROGRESS" | "COMPLETED" | "CLAIMED";

/** Exclusivity bucket: everything that isn't Sport shares the Casino slot. */
export type MissionBucket = "Casino" | "Sport";

export interface MissionDTO {
  id: string;
  name: string;
  description: string | null;
  category: string;
  bucket: MissionBucket;
  vip: boolean;
  duration_days: number | null;
  large_image: string | null;
  status: MissionStatus;
  objective_type: string;
  measure: string;
  target: number;
  progress: number;
  condition: string;
  game_category: string | null;
  min_bet: number | null;
  min_multiplier: number | null;
  bet_currency: string;
  games: string[];
  start_date: string | null;
  end_date: string | null;
  reward_type: string;
  reward_amount: number;
  reward_label: string;
  max_bonus: number | null;
  bonus_wagering: string;
  deposit_required: boolean;
  wagering_required: boolean;
  more_details: string | null;
  tags: string[];
  completed_at: string | null;
  claimed_at: string | null;
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

const bucketFor = (category: string): MissionBucket =>
  /sport/i.test(category) ? "Sport" : "Casino";

const toGames = (raw: unknown): string[] => {
  const list = Array.isArray(raw) ? raw : String(raw ?? "").split(",");
  return Array.from(new Set(list.map((s) => String(s).trim()).filter(Boolean)));
};

const rewardLabel = (d: Data): string => {
  const explicit = toStr(d.reward_label);
  if (explicit) return explicit;
  const amount = toNum(d.reward_amount) ?? 0;
  const type = toStr(d.reward_type) ?? "bonus_cash";
  const pretty = type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return `${amount} ${pretty}`;
};

const conditionLabel = (d: Data, target: number): string => {
  const explicit = toStr(d.condition_label);
  if (explicit) return explicit;
  const ot = toStr(d.objective_type) ?? "wager";
  const measure = toStr(d.measure) ?? "amount";
  if (ot === "wager") return `Wager $${target}`;
  if (ot === "bet_count") return `Place ${target} bets`;
  if (ot === "login") return `Log in ${target} day${target === 1 ? "" : "s"}`;
  if (ot === "deposit") return `Deposit $${target}`;
  if (ot === "win") return `Win ${target} time${target === 1 ? "" : "s"}`;
  const verb = ot.replace(/_/g, " ");
  return measure === "amount" ? `${verb} $${target}` : `${verb} ${target}`;
};

const statusFor = (um: MissionParticipant | undefined | null): MissionStatus => {
  if (!um || !um.status) return "AVAILABLE";
  if (um.status === "IN_PROGRESS") return "IN_PROGRESS";
  if (um.status === "COMPLETED") return "COMPLETED";
  if (um.status === "CLAIMED") return "CLAIMED";
  return "AVAILABLE";
};

interface MissionEntity {
  id: string;
  name: string;
  description?: string | null;
  tags?: unknown;
  data?: Data | null;
  status?: string;
  archived?: boolean;
}

export const mapMission = (
  m: MissionEntity,
  um?: MissionParticipant | null
): MissionDTO => {
  const d: Data = (m.data as Data) ?? {};
  const category = toStr(d.category) ?? "Casino";
  const target = toNum(d.objective_target) ?? 0;
  return {
    id: m.id,
    name: m.name,
    description: m.description ?? null,
    category,
    bucket: bucketFor(category),
    vip: Boolean(d.vip),
    duration_days: toNum(d.duration_days),
    large_image: toStr(d.large_image) ?? toStr(d.small_image),
    status: statusFor(um),
    objective_type: toStr(d.objective_type) ?? "wager",
    measure: toStr(d.measure) ?? "amount",
    target,
    progress: um ? Number(um.progress ?? 0) : 0,
    condition: conditionLabel(d, target),
    game_category: toStr(d.objective_game_category),
    min_bet: toNum(d.min_bet),
    min_multiplier: toNum(d.min_multiplier),
    bet_currency: toStr(d.bet_currency) ?? "All Currencies",
    games: toGames(d.games),
    start_date: toStr(d.start_date),
    end_date: toStr(d.end_date),
    reward_type: toStr(d.reward_type) ?? "bonus_cash",
    reward_amount: toNum(d.reward_amount) ?? 0,
    reward_label: rewardLabel(d),
    max_bonus: toNum(d.max_bonus),
    bonus_wagering: toStr(d.bonus_wagering) ?? "Excluded",
    deposit_required: Boolean(d.deposit_required),
    wagering_required: Boolean(d.wagering_required),
    more_details: toStr(d.more_details),
    tags: Array.isArray(m.tags) ? (m.tags as string[]) : [],
    completed_at: um?.completed_at ? new Date(um.completed_at).toISOString() : null,
    claimed_at: um?.claimed_at ? new Date(um.claimed_at).toISOString() : null,
  };
};

/** Snapshot the mission's objective onto the participation row (for progress). */
const objectiveSnapshot = (dto: MissionDTO): Record<string, unknown> => ({
  objective_type: dto.objective_type,
  measure: dto.measure,
  min_bet: dto.min_bet,
  min_multiplier: dto.min_multiplier,
  game_category: dto.game_category,
  games: dto.games,
  category: dto.category,
  bucket: dto.bucket,
  name: dto.name,
  large_image: dto.large_image,
  reward_type: dto.reward_type,
  reward_amount: dto.reward_amount,
  reward_label: dto.reward_label,
  condition: dto.condition,
});

/* ── Catalog ──────────────────────────────────────────────────────────────── */

const Mission = () => gamificationModels["missions"];

const loadCatalog = async (): Promise<MissionEntity[]> => {
  const rows = await Mission().findAll({
    where: { status: "ACTIVE", archived: false } as never,
    order: [
      ["priority", "DESC"],
      ["created_at", "DESC"],
    ],
  });
  return rows as unknown as MissionEntity[];
};

const findMissionDef = async (missionId: string): Promise<MissionEntity> => {
  const m = (await Mission().findByPk(missionId)) as unknown as MissionEntity | null;
  if (!m || m.archived || m.status !== "ACTIVE") {
    throw new AppError("Mission not available", 404);
  }
  return m;
};

/** Best-effort resolve the gamru player + their account source by email. */
const resolvePlayerMeta = async (
  email: string
): Promise<{ playerId: string | null; name: string | null; source: string | null }> => {
  const [player, user] = await Promise.all([
    Player.findOne({ where: { email } }),
    User.findOne({ where: { email } }),
  ]);
  return {
    playerId: player?.id ?? null,
    name: player?.name ?? null,
    source: user?.source ?? player?.source ?? null,
  };
};

const findRow = (email: string, missionId: string, periodKey: string) =>
  MissionParticipant.findOne({
    where: { feature: "missions", entity_id: missionId, email, period_key: periodKey },
  });

/* ── Read ─────────────────────────────────────────────────────────────────── */

export const listMissions = async (
  email: string,
  periodKey: string = PERIOD
): Promise<MissionDTO[]> => {
  const missions = await loadCatalog();
  const rows = await MissionParticipant.findAll({
    where: { feature: "missions", email, period_key: periodKey },
  });
  const byMission = new Map(rows.map((r) => [r.entity_id, r]));
  return missions.map((m) => mapMission(m, byMission.get(m.id)));
};

export const getMission = async (
  email: string,
  missionId: string,
  periodKey: string = PERIOD
): Promise<MissionDTO> => {
  const def = await findMissionDef(missionId);
  const um = await findRow(email, missionId, periodKey);
  return mapMission(def, um);
};

/**
 * One mapped mission progress row, tagged with the participation TRACK it came
 * from: "mission" (the standalone Missions tab) or "mission-bundle" (joined
 * inside a bundle). The same mission can appear on several tracks at once, so
 * the operator console can group / label them instead of showing duplicates.
 */
export type UserMissionDTO = MissionDTO & {
  period_key: string;
  participation_type: "mission" | "mission-bundle";
};

/** All of a player's mission progress rows, mapped (every track). */
export const listUserMissions = async (
  email: string
): Promise<UserMissionDTO[]> => {
  const rows = await MissionParticipant.findAll({
    where: { feature: "missions", email },
    order: [["updated_at", "DESC"]],
  });
  const ids = Array.from(new Set(rows.map((r) => r.entity_id)));
  if (ids.length === 0) return [];
  const defs = (await Mission().findAll({
    where: { id: { [Op.in]: ids } } as never,
  })) as unknown as MissionEntity[];
  const byId = new Map(defs.map((d) => [d.id, d]));
  return rows
    .map((r) => {
      const def = byId.get(r.entity_id);
      if (!def) return null;
      return {
        ...mapMission(def, r),
        period_key: r.period_key,
        participation_type:
          r.period_key === PERIOD ? "mission" : "mission-bundle",
      } as UserMissionDTO;
    })
    .filter((x): x is UserMissionDTO => x !== null);
};

/* ── Per-player bundles (operator console) ────────────────────────────────── */

const Bundle = () => gamificationModels["mission-bundles"];

interface BundleMissionRef {
  id: string;
  name: string;
}

/** Normalize a bundle's `data.missions` into `{ id, name }[]`. */
const bundleMissionRefs = (raw: unknown): BundleMissionRef[] => {
  const list = Array.isArray(raw) ? raw : String(raw ?? "").split(",");
  return list
    .map((item): BundleMissionRef =>
      item && typeof item === "object"
        ? {
            id: String((item as BundleMissionRef).id ?? "").trim(),
            name: String((item as BundleMissionRef).name ?? "").trim(),
          }
        : { id: "", name: String(item).trim() }
    )
    .filter((r) => r.id || r.name);
};

export interface PlayerBundleDTO {
  id: string;
  name: string;
  description: string | null;
  large_image: string | null;
  periodicity: string | null;
  bundle_type: string | null;
  /** How many missions the bundle groups (the denominator, e.g. 0/2 → 2). */
  total: number;
  /** Missions the player has COMPLETED or CLAIMED in this bundle (numerator). */
  completed: number;
  /** Each grouped mission with the player's progress on THIS bundle's track. */
  missions: MissionDTO[];
}

/**
 * A player's mission bundles with proper grouped progress: the bundle's overall
 * completed/total plus each member mission's per-bundle-track progress. Only
 * bundles the player has engaged with are returned (matches the per-player
 * view). The bundle's denominator is its full mission count, not just joined
 * missions — so a freshly-joined bundle reads e.g. 0/2.
 */
export const listUserBundles = async (
  email: string
): Promise<PlayerBundleDTO[]> => {
  const bundles = (await Bundle().findAll({
    where: { status: "ACTIVE", archived: false } as never,
    order: [
      ["priority", "DESC"],
      ["created_at", "DESC"],
    ],
  })) as unknown as MissionEntity[];
  if (bundles.length === 0) return [];

  const missions = await loadCatalog();
  const byId = new Map(missions.map((m) => [m.id, m]));
  const byName = new Map(missions.map((m) => [m.name.trim().toLowerCase(), m]));

  const rows = await MissionParticipant.findAll({
    where: { feature: "missions", email },
  });
  const rowMap = new Map(rows.map((r) => [`${r.period_key}::${r.entity_id}`, r]));

  const out: PlayerBundleDTO[] = [];
  for (const b of bundles) {
    const d: Data = (b.data as Data) ?? {};
    const pk = bundlePeriodKey(b.id);
    const refs = bundleMissionRefs(d.missions);

    const seen = new Set<string>();
    const ms: MissionDTO[] = [];
    let engaged = false;
    for (const ref of refs) {
      const def =
        (ref.id && byId.get(ref.id)) ||
        (ref.name && byName.get(ref.name.toLowerCase()));
      if (!def || seen.has(def.id)) continue;
      seen.add(def.id);
      const row = rowMap.get(`${pk}::${def.id}`);
      if (row) engaged = true;
      ms.push(mapMission(def, row));
    }
    if (!engaged) continue; // only bundles this player has joined into

    const completed = ms.filter(
      (m) => m.status === "COMPLETED" || m.status === "CLAIMED"
    ).length;
    out.push({
      id: b.id,
      name: b.name,
      description: b.description ?? null,
      large_image: toStr(d.large_image) ?? toStr(d.small_image),
      periodicity: toStr(d.periodicity),
      bundle_type: toStr(d.bundle_type),
      total: ms.length,
      completed,
      missions: ms,
    });
  }
  return out;
};

/* ── Player-facing eligible bundles (games platform integration) ──────────── */
// The games platform reads bundles for a player over /api/mission-bundles. Unlike
// `listUserBundles` (operator view — only ENGAGED bundles), this returns every
// bundle the player is ELIGIBLE for (segment-gated), each with its grouped
// missions and per-bundle-track progress merged in.

/** A mission bundle with this player's grouped, per-bundle-track progress. */
export interface IntegrationBundleDTO {
  id: string;
  name: string;
  description: string | null;
  large_image: string | null;
  small_image: string | null;
  bundle_type: string | null;
  periodicity: string | null;
  priority: number;
  eligibility_type: string | null;
  segments: string[];
  tags: string[];
  /** The missions grouped in this bundle, with the player's participation. */
  missions: MissionDTO[];
  /** How many missions the bundle groups (the denominator). */
  total: number;
  /** Missions already COMPLETED or CLAIMED on this bundle's track. */
  completed: number;
}

const toNames = (raw: unknown): string[] => {
  const list = Array.isArray(raw) ? raw : String(raw ?? "").split(",");
  return list.map((s) => String(s).trim()).filter(Boolean);
};

/** The segment names a "Segment"-eligibility bundle is limited to. */
const bundleSegments = (d: Data): string[] => toNames(d.segment);

/**
 * Whether a bundle is visible to a player with these segment names. "All
 * Players" (or unset eligibility) is always visible; a "Segment" bundle is
 * visible only when the player belongs to one of its segments. A segment bundle
 * with no segments chosen falls back to visible (nothing to restrict by).
 */
const isBundleEligible = (d: Data, playerSegments: Set<string>): boolean => {
  const type = String(d.eligibility_type ?? "").trim().toLowerCase();
  if (type !== "segment") return true;
  const segs = bundleSegments(d);
  if (segs.length === 0) return true;
  return segs.some((s) => playerSegments.has(s.toLowerCase()));
};

const mapIntegrationBundle = (
  b: MissionEntity,
  byId: Map<string, MissionEntity>,
  byName: Map<string, MissionEntity>,
  rowMap: Map<string, MissionParticipant>
): IntegrationBundleDTO => {
  const d: Data = (b.data as Data) ?? {};
  const pk = bundlePeriodKey(b.id);
  const refs = bundleMissionRefs(d.missions);

  // Resolve each reference to a mission (by id first — the stable relation —
  // then name), dedupe, and merge THIS bundle's own participation row so its
  // status/progress is independent of other bundles and the Missions tab.
  const seen = new Set<string>();
  const ms: MissionDTO[] = [];
  for (const ref of refs) {
    const def =
      (ref.id && byId.get(ref.id)) ||
      (ref.name && byName.get(ref.name.toLowerCase()));
    if (!def || seen.has(def.id)) continue;
    seen.add(def.id);
    ms.push(mapMission(def, rowMap.get(`${pk}::${def.id}`)));
  }
  const completed = ms.filter(
    (m) => m.status === "COMPLETED" || m.status === "CLAIMED"
  ).length;
  return {
    id: b.id,
    name: b.name,
    description: b.description ?? null,
    large_image: toStr(d.large_image) ?? toStr(d.small_image),
    small_image: toStr(d.small_image),
    bundle_type: toStr(d.bundle_type),
    periodicity: toStr(d.periodicity),
    priority: Number((b as { priority?: number }).priority ?? 0),
    eligibility_type: toStr(d.eligibility_type),
    segments: bundleSegments(d),
    tags: Array.isArray(b.tags) ? (b.tags as string[]) : [],
    missions: ms,
    total: ms.length,
    completed,
  };
};

/** The player's segment names (lowercased), resolved live by gamru's engine. */
const playerSegmentSet = async (email: string): Promise<Set<string>> => {
  const player = await Player.findOne({ where: { email } });
  if (!player) return new Set();
  const names = await getPlayerSegmentNamesService(player.id).catch(
    () => [] as string[]
  );
  return new Set(names.map((s) => s.trim().toLowerCase()));
};

/** Load the bundle catalog + this player's progress & segments in one go. */
const loadBundleCatalog = async (
  email: string
): Promise<{
  bundles: MissionEntity[];
  byId: Map<string, MissionEntity>;
  byName: Map<string, MissionEntity>;
  rowMap: Map<string, MissionParticipant>;
  playerSegments: Set<string>;
}> => {
  const [bundles, missions, rows, playerSegments] = await Promise.all([
    Bundle().findAll({
      where: { status: "ACTIVE", archived: false } as never,
      order: [
        ["priority", "DESC"],
        ["created_at", "DESC"],
      ],
    }) as unknown as Promise<MissionEntity[]>,
    loadCatalog(),
    MissionParticipant.findAll({ where: { feature: "missions", email } }),
    playerSegmentSet(email),
  ]);
  const byId = new Map(missions.map((m) => [m.id, m]));
  const byName = new Map(missions.map((m) => [m.name.trim().toLowerCase(), m]));
  const rowMap = new Map(
    rows.map((r) => [`${r.period_key}::${r.entity_id}`, r])
  );
  return { bundles, byId, byName, rowMap, playerSegments };
};

/** Every bundle the player is ELIGIBLE for, each with grouped progress. */
export const listEligibleBundles = async (
  email: string
): Promise<IntegrationBundleDTO[]> => {
  const { bundles, byId, byName, rowMap, playerSegments } =
    await loadBundleCatalog(email);
  return bundles
    .filter((b) => isBundleEligible((b.data as Data) ?? {}, playerSegments))
    .map((b) => mapIntegrationBundle(b, byId, byName, rowMap));
};

/** One eligible bundle with grouped progress, or 404 if hidden/unknown. */
export const getEligibleBundle = async (
  email: string,
  bundleId: string
): Promise<IntegrationBundleDTO> => {
  const { bundles, byId, byName, rowMap, playerSegments } =
    await loadBundleCatalog(email);
  const found = bundles.find((b) => b.id === bundleId);
  if (!found || !isBundleEligible((found.data as Data) ?? {}, playerSegments)) {
    throw new AppError("Mission bundle not found", 404);
  }
  return mapIntegrationBundle(found, byId, byName, rowMap);
};

/* ── Bundle-track member-mission lifecycle ────────────────────────────────── */
// A mission inside a bundle is joined / progressed / claimed on that bundle's
// OWN track (its per-bundle period_key), with NO one-per-bucket exclusivity — so
// every mission in the bundle can run at once and tracks independently of the
// same mission on the standalone tab or in another bundle. Join & claim also
// mirror to the operator console's bundle "Participated" count (keyed by the
// bundle id under the "mission-bundles" feature), matching the games engine.

/** Join one of a bundle's missions on the bundle's track. */
export const joinBundleMission = async (
  email: string,
  bundleId: string,
  missionId: string,
  externalId: string | null = null
): Promise<MissionDTO> => {
  const dto = await joinMission(email, missionId, {
    periodKey: bundlePeriodKey(bundleId),
    exclusive: false,
    externalId,
  });
  await recordParticipation({
    feature: "mission-bundles",
    entityId: bundleId,
    email,
    externalId,
    status: "IN_PROGRESS",
  }).catch(() => undefined);
  return dto;
};

/** Cancel one of a bundle's missions on the bundle's track. */
export const cancelBundleMission = (
  email: string,
  bundleId: string,
  missionId: string
): Promise<void> =>
  cancelMission(email, missionId, bundlePeriodKey(bundleId));

/** Read one bundle mission's progress on the bundle's track. */
export const getBundleMission = (
  email: string,
  bundleId: string,
  missionId: string
): Promise<MissionDTO> =>
  getMission(email, missionId, bundlePeriodKey(bundleId));

/** Advance one bundle mission from a forwarded play; returns the fresh mission. */
export const advanceBundleMission = async (
  email: string,
  bundleId: string,
  missionId: string,
  signal: PlaySignal
): Promise<MissionDTO> => {
  await advanceForActivity(email, signal, { missionId, bundleId });
  return getMission(email, missionId, bundlePeriodKey(bundleId));
};

/** Claim one of a bundle's completed missions on the bundle's track. */
export const claimBundleMission = async (
  email: string,
  bundleId: string,
  missionId: string
): Promise<{ reward_label: string; mission: MissionDTO }> => {
  const result = await claimMission(email, missionId, bundlePeriodKey(bundleId));
  await recordParticipation({
    feature: "mission-bundles",
    entityId: bundleId,
    email,
    status: "CLAIMED",
  }).catch(() => undefined);
  return result;
};

/* ── Mutations ────────────────────────────────────────────────────────────── */

export interface ParticipationOpts {
  periodKey?: string;
  exclusive?: boolean;
  externalId?: string | null;
}

export const joinMission = async (
  email: string,
  missionId: string,
  opts: ParticipationOpts = {}
): Promise<MissionDTO> => {
  const periodKey = opts.periodKey ?? PERIOD;
  const exclusive = opts.exclusive ?? true;

  const def = await findMissionDef(missionId);
  const dto = mapMission(def);
  if (dto.target <= 0) {
    throw new AppError("This mission is not configured correctly", 400);
  }

  const { playerId, name, source } = await resolvePlayerMeta(email);

  // Cancel any other running mission in the same bucket ON THIS TRACK only.
  if (exclusive) {
    const others = await MissionParticipant.findAll({
      where: { feature: "missions", email, period_key: periodKey, status: "IN_PROGRESS" },
    });
    for (const o of others) {
      const bucket = String((o.meta as Data | null)?.bucket ?? "");
      if (bucket === dto.bucket && o.entity_id !== missionId) {
        await o.destroy();
      }
    }
  }

  const meta = objectiveSnapshot(dto);
  const existing = await findRow(email, missionId, periodKey);
  if (existing) {
    await existing.update({
      progress: 0,
      target: dto.target,
      status: "IN_PROGRESS",
      meta,
      completed_at: null,
      claimed_at: null,
      player_id: playerId ?? existing.player_id ?? null,
      player_name: name ?? existing.player_name ?? null,
      external_id: opts.externalId ?? existing.external_id ?? null,
      source: source ?? existing.source ?? null,
    });
  } else {
    await MissionParticipant.create({
      feature: "missions",
      entity_id: missionId,
      email,
      period_key: periodKey,
      progress: 0,
      target: dto.target,
      status: "IN_PROGRESS",
      meta,
      player_id: playerId,
      player_name: name,
      external_id: opts.externalId ?? null,
      source,
    });
  }

  return { ...dto, status: "IN_PROGRESS", progress: 0 };
};

export const cancelMission = async (
  email: string,
  missionId: string,
  periodKey: string = PERIOD
): Promise<void> => {
  const um = await findRow(email, missionId, periodKey);
  if (!um) throw new AppError("Mission not started", 404);
  if (um.status === "CLAIMED") {
    throw new AppError("A claimed mission can't be cancelled", 409);
  }
  await um.destroy();
};

export const claimMission = async (
  email: string,
  missionId: string,
  periodKey: string = PERIOD
): Promise<{ reward_label: string; mission: MissionDTO }> => {
  const um = await findRow(email, missionId, periodKey);
  if (!um) throw new AppError("Mission not started", 404);
  if (um.status === "CLAIMED") {
    throw new AppError("Mission reward already claimed", 409);
  }
  if (um.status !== "COMPLETED") {
    throw new AppError("Mission not completed yet", 409);
  }

  const player = await Player.findOne({ where: { email } });
  if (!player) throw new AppError("Player not found", 404);

  await grantMissionRewardService(player.id, missionId, "player");

  await um.update({ status: "CLAIMED", claimed_at: new Date() });

  const def = await findMissionDef(missionId).catch(() => null);
  const meta = (um.meta as Data | null) ?? {};
  return {
    reward_label: String(meta.reward_label ?? "Reward"),
    mission: def ? mapMission(def, um) : (mapMission({ id: missionId, name: String(meta.name ?? "Mission"), data: {} }, um)),
  };
};

/* ── Progress (driven by forwarded gameplay events) ───────────────────────── */

interface AdvanceOpts {
  betSize: number;
  amountValue: number;
  gameKey?: string | null;
  missionId?: string | null;
  bundleId?: string | null;
}

const advanceUserMissions = async (
  email: string,
  kinds: string[],
  opts: AdvanceOpts
): Promise<void> => {
  const { betSize, amountValue, gameKey, missionId, bundleId } = opts;

  let rows: MissionParticipant[];
  if (missionId) {
    const periodKey = bundleId ? bundlePeriodKey(bundleId) : PERIOD;
    const um = await findRow(email, missionId, periodKey);
    rows = um && um.status === "IN_PROGRESS" ? [um] : [];
  } else {
    rows = await MissionParticipant.findAll({
      where: { feature: "missions", email, status: "IN_PROGRESS", period_key: PERIOD },
    });
  }

  for (const um of rows) {
    const meta = (um.meta as Data | null) ?? {};
    const ot = String(meta.objective_type ?? "");
    if (!kinds.includes(ot)) continue;

    const games = Array.isArray(meta.games) ? (meta.games as string[]) : [];
    if (games.length > 0 && (!gameKey || !games.includes(gameKey))) continue;

    const minBet = Number(meta.min_bet ?? 0) || 0;
    if (minBet > 0 && betSize < minBet) continue;

    const measure = String(meta.measure ?? "count");
    const delta = measure === "amount" ? Math.max(0, Math.round(amountValue)) : 1;
    if (delta <= 0) continue;

    const next = Math.min(Number(um.progress ?? 0) + delta, um.target);
    if (next >= um.target) {
      await um.update({
        progress: next,
        status: "COMPLETED",
        completed_at: um.completed_at ?? new Date(),
      });
    } else {
      await um.update({ progress: next });
    }
  }
};

export interface PlaySignal {
  stake: number;
  win: boolean;
  winAmount: number;
  gameKey?: string | null;
}

export const advanceForActivity = async (
  email: string,
  signal: PlaySignal,
  context: { missionId?: string | null; bundleId?: string | null } = {}
): Promise<void> => {
  const { missionId = null, bundleId = null } = context;
  await advanceUserMissions(email, ["wager", "bet_count"], {
    betSize: signal.stake,
    amountValue: signal.stake,
    gameKey: signal.gameKey,
    missionId,
    bundleId,
  });
  if (signal.win) {
    await advanceUserMissions(email, ["win"], {
      betSize: signal.stake,
      amountValue: signal.winAmount,
      gameKey: signal.gameKey,
      missionId,
      bundleId,
    });
  }
};

export const advanceForLogin = async (email: string): Promise<void> => {
  await advanceUserMissions(email, ["login"], { betSize: 0, amountValue: 1 });
};
