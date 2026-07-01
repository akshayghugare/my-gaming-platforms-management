import { Request, Response } from "express";
import { Op, WhereOptions } from "sequelize";
import { AuthRequest } from "../../../types/request.type";
import { successResponse, errorResponse } from "../../../utils/responseHandler";
import { AppError } from "../../../utils/AppError";
import BonusRepository from "../model/bonus.repository";
import UserBonusRepository from "../model/user-bonus.repository";
import { recordUserBonusClaim } from "../service/bonus-sync.service";

/** Build a case-insensitive OR-match `where` across the given columns. */
const searchWhere = (
  search: string | undefined,
  columns: string[]
): WhereOptions | undefined => {
  const q = (search ?? "").trim();
  if (!q) return undefined;
  return {
    [Op.or]: columns.map((col) => ({ [col]: { [Op.iLike]: `%${q}%` } })),
  } as WhereOptions;
};

const fail = (res: Response, error: unknown, fallback: string) => {
  if (error instanceof AppError)
    return errorResponse(res, error.statusCode, error.message);
  return errorResponse(res, 500, fallback);
};

/** Operator console: list the synced SDLCGames bonus definitions. */
export const listBonuses = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 25);
    const where = searchWhere(req.query.search as string, [
      "bonus_name",
      "bonus_type",
      "external_bonus_id",
      "source",
    ]);
    const data = await BonusRepository.paginate(page, limit, where);
    successResponse(res, 200, "Bonuses fetched successfully", data);
  } catch (e) {
    fail(res, e, "Failed to fetch bonuses");
  }
};

/** Operator console: list the bonuses players have claimed (the ledger mirror). */
export const listUserBonuses = async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 25);
    const where = searchWhere(req.query.search as string, [
      "email",
      "user_id",
      "bonus_name",
      "external_bonus_id",
      "source_type",
      "source",
    ]);
    const data = await UserBonusRepository.paginate(page, limit, where);
    successResponse(res, 200, "User bonuses fetched successfully", data);
  } catch (e) {
    fail(res, e, "Failed to fetch user bonuses");
  }
};

/**
 * Games platform (S2S, clientAuth): mirror a bonus a player just claimed into
 * GAMRU's user_bonuses ledger (+ keep the bonus snapshot fresh).
 */
export const recordClaim = async (req: Request, res: Response) => {
  try {
    const b = req.body ?? {};
    if (!b.external_bonus_id || !b.source_type) {
      return errorResponse(
        res,
        400,
        "external_bonus_id and source_type are required"
      );
    }
    const row = await recordUserBonusClaim({
      email: b.email ?? null,
      external_id: b.external_id ?? null,
      external_bonus_id: String(b.external_bonus_id),
      bonus_name: String(b.bonus_name ?? "Bonus"),
      bonus_type: b.bonus_type,
      source_type: String(b.source_type),
      source_id: String(b.source_id ?? ""),
      amount: Number(b.amount ?? 0),
      amount_type: String(b.amount_type ?? "RM"),
      source: b.source ?? "SDLCGAMES",
    });
    successResponse(res, 200, "Bonus claim recorded", { id: row.id });
  } catch (e) {
    fail(res, e, "Failed to record bonus claim");
  }
};
