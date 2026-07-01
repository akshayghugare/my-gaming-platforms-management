/**
 * GAMRU integration API — missions & tournaments source of truth.
 *
 * These handlers back the `/api/integration/*` surface consumed by the games
 * platform over `x-client-auth-key`. GAMRU owns all progression logic; the
 * consumer forwards events and renders what we return. The player is resolved
 * by `email` (body for POST, query for GET); `/users/:userId/*` also accepts the
 * games user id as `external_id` and falls back to it when no email is given.
 */
import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../utils/responseHandler";
import { AppError } from "../../../utils/AppError";
import ExternalAccount from "../model/external-account.model";
import MissionParticipant from "../../gamification/shared/mission-participant.model";
import TournamentScore from "../../tournament-leaderboard/model/tournament-score.model";
import { Player } from "../../player/model/player.model";
import PlayerReward from "../../player/model/player-reward.model";
import * as missions from "../service/mission-progress.service";
import * as tournaments from "../service/tournament-progress.service";
import { playerRepository } from "../../player/model/player.repository";
import { triggerCampaignsForEvent } from "../../campaign/service/campaign-delivery.service";
import { WhereOptions } from "sequelize";

const fail = (res: Response, error: unknown, fallback: string) => {
  if (error instanceof AppError) {
    return errorResponse(res, error.statusCode, error.message);
  }
  console.error(fallback, error);
  return errorResponse(res, 500, fallback);
};

const str = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

/** Resolve the player's email from body/query, or from an external_id ref. */
const resolveEmail = async (req: Request): Promise<string> => {
  const direct =
    str(req.body?.email) ?? str(req.query.email as string | undefined);
  if (direct) return direct;

  const userId = str(req.params.userId);
  if (userId) {
    // games user id → email via any prior participation/score row, then via the
    // external-account link as a last resort.
    const mp = await MissionParticipant.findOne({
      where: { external_id: userId },
    });
    if (mp?.email) return mp.email;
    const ts = await TournamentScore.findOne({ where: { player_id: userId } });
    if (ts?.email) return ts.email;
    const ext = await ExternalAccount.findOne({ where: { external_id: userId } });
    if (ext?.email) return ext.email;
  }
  throw new AppError("email is required to resolve the player", 400);
};

const externalId = (req: Request): string | null =>
  str(req.body?.external_id) ?? str(req.params.userId);

/* ── Missions ─────────────────────────────────────────────────────────────── */

export const listMissions = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const data = await missions.listMissions(email);
    successResponse(res, 200, "Missions fetched", { missions: data });
  } catch (e) {
    fail(res, e, "Failed to fetch missions");
  }
};

export const getMission = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const data = await missions.getMission(email, req.params.id);
    successResponse(res, 200, "Mission fetched", data);
  } catch (e) {
    fail(res, e, "Failed to fetch mission");
  }
};

export const joinMission = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const bundleId = str(req.body?.bundleId);
    const data = await missions.joinMission(email, req.params.id, {
      periodKey: bundleId ? missions.bundlePeriodKey(bundleId) : missions.PERIOD,
      exclusive: !bundleId,
      externalId: externalId(req),
    });
    successResponse(res, 200, "Mission joined", data);
  } catch (e) {
    fail(res, e, "Failed to join mission");
  }
};

export const cancelMission = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const bundleId = str(req.body?.bundleId);
    await missions.cancelMission(
      email,
      req.params.id,
      bundleId ? missions.bundlePeriodKey(bundleId) : missions.PERIOD
    );
    successResponse(res, 200, "Mission cancelled", { cancelled: true });
  } catch (e) {
    fail(res, e, "Failed to cancel mission");
  }
};

export const getMissionProgress = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const bundleId = str(req.query.bundleId as string | undefined);
    const data = await missions.getMission(
      email,
      req.params.id,
      bundleId ? missions.bundlePeriodKey(bundleId) : missions.PERIOD
    );
    successResponse(res, 200, "Mission progress fetched", data);
  } catch (e) {
    fail(res, e, "Failed to fetch mission progress");
  }
};

/** POST /missions/:id/progress — advance one mission from a forwarded play. */
export const updateMissionProgress = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const b = req.body ?? {};
    const bundleId = str(b.bundleId);
    await missions.advanceForActivity(
      email,
      {
        stake: Number(b.stake) || 0,
        win: Boolean(b.win),
        winAmount: Number(b.winAmount) || 0,
        gameKey: str(b.gameKey),
      },
      { missionId: req.params.id, bundleId }
    );
    const data = await missions.getMission(
      email,
      req.params.id,
      bundleId ? missions.bundlePeriodKey(bundleId) : missions.PERIOD
    );
    successResponse(res, 200, "Mission progress updated", data);
  } catch (e) {
    fail(res, e, "Failed to update mission progress");
  }
};

export const claimMission = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const bundleId = str(req.body?.bundleId);
    const data = await missions.claimMission(
      email,
      req.params.id,
      bundleId ? missions.bundlePeriodKey(bundleId) : missions.PERIOD
    );
    successResponse(res, 200, "Mission reward claimed", data);
  } catch (e) {
    fail(res, e, "Failed to claim mission reward");
  }
};

export const userMissions = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const data = await missions.listUserMissions(email);
    successResponse(res, 200, "User missions fetched", { missions: data });
  } catch (e) {
    fail(res, e, "Failed to fetch user missions");
  }
};

/* ── Mission bundles ──────────────────────────────────────────────────────── */

export const listMissionBundles = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const data = await missions.listEligibleBundles(email);
    successResponse(res, 200, "Mission bundles fetched", { bundles: data });
  } catch (e) {
    fail(res, e, "Failed to fetch mission bundles");
  }
};

export const getMissionBundle = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const data = await missions.getEligibleBundle(email, req.params.id);
    successResponse(res, 200, "Mission bundle fetched", data);
  } catch (e) {
    fail(res, e, "Failed to fetch mission bundle");
  }
};

export const joinBundleMission = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const data = await missions.joinBundleMission(
      email,
      req.params.id,
      req.params.missionId,
      externalId(req)
    );
    successResponse(res, 200, "Bundle mission joined", data);
  } catch (e) {
    fail(res, e, "Failed to join bundle mission");
  }
};

export const cancelBundleMission = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    await missions.cancelBundleMission(email, req.params.id, req.params.missionId);
    successResponse(res, 200, "Bundle mission cancelled", { cancelled: true });
  } catch (e) {
    fail(res, e, "Failed to cancel bundle mission");
  }
};

export const getBundleMissionProgress = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const data = await missions.getBundleMission(
      email,
      req.params.id,
      req.params.missionId
    );
    successResponse(res, 200, "Bundle mission progress fetched", data);
  } catch (e) {
    fail(res, e, "Failed to fetch bundle mission progress");
  }
};

/** POST /mission-bundles/:id/missions/:missionId/progress — advance from a play. */
export const updateBundleMissionProgress = async (
  req: Request,
  res: Response
) => {
  try {
    const email = await resolveEmail(req);
    const b = req.body ?? {};
    const data = await missions.advanceBundleMission(
      email,
      req.params.id,
      req.params.missionId,
      {
        stake: Number(b.stake) || 0,
        win: Boolean(b.win),
        winAmount: Number(b.winAmount) || 0,
        gameKey: str(b.gameKey),
      }
    );
    successResponse(res, 200, "Bundle mission progress updated", data);
  } catch (e) {
    fail(res, e, "Failed to update bundle mission progress");
  }
};

export const claimBundleMission = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const data = await missions.claimBundleMission(
      email,
      req.params.id,
      req.params.missionId
    );
    successResponse(res, 200, "Bundle mission reward claimed", data);
  } catch (e) {
    fail(res, e, "Failed to claim bundle mission reward");
  }
};

/* ── Tournaments ──────────────────────────────────────────────────────────── */

export const listTournaments = async (_req: Request, res: Response) => {
  try {
    const data = await tournaments.listTournaments();
    successResponse(res, 200, "Tournaments fetched", { tournaments: data });
  } catch (e) {
    fail(res, e, "Failed to fetch tournaments");
  }
};

export const getTournament = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req).catch(() => "");
    const data = await tournaments.getTournament(email, req.params.id);
    successResponse(res, 200, "Tournament fetched", data);
  } catch (e) {
    fail(res, e, "Failed to fetch tournament");
  }
};

export const joinTournament = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const data = await tournaments.joinTournament(
      email,
      req.params.id,
      externalId(req)
    );
    successResponse(res, 200, "Tournament joined", data);
  } catch (e) {
    fail(res, e, "Failed to join tournament");
  }
};

export const getTournamentProgress = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const data = await tournaments.getProgress(email, req.params.id);
    successResponse(res, 200, "Tournament progress fetched", data);
  } catch (e) {
    fail(res, e, "Failed to fetch tournament progress");
  }
};

export const getTournamentLeaderboard = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req).catch(() => "");
    const size = Number(req.query.size) || null;
    const data = await tournaments.buildLeaderboard(req.params.id, email, size);
    successResponse(res, 200, "Leaderboard fetched", { leaderboard: data });
  } catch (e) {
    fail(res, e, "Failed to fetch leaderboard");
  }
};

/** POST /tournaments/:id/score — record points from a forwarded play. */
export const submitTournamentScore = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const b = req.body ?? {};
    const data = await tournaments.recordScore(
      email,
      req.params.id,
      Number(b.points) || 0,
      str(b.game),
      externalId(req)
    );
    successResponse(res, 200, "Score recorded", data);
  } catch (e) {
    fail(res, e, "Failed to record score");
  }
};

export const claimTournament = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const data = await tournaments.claimTournament(email, req.params.id);
    successResponse(res, 200, "Tournament prize claimed", data);
  } catch (e) {
    fail(res, e, "Failed to claim tournament prize");
  }
};

export const userTournaments = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const data = await tournaments.listUserTournaments(email);
    successResponse(res, 200, "User tournaments fetched", { tournaments: data });
  } catch (e) {
    fail(res, e, "Failed to fetch user tournaments");
  }
};

/* ── Aggregate user views ─────────────────────────────────────────────────── */

export const userProgress = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const [m, t] = await Promise.all([
      missions.listUserMissions(email),
      tournaments.listUserTournaments(email),
    ]);
    successResponse(res, 200, "User progress fetched", {
      missions: m,
      tournaments: t,
    });
  } catch (e) {
    fail(res, e, "Failed to fetch user progress");
  }
};

/** All rewards the player has earned (any status). */
export const userRewards = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const player = await Player.findOne({ where: { email } });
    if (!player) throw new AppError("Player not found", 404);
    const rewards = await PlayerReward.findAll({
      where: { player_id: player.id },
      order: [["created_at", "DESC"]],
    });
    successResponse(res, 200, "Rewards fetched", { rewards });
  } catch (e) {
    fail(res, e, "Failed to fetch rewards");
  }
};

/** Rewards the player has actually claimed (status GRANTED). */
export const userClaims = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const player = await Player.findOne({ where: { email } });
    if (!player) throw new AppError("Player not found", 404);
    const claims = await PlayerReward.findAll({
      where: { player_id: player.id, status: "GRANTED" },
      order: [["granted_date", "DESC"]],
    });
    successResponse(res, 200, "Claims fetched", { claims });
  } catch (e) {
    fail(res, e, "Failed to fetch claims");
  }
};

/* ── Activity ingress ─────────────────────────────────────────────────────── */

/**
 * POST /integration/activity — the games platform forwards a gameplay or login
 * event; GAMRU advances all of the player's relevant missions (and, when a
 * tournament + points are supplied, the tournament score). Returns the player's
 * fresh mission snapshot so the consumer can cache it.
 */
export const recordActivity = async (req: Request, res: Response) => {
  try {
    const email = await resolveEmail(req);
    const b = req.body ?? {};
    const kind = str(b.kind) ?? "play";

    if (kind === "login") {
      await missions.advanceForLogin(email);
      // A login also fires any ACTIVE "Event: Login" campaign for this player,
      // landing the rendered message in their on-site inbox. Best-effort — a
      // campaign failure must never break the activity pipeline.
      const player = await playerRepository.findOne({ email } as WhereOptions);
      if (player) {
        void triggerCampaignsForEvent(player, "LOGIN").catch((err) =>
          console.error("Login campaign trigger failed:", err)
        );
      }
    } else {
      await missions.advanceForActivity(
        email,
        {
          stake: Number(b.stake) || 0,
          win: Boolean(b.win),
          winAmount: Number(b.winAmount) || 0,
          gameKey: str(b.gameKey),
        },
        { missionId: str(b.missionId), bundleId: str(b.bundleId) }
      );
      const tournamentId = str(b.tournamentId);
      if (tournamentId && Number(b.points) > 0) {
        await tournaments.recordScore(
          email,
          tournamentId,
          Number(b.points) || 0,
          str(b.gameKey),
          externalId(req)
        );
      }
    }

    const snapshot = await missions.listMissions(email);
    successResponse(res, 200, "Activity processed", { missions: snapshot });
  } catch (e) {
    fail(res, e, "Failed to process activity");
  }
};
