import { Router } from "express";
import {
  paginatePlayers,
  getPlayer,
  createPlayer,
  updatePlayer,
  deletePlayer,
  getCampaignHistory,
  getRewards,
  addManualReward,
  claimReward,
  getLogs,
  getPlayerByEmail,
  addPlayerXpByEmail,
  purchaseRewardShop,
  claimMissionReward,
  getPlayerMissions,
  getPlayerTournaments,
  getPlayerBundles,
} from "../modules/player/controller/player.controller";
import { auth } from "../middlewares/auth.middleware";
import { clientAuth } from "../middlewares/clientAuth.middleware";
import { flexAuth } from "../middlewares/flexAuth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createPlayerSchema,
  updatePlayerSchema,
  playerIdParamSchema,
  manualRewardSchema,
  addXpByEmailSchema,
  purchaseRewardShopSchema,
} from "../validations/player.validation";

const router = Router();

router.get("/paginate", auth, paginatePlayers);

router.post("/add", auth, validate(createPlayerSchema), createPlayer);

// GET /:id is hit by BOTH the gamru admin UI (logged-in operator with
// JWT) and external service backends (x-client-auth-key). `flexAuth`
// accepts either credential and routes to the matching guard.
router.get(
  "/:id",
  flexAuth,
  validate(playerIdParamSchema, "params"),
  getPlayer
);

// The two `by-email` endpoints are only called by external service
// backends — they look players up by the consumer's external email,
// which an admin UI would never do. So they stay locked down to
// `x-client-auth-key` only.
router.post("/by-email", clientAuth, getPlayerByEmail);

router.post(
  "/by-email/add-xp",
  clientAuth,
  validate(addXpByEmailSchema, "body"),
  addPlayerXpByEmail
);

router.post(
  "/update-by/:id",
  auth,
  validate(playerIdParamSchema, "params"),
  validate(updatePlayerSchema, "body"),
  updatePlayer
);

router.delete(
  "/:id",
  auth,
  validate(playerIdParamSchema, "params"),
  deletePlayer
);

router.get(
  "/:id/campaign-history",
  auth,
  validate(playerIdParamSchema, "params"),
  getCampaignHistory
);

router.get(
  "/:id/rewards",
  auth,
  validate(playerIdParamSchema, "params"),
  getRewards
);

// Per-player mission progress & tournament standings for the operator console
// (admin JWT). These read the same GAMRU progress tables the games platform
// consumes via /api/integration, so the backoffice sees identical data.
router.get(
  "/:id/missions",
  auth,
  validate(playerIdParamSchema, "params"),
  getPlayerMissions
);
router.get(
  "/:id/tournaments",
  auth,
  validate(playerIdParamSchema, "params"),
  getPlayerTournaments
);
router.get(
  "/:id/bundles",
  auth,
  validate(playerIdParamSchema, "params"),
  getPlayerBundles
);
router.post(
  "/:id/rewards",
  auth,
  validate(playerIdParamSchema, "params"),
  validate(manualRewardSchema, "body"),
  addManualReward
);

// End-user "Claim" action is initiated by a service backend
// (e.g. game-platform → gamru), so the route is gated by clientAuth.
router.post(
  "/:id/rewards/:rewardId/claim",
  clientAuth,
  claimReward
);

// Mission reward grant: a service backend (e.g. games platform → gamru)
// claims a player's completed mission. gamru looks up the mission's reward
// from its trusted definition and lands it in the player's reward ledger.
// clientAuth-gated like the claim flow.
router.post(
  "/:id/missions/:missionId/claim",
  clientAuth,
  claimMissionReward
);

// Reward-shop purchase: a service backend (e.g. games platform → gamru)
// spends the player's tokens on a reward_shop product. clientAuth-gated
// like the claim flow; the deduction + stock + audit are atomic in the
// service.
router.post(
  "/:id/reward-shop/purchase",
  clientAuth,
  validate(playerIdParamSchema, "params"),
  validate(purchaseRewardShopSchema, "body"),
  purchaseRewardShop
);

router.get("/:id/logs", auth, validate(playerIdParamSchema, "params"), getLogs);

// Swagger payloads for the S2S endpoints whose body isn't Joi-validated
// (docs-only — see src/docs/swagger.js requestSchema override).
(router as Router & { docs?: Record<string, unknown> }).docs = {
  "POST /by-email": {
    requestSchema: {
      type: "object",
      required: ["email"],
      properties: {
        email: { type: "string", format: "email", example: "jane@x.com" },
      },
    },
    requestExample: { email: "jane@x.com" },
  },
};

export default router;
