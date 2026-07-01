import { Router } from "express";
import { auth } from "../middlewares/auth.middleware";
import { clientAuth } from "../middlewares/clientAuth.middleware";
import {
  postScore,
  getStandings,
} from "../modules/tournament-leaderboard/controller/tournament-leaderboard.controller";

const router = Router();

// Games platform → gamru: add a player's tournament points (s2s).
router.post("/:tournamentId/score", clientAuth, postScore);

// Backoffice: view the standings.
router.get("/:tournamentId", auth, getStandings);

// Swagger payload (body isn't Joi-validated — docs-only).
(router as Router & { docs?: Record<string, unknown> }).docs = {
  "POST /:tournamentId/score": {
    requestSchema: {
      type: "object",
      required: ["email", "points"],
      properties: {
        email: { type: "string", format: "email", example: "jane@x.com" },
        name: { type: "string", nullable: true, example: "Jane" },
        points: { type: "number", example: 1500, description: "points to ADD to the player's running total" },
      },
    },
    requestExample: { email: "jane@x.com", name: "Jane", points: 1500 },
  },
};

export default router;
