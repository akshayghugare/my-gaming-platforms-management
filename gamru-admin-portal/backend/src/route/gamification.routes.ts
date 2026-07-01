import { Router } from "express";
import {
  gamificationModels,
  GAMIFICATION_FEATURES,
  GamificationFeatureKey,
} from "../modules/gamification/shared/gamification.model";
import { buildGamificationRouter } from "../modules/gamification/shared/gamification.controller";

const router = Router();

const LABELS: Record<GamificationFeatureKey, string> = {
  missions: "Mission",
  "mission-bundles": "Mission Bundle",
  ranks: "Rank",
  "token-rules-casino": "Token Rule (Casino)",
  "token-rules-sports": "Token Rule (Sports)",
  "xp-point-rules-casino": "XP Point Rule (Casino)",
  "xp-point-rules-sports": "XP Point Rule (Sports)",
  "player-categories": "Player Category",
  "reward-shop": "Reward Shop Item",
  "prizeshark-catalog": "Prizeshark Catalog Item",
  "purchase-feed": "Purchase Feed Entry",
  tournaments: "Tournament",
};

(Object.keys(GAMIFICATION_FEATURES) as GamificationFeatureKey[]).forEach(
  (key) => {
    router.use(
      `/${key}`,
      buildGamificationRouter(gamificationModels[key], LABELS[key], {
        validateRankContinuity: key === "ranks",
        syncBonusesFromRankData: key === "ranks",
        participationFeature:
          key === "missions" || key === "mission-bundles" ? key : undefined,
      })
    );
  }
);

// Swagger payload for the S2S participation-record endpoint (body isn't
// Joi-validated — docs-only). Only missions & mission-bundles expose it.
const participantsPayload = {
  requestSchema: {
    type: "object",
    required: ["email"],
    properties: {
      email: { type: "string", format: "email", example: "jane@x.com" },
      external_id: { type: "string", example: "P-1001", description: "your platform's user id" },
      name: { type: "string", example: "Jane" },
      status: { type: "string", enum: ["IN_PROGRESS", "COMPLETED", "CLAIMED"], example: "IN_PROGRESS" },
    },
  },
  requestExample: { email: "jane@x.com", external_id: "P-1001", status: "IN_PROGRESS" },
};
(router as Router & { docs?: Record<string, unknown> }).docs = {
  "POST /missions/:id/participants": participantsPayload,
  "POST /mission-bundles/:id/participants": participantsPayload,
};

export default router;
