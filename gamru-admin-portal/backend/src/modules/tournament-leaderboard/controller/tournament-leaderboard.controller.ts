import { Request, Response } from "express";
import { successResponse, errorResponse } from "../../../utils/responseHandler";
import {
  submitScore,
  getLeaderboard,
} from "../service/tournament-leaderboard.service";

/**
 * POST /api/tournament-leaderboard/:tournamentId/score   (clientAuth)
 * Body: { email, name?, points }
 * Called by the games platform to add a player's tournament points.
 */
export const postScore = async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;
    const { email, name, points } = req.body ?? {};
    if (!email || typeof email !== "string") {
      return errorResponse(res, 400, "email is required");
    }
    const numPoints = Number(points);
    if (!Number.isFinite(numPoints)) {
      return errorResponse(res, 400, "points must be a number");
    }
    const row = await submitScore({
      tournamentId,
      email,
      name: name ?? null,
      points: numPoints,
    });
    return successResponse(res, 200, "Score recorded", row);
  } catch {
    return errorResponse(res, 500, "Failed to record score");
  }
};

/**
 * GET /api/tournament-leaderboard/:tournamentId   (auth — backoffice)
 * Returns the standings for a tournament.
 */
export const getStandings = async (req: Request, res: Response) => {
  try {
    const data = await getLeaderboard(req.params.tournamentId);
    return successResponse(res, 200, "Leaderboard fetched", data);
  } catch {
    return errorResponse(res, 500, "Failed to fetch leaderboard");
  }
};
