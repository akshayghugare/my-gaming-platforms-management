import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../types/request.type";
import {
  paginatePlayersService,
  getPlayerService,
  createPlayerService,
  updatePlayerService,
  deletePlayerService,
  getCampaignHistoryService,
  getRewardsService,
  addManualRewardService,
  claimRewardService,
  getLogsService,
  getPlayerByEmailService,
  addPlayerXpByEmailService,
  purchaseRewardShopService,
  grantMissionRewardService,
  getPlayerMissionsService,
  getPlayerTournamentsService,
  getPlayerBundlesService,
} from "../service/player.service";
import { errorResponse, successResponse } from "../../../utils/responseHandler";
import { AppError } from "../../../utils/AppError";

const handle = (res: Response, error: unknown, fallback: string): Response => {
  if (error instanceof AppError) {
    return errorResponse(res, error.statusCode, error.message);
  }
  return errorResponse(res, 500, fallback);
};

const pageLimit = (req: AuthRequest) => ({
  page: Number(req.query.page || 1),
  limit: Number(req.query.limit || 25),
});

export const paginatePlayers = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { page, limit } = pageLimit(req);
    const data = await paginatePlayersService(page, limit, {
      search: req.query.search as string | undefined,
      status: req.query.status as string | undefined,
      country: req.query.country as string | undefined,
      field: req.query.field as
        | "all"
        | "name"
        | "email"
        | "username"
        | "player_id"
        | undefined,
    });
    successResponse(res, 200, "Players fetched successfully", data);
  } catch (error) {
    handle(res, error, "Failed to fetch players");
  }
};

export const getPlayer = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = await getPlayerService(req.params.id);
    successResponse(res, 200, "Player fetched successfully", data);
  } catch (error) {
    handle(res, error, "Failed to fetch player");
  }
};

export const getPlayerByEmail = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { email } = req.body;

    const data = await getPlayerByEmailService(email);

    successResponse(res, 200, "Player fetched successfully", data);
  } catch (error) {
    handle(res, error, "Failed to fetch player");
  }
};

export const addPlayerXpByEmail = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { email, amount, game } = req.body;
    const data = await addPlayerXpByEmailService(
      email,
      amount,
      req.user?.email ?? null,
      game ?? null
    );
    successResponse(res, 200, "Player XP updated successfully", data);
  } catch (error) {
    handle(res, error, "Failed to update player XP");
  }
};

export const createPlayer = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = await createPlayerService(req.body);
    successResponse(res, 200, "Player created successfully", data);
  } catch (error) {
    handle(res, error, "Failed to create player");
  }
};

export const updatePlayer = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = await updatePlayerService(req.params.id, req.body);
    successResponse(res, 200, "Player updated successfully", data);
  } catch (error) {
    handle(res, error, "Failed to update player");
  }
};

export const deletePlayer = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    await deletePlayerService(req.params.id);
    successResponse(res, 200, "Player deleted successfully", null);
  } catch (error) {
    handle(res, error, "Failed to delete player");
  }
};

export const getCampaignHistory = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { page, limit } = pageLimit(req);
    const data = await getCampaignHistoryService(
      req.params.id,
      page,
      limit,
      req.query.search as string | undefined
    );
    successResponse(res, 200, "Campaign history fetched successfully", data);
  } catch (error) {
    handle(res, error, "Failed to fetch campaign history");
  }
};

export const getRewards = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { page, limit } = pageLimit(req);
    const data = await getRewardsService(req.params.id, page, limit);
    successResponse(res, 200, "Rewards fetched successfully", data);
  } catch (error) {
    handle(res, error, "Failed to fetch rewards");
  }
};

export const getPlayerMissions = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = await getPlayerMissionsService(req.params.id);
    successResponse(res, 200, "Player missions fetched successfully", {
      missions: data,
    });
  } catch (error) {
    handle(res, error, "Failed to fetch player missions");
  }
};

export const getPlayerTournaments = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = await getPlayerTournamentsService(req.params.id);
    successResponse(res, 200, "Player tournaments fetched successfully", {
      tournaments: data,
    });
  } catch (error) {
    handle(res, error, "Failed to fetch player tournaments");
  }
};

export const getPlayerBundles = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = await getPlayerBundlesService(req.params.id);
    successResponse(res, 200, "Player mission bundles fetched successfully", {
      bundles: data,
    });
  } catch (error) {
    handle(res, error, "Failed to fetch player mission bundles");
  }
};

export const addManualReward = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = await addManualRewardService(req.params.id, {
      reward_type: req.body.reward_type,
      reward: req.body.reward ?? null,
      actor: req.user?.email ?? null,
    });
    successResponse(res, 200, "Manual reward added successfully", data);
  } catch (error) {
    handle(res, error, "Failed to add manual reward");
  }
};

export const claimReward = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = await claimRewardService(
      req.params.id,
      req.params.rewardId,
      req.user?.email ?? "player"
    );
    successResponse(res, 200, "Reward claimed successfully", data);
  } catch (error) {
    handle(res, error, "Failed to claim reward");
  }
};

export const claimMissionReward = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = await grantMissionRewardService(
      req.params.id,
      req.params.missionId,
      req.user?.email ?? "player"
    );
    successResponse(res, 200, "Mission reward granted successfully", data);
  } catch (error) {
    handle(res, error, "Failed to grant mission reward");
  }
};

export const purchaseRewardShop = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const data = await purchaseRewardShopService(
      req.params.id,
      req.body.shop_item_id,
      req.body.quantity ?? 1,
      req.user?.email ?? "player"
    );
    successResponse(res, 200, "Reward shop purchase successful", data);
  } catch (error) {
    handle(res, error, "Failed to complete reward shop purchase");
  }
};

export const getLogs = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    const { page, limit } = pageLimit(req);
    const data = await getLogsService(req.params.id, page, limit);
    successResponse(res, 200, "Logs fetched successfully", data);
  } catch (error) {
    handle(res, error, "Failed to fetch logs");
  }
};
