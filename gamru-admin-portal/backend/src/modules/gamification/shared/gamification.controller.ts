import { Router, Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../../types/request.type";
import { auth } from "../../../middlewares/auth.middleware";
import { clientAuth } from "../../../middlewares/clientAuth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import { errorResponse, successResponse } from "../../../utils/responseHandler";
import { AppError } from "../../../utils/AppError";
import { GamificationEntity } from "./gamification.model";
import { GamificationService } from "./gamification.service";
import { assertValidRankPayload } from "./rank.guard";
import { syncRankBonuses } from "../../bonus/service/bonus-sync.service";
import {
  loadParticipantCounts,
  listParticipants,
  recordParticipation,
  ParticipationFeature,
} from "./participation.service";
import {
  paginateGamificationSchema,
  upsertGamificationSchema,
  archiveGamificationSchema,
  gamificationIdParamSchema,
} from "../../../validations/gamification.validation";

const fail = (res: Response, error: unknown, fallback: string) => {
  if (error instanceof AppError) {
    return errorResponse(res, error.statusCode, error.message);
  }
  return errorResponse(res, 500, fallback);
};

/**
 * Builds a fully-wired CRUD router for one gamification feature.
 * Endpoints mirror the rest of the codebase:
 *   GET    /paginate
 *   GET    /:id
 *   POST   /add
 *   POST   /update-by/:id
 *   POST   /archive-by/:id
 *   DELETE /:id
 */
interface GamificationRouterOptions {
  /** Enforce the single-ladder rank rules (continuity + uniqueness). */
  validateRankContinuity?: boolean;
  /**
   * When set, after a create/update GAMRU snapshots every SDLCGames bonus id
   * pinned on the payload's `data` (level + rank-wide `bonus_ids`) into its
   * `bonuses` table. Only ranks.
   */
  syncBonusesFromRankData?: boolean;
  /**
   * When set, exposes the "participated players" surface for this feature:
   * a `participant_count` on each /paginate row and a GET /:id/participants
   * list (derived from claimed mission rewards). Only missions & bundles.
   */
  participationFeature?: ParticipationFeature;
}

export const buildGamificationRouter = (
  model: typeof GamificationEntity,
  label: string,
  options: GamificationRouterOptions = {}
): Router => {
  const router = Router();
  const service = new GamificationService(model, label);

  router.get(
    "/paginate",
    auth,
    validate(paginateGamificationSchema, "query"),
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      try {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 25);
        const data = await service.paginate(page, limit, {
          search: (req.query.search as string) || undefined,
          status: (req.query.status as "ACTIVE" | "INACTIVE") || undefined,
          archived: req.query.archived === "true",
          tag: (req.query.tag as string) || undefined,
        });
        if (options.participationFeature) {
          const counts = await loadParticipantCounts(
            data.data,
            options.participationFeature
          );
          successResponse(res, 200, `${label} fetched successfully`, {
            ...data,
            data: data.data.map((row) => ({
              ...row.toJSON(),
              participant_count: counts[row.id] ?? 0,
            })),
          });
          return;
        }
        successResponse(res, 200, `${label} fetched successfully`, data);
      } catch (error) {
        fail(res, error, `Failed to fetch ${label}`);
      }
    }
  );

  router.get(
    "/:id",
    auth,
    validate(gamificationIdParamSchema, "params"),
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      try {
        const record = await service.get(req.params.id);
        if (!record) throw new AppError(`${label} not found`, 404);
        successResponse(res, 200, `${label} fetched successfully`, record);
      } catch (error) {
        fail(res, error, `Failed to fetch ${label}`);
      }
    }
  );

  if (options.participationFeature) {
    // Operator console: list / count the players who participated.
    router.get(
      "/:id/participants",
      auth,
      validate(gamificationIdParamSchema, "params"),
      async (req: AuthRequest, res: Response, _next: NextFunction) => {
        try {
          const record = await service.get(req.params.id);
          if (!record) throw new AppError(`${label} not found`, 404);
          const page = Number(req.query.page || 1);
          const limit = Number(req.query.limit || 10);
          const source = (req.query.source as string) || undefined;
          const result = await listParticipants(
            record,
            options.participationFeature as ParticipationFeature,
            page,
            limit,
            source
          );
          successResponse(res, 200, "Participants fetched successfully", result);
        } catch (error) {
          fail(res, error, "Failed to fetch participants");
        }
      }
    );

    // Games platform (S2S): record a player's participation on join / claim.
    router.post(
      "/:id/participants",
      clientAuth,
      validate(gamificationIdParamSchema, "params"),
      async (req: Request, res: Response, _next: NextFunction) => {
        try {
          const { email, external_id, name, status } = req.body ?? {};
          if (!email || typeof email !== "string") {
            return errorResponse(res, 400, "email is required");
          }
          await recordParticipation({
            feature: options.participationFeature as ParticipationFeature,
            entityId: req.params.id,
            email,
            externalId: external_id ?? null,
            name: name ?? null,
            status: status ?? null,
          });
          successResponse(res, 200, "Participation recorded", {
            recorded: true,
          });
        } catch (error) {
          fail(res, error, "Failed to record participation");
        }
      }
    );
  }

  router.post(
    "/add",
    auth,
    validate(upsertGamificationSchema, "body"),
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      try {
        if (options.validateRankContinuity) {
          await assertValidRankPayload(req.body);
        }
        const record = await service.create({
          ...req.body,
          created_by: req.user?.email ?? null,
        });
        if (options.syncBonusesFromRankData) {
          // Fire-and-forget: pull the pinned bonus definitions from SDLCGames.
          void syncRankBonuses(
            req.body?.data as Record<string, unknown> | undefined
          );
        }
        successResponse(res, 201, `${label} created successfully`, record);
      } catch (error) {
        fail(res, error, `Failed to create ${label}`);
      }
    }
  );

  router.post(
    "/update-by/:id",
    auth,
    validate(gamificationIdParamSchema, "params"),
    validate(upsertGamificationSchema, "body"),
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      try {
        if (options.validateRankContinuity) {
          await assertValidRankPayload(req.body, req.params.id);
        }
        const record = await service.update(req.params.id, req.body);
        if (options.syncBonusesFromRankData) {
          void syncRankBonuses(
            req.body?.data as Record<string, unknown> | undefined
          );
        }
        successResponse(res, 200, `${label} updated successfully`, record);
      } catch (error) {
        fail(res, error, `Failed to update ${label}`);
      }
    }
  );

  router.post(
    "/archive-by/:id",
    auth,
    validate(gamificationIdParamSchema, "params"),
    validate(archiveGamificationSchema, "body"),
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      try {
        const record = await service.setArchived(
          req.params.id,
          Boolean(req.body.archived)
        );
        successResponse(res, 200, `${label} updated successfully`, record);
      } catch (error) {
        fail(res, error, `Failed to archive ${label}`);
      }
    }
  );

  router.delete(
    "/:id",
    auth,
    validate(gamificationIdParamSchema, "params"),
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      try {
        await service.remove(req.params.id);
        successResponse(res, 200, `${label} deleted successfully`, null);
      } catch (error) {
        fail(res, error, `Failed to delete ${label}`);
      }
    }
  );

  return router;
};
