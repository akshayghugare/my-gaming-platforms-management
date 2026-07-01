/**
 * Missions & tournaments source-of-truth API — GAMRU owns all progression logic
 * (join, progress, completion, ranking, settlement, claim). The games platform
 * consumes these over `x-client-auth-key` (clientAuth); the player is resolved
 * by `email` (body for POST, query for GET).
 *
 * These live at TOP-LEVEL resource paths — `/api/missions`, `/api/tournaments`,
 * `/api/users`, `/api/activity` — not under an `/integration` prefix. The
 * legacy lifecycle-event hook stays at `/api/integration/events`.
 */
import { Router } from "express";
import * as p from "../modules/integration/controller/integration-progress.controller";
import { clientAuth } from "../middlewares/clientAuth.middleware";

// /api/missions
export const missionProgressRoutes = Router();
missionProgressRoutes.get("/", clientAuth, p.listMissions);
missionProgressRoutes.get("/:id", clientAuth, p.getMission);
missionProgressRoutes.post("/:id/join", clientAuth, p.joinMission);
missionProgressRoutes.post("/:id/cancel", clientAuth, p.cancelMission);
missionProgressRoutes.get("/:id/progress", clientAuth, p.getMissionProgress);
missionProgressRoutes.post("/:id/progress", clientAuth, p.updateMissionProgress);
missionProgressRoutes.post("/:id/claim", clientAuth, p.claimMission);

// /api/mission-bundles — player-facing eligible bundles (grouped progress) plus
// the per-member-mission lifecycle on the bundle's own track.
export const missionBundleProgressRoutes = Router();
missionBundleProgressRoutes.get("/", clientAuth, p.listMissionBundles);
missionBundleProgressRoutes.get("/:id", clientAuth, p.getMissionBundle);
missionBundleProgressRoutes.post(
  "/:id/missions/:missionId/join",
  clientAuth,
  p.joinBundleMission
);
missionBundleProgressRoutes.post(
  "/:id/missions/:missionId/cancel",
  clientAuth,
  p.cancelBundleMission
);
missionBundleProgressRoutes.get(
  "/:id/missions/:missionId/progress",
  clientAuth,
  p.getBundleMissionProgress
);
missionBundleProgressRoutes.post(
  "/:id/missions/:missionId/progress",
  clientAuth,
  p.updateBundleMissionProgress
);
missionBundleProgressRoutes.post(
  "/:id/missions/:missionId/claim",
  clientAuth,
  p.claimBundleMission
);

// /api/tournaments
export const tournamentProgressRoutes = Router();
tournamentProgressRoutes.get("/", clientAuth, p.listTournaments);
tournamentProgressRoutes.get("/:id", clientAuth, p.getTournament);
tournamentProgressRoutes.post("/:id/join", clientAuth, p.joinTournament);
tournamentProgressRoutes.get("/:id/progress", clientAuth, p.getTournamentProgress);
tournamentProgressRoutes.get("/:id/leaderboard", clientAuth, p.getTournamentLeaderboard);
tournamentProgressRoutes.post("/:id/score", clientAuth, p.submitTournamentScore);
tournamentProgressRoutes.post("/:id/claim", clientAuth, p.claimTournament);

// /api/users — per-player aggregate views (mounted alongside the operator
// users router; its routes are 2-segment so they never collide with the
// operator's `/users/:id` 1-segment routes).
export const userProgressRoutes = Router();
userProgressRoutes.get("/:userId/missions", clientAuth, p.userMissions);
userProgressRoutes.get("/:userId/tournaments", clientAuth, p.userTournaments);
userProgressRoutes.get("/:userId/progress", clientAuth, p.userProgress);
userProgressRoutes.get("/:userId/rewards", clientAuth, p.userRewards);
userProgressRoutes.get("/:userId/claims", clientAuth, p.userClaims);

// /api/activity — the consumer forwards gameplay / login events here.
export const activityRoutes = Router();
activityRoutes.post("/", clientAuth, p.recordActivity);
