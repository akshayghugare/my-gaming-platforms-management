import { Op, fn, col } from "sequelize";
import MissionParticipant from "./mission-participant.model";
import { Player } from "../../player/model/player.model";
import User from "../../user/model/user.model";
import { GamificationEntity, gamificationModels } from "./gamification.model";

/**
 * "Who participated in a mission / mission-bundle?"
 *
 * The games platform runs the mission engine and owns join/progress/claim. It
 * pushes participation here on JOIN (and CLAIM), keyed by the gamification id —
 * mission id for the standalone Missions tab, bundle id for a bundle. We store
 * one row per (feature, entity_id, player) in `mission_participants`, so mission
 * and bundle counts are fully independent (no name matching, no bundle/mission
 * cross-contamination).
 */

export type ParticipationFeature = "missions" | "mission-bundles";

export interface ParticipantRow {
  player_id: string | null;
  external_id: string | null;
  name: string;
  email: string;
  status: string | null;
  source: string | null;
  joined_at: Date | null;
}

export interface RecordParticipationInput {
  feature: ParticipationFeature;
  entityId: string;
  email: string;
  externalId?: string | null;
  name?: string | null;
  status?: string | null;
}

/** Upsert one player's participation in a mission / bundle (called on join/claim). */
export const recordParticipation = async (
  input: RecordParticipationInput
): Promise<MissionParticipant> => {
  const email = String(input.email).trim();
  // Best-effort link to the gamru player (name) and user (the account's
  // register-time source). The source the account REGISTERED with lives on the
  // user row, so prefer it; fall back to the player's source.
  const [player, user] = await Promise.all([
    Player.findOne({ where: { email } }),
    User.findOne({ where: { email } }),
  ]);
  const source = user?.source ?? player?.source ?? null;

  // Snapshot the entity (mission / bundle) onto the row so the operator console
  // can show a name + key fields without re-fetching the definition. For a
  // bundle this captures its name, banner, periodicity, type and mission count.
  const meta = await buildEntityMeta(input.feature, input.entityId);

  const [row, created] = await MissionParticipant.findOrCreate({
    where: {
      feature: input.feature,
      entity_id: input.entityId,
      email,
      period_key: "GAMRU",
    },
    defaults: {
      feature: input.feature,
      entity_id: input.entityId,
      email,
      period_key: "GAMRU",
      player_id: player?.id ?? null,
      player_name: input.name ?? player?.name ?? null,
      external_id: input.externalId ?? null,
      status: input.status ?? "IN_PROGRESS",
      source,
      meta,
    },
  });

  if (!created) {
    await row.update({
      player_id: player?.id ?? row.player_id ?? null,
      player_name: input.name ?? row.player_name ?? player?.name ?? null,
      external_id: input.externalId ?? row.external_id ?? null,
      status: input.status ?? row.status ?? null,
      source: source ?? row.source ?? null,
      // Refresh the snapshot (keep the old one if the definition vanished).
      meta: meta ?? row.meta ?? null,
    });
  }
  return row;
};

/** Build a display snapshot of a mission / bundle for the participation row. */
const buildEntityMeta = async (
  feature: ParticipationFeature,
  entityId: string
): Promise<Record<string, unknown> | null> => {
  const model = gamificationModels[feature as keyof typeof gamificationModels];
  if (!model) return null;
  const entity = await model.findByPk(entityId);
  if (!entity) return null;
  const d = (entity.data as Record<string, unknown> | null) ?? {};
  const base = {
    name: entity.name,
    large_image: d.large_image ?? d.small_image ?? null,
  };
  if (feature === "mission-bundles") {
    // Full bundle snapshot: which missions it groups, and for each the games +
    // objective — the same shape as a standalone mission's meta, so the console
    // can render the whole bundle from this row alone.
    const missions = await resolveBundleMissions(d.missions);
    return {
      ...base,
      periodicity: d.periodicity ?? null,
      bundle_type: d.bundle_type ?? null,
      missions_count: missions.length,
      missions,
    };
  }
  return { ...base, ...missionSnapshot(d) };
};

const toGamesArr = (raw: unknown): string[] => {
  const list = Array.isArray(raw) ? raw : String(raw ?? "").split(",");
  return Array.from(new Set(list.map((s) => String(s).trim()).filter(Boolean)));
};

/** The mission display/objective fields captured onto a participation row. */
const missionSnapshot = (d: Record<string, unknown>) => ({
  category: d.category ?? null,
  objective_type: d.objective_type ?? null,
  measure: d.measure ?? null,
  objective_target: d.objective_target ?? null,
  games: toGamesArr(d.games),
  min_bet: d.min_bet ?? null,
  min_multiplier: d.min_multiplier ?? null,
  reward_type: d.reward_type ?? null,
  reward_amount: d.reward_amount ?? null,
});

interface BundleMissionRef {
  id: string;
  name: string;
}

const parseBundleRefs = (raw: unknown): BundleMissionRef[] => {
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

/** Resolve a bundle's `data.missions` to full per-mission snapshots (id, name,
 *  games, objective, reward), preserving order and de-duping. */
const resolveBundleMissions = async (
  raw: unknown
): Promise<Record<string, unknown>[]> => {
  const refs = parseBundleRefs(raw);
  if (refs.length === 0) return [];
  const Mission = gamificationModels["missions"];
  const ids = refs.map((r) => r.id).filter(Boolean);
  const names = refs.map((r) => r.name).filter(Boolean);
  const or = [
    ...(ids.length ? [{ id: { [Op.in]: ids } }] : []),
    ...(names.length ? [{ name: { [Op.in]: names } }] : []),
  ];
  if (or.length === 0) return [];
  const defs = await Mission.findAll({ where: { [Op.or]: or } as never });
  const byId = new Map(defs.map((m) => [m.id, m]));
  const byName = new Map(defs.map((m) => [m.name.trim().toLowerCase(), m]));

  const seen = new Set<string>();
  const out: Record<string, unknown>[] = [];
  for (const ref of refs) {
    const def =
      (ref.id && byId.get(ref.id)) ||
      (ref.name && byName.get(ref.name.toLowerCase()));
    if (!def || seen.has(def.id)) continue;
    seen.add(def.id);
    const md = (def.data as Record<string, unknown> | null) ?? {};
    out.push({
      id: def.id,
      name: def.name,
      large_image: md.large_image ?? md.small_image ?? null,
      ...missionSnapshot(md),
    });
  }
  return out;
};

/** id → participant count, for a page of records (one grouped query). */
export const loadParticipantCounts = async (
  records: GamificationEntity[],
  feature: ParticipationFeature
): Promise<Record<string, number>> => {
  const out: Record<string, number> = {};
  for (const r of records) out[r.id] = 0;
  const ids = records.map((r) => r.id);
  if (ids.length === 0) return out;

  // mission_participants now also holds per-bundle-track mission PROGRESS rows
  // (period_key "B<bundleId>"). The operator "Participated" count is the
  // standalone participation only, so scope to the "GAMRU" track — bundle
  // participation is counted separately under the "mission-bundles" feature.
  const rows = (await MissionParticipant.findAll({
    attributes: ["entity_id", [fn("COUNT", col("id")), "cnt"]],
    where: { feature, entity_id: { [Op.in]: ids }, period_key: "GAMRU" },
    group: ["entity_id"],
    raw: true,
  })) as unknown as Array<{ entity_id: string; cnt: string }>;

  for (const row of rows) out[row.entity_id] = Number(row.cnt) || 0;
  return out;
};

/** Paginated list of players who participated in one mission / bundle. */
export const listParticipants = async (
  record: GamificationEntity,
  feature: ParticipationFeature,
  page: number,
  limit: number,
  source?: string
): Promise<{
  data: ParticipantRow[];
  total: number;
  page: number;
  limit: number;
  sources: string[];
}> => {
  // Standalone-track participants only (bundle-track progress rows are excluded
  // — see loadParticipantCounts).
  const baseWhere = { feature, entity_id: record.id, period_key: "GAMRU" };
  const where = source ? { ...baseWhere, source } : baseWhere;

  const { rows, count } = await MissionParticipant.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit,
    offset: (page - 1) * limit,
  });

  const data: ParticipantRow[] = rows.map((p) => ({
    player_id: p.player_id ?? null,
    external_id: p.external_id ?? null,
    name: p.player_name ?? p.email ?? "Player",
    email: p.email,
    status: p.status ?? null,
    source: p.source ?? null,
    joined_at: p.created_at ?? null,
  }));

  // All distinct sources in the DB (dynamic) — union of the `users` and
  // `players` source columns — so the modal dropdown lists every source the
  // operator actually has, not only those already present among this entity's
  // participants.
  const [userSrc, playerSrc] = await Promise.all([
    User.findAll({ attributes: ["source"], group: ["source"], raw: true }),
    Player.findAll({ attributes: ["source"], group: ["source"], raw: true }),
  ]);
  const set = new Set<string>();
  for (const r of [
    ...(userSrc as unknown as Array<{ source: string | null }>),
    ...(playerSrc as unknown as Array<{ source: string | null }>),
  ]) {
    if (r.source) set.add(r.source);
  }
  const sources = [...set].sort();

  return { data, total: count, page, limit, sources };
};
