/**
 * Campaign INTEGRATION controller — the cross-service face of the campaign
 * channel, sitting beside `integration-progress.controller.ts` (missions /
 * tournaments). The games platform calls these over `x-client-auth-key`,
 * resolving the player by email, exactly like the progression surface.
 *
 * The two halves of the campaign bridge:
 *   - TRIGGER (write): `POST /api/integration/events` → `receiveEvent`
 *     (in `integration.controller.ts`) evaluates event-triggered campaigns.
 *   - INBOX (read): the four handlers below — list / read / click / unsubscribe.
 *
 * Delivery logic itself stays in the campaign domain (`campaign/service/
 * inbox.service.ts` + `campaign-delivery.service.ts`); this controller only
 * adapts HTTP ⇄ service, so the feature flow is unchanged — only its home in
 * the module tree mirrors missions & tournaments.
 */
import { Request, Response } from "express";
import {
  getInboxService,
  markInboxReadService,
  markInboxClickedService,
  unsubscribeService,
} from "../../campaign/service/inbox.service";
import { CampaignChannel } from "../../player/model/player-campaign-history.model";
import { errorResponse, successResponse } from "../../../utils/responseHandler";
import { AppError } from "../../../utils/AppError";

const handle = (res: Response, error: unknown, fallback: string): Response => {
  if (error instanceof AppError) {
    return errorResponse(res, error.statusCode, error.message);
  }
  return errorResponse(res, 500, fallback);
};

/** The player's email arrives in the body (POST) or query (GET fallback). */
const emailOf = (req: Request): string | undefined =>
  (req.body?.email as string | undefined) ??
  (req.query?.email as string | undefined);

export const listInbox = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page ?? req.body?.page ?? 1);
    const limit = Number(req.query.limit ?? req.body?.limit ?? 20);
    const unreadOnly =
      req.query.unread_only === "true" || req.body?.unread_only === true;
    const data = await getInboxService(emailOf(req) ?? "", page, limit, unreadOnly);
    successResponse(res, 200, "Inbox fetched successfully", data);
  } catch (error) {
    handle(res, error, "Failed to fetch inbox");
  }
};

export const readInbox = async (req: Request, res: Response) => {
  try {
    const data = await markInboxReadService(emailOf(req) ?? "", req.params.id);
    successResponse(res, 200, "Message marked as read", data);
  } catch (error) {
    handle(res, error, "Failed to mark message as read");
  }
};

export const clickInbox = async (req: Request, res: Response) => {
  try {
    const data = await markInboxClickedService(emailOf(req) ?? "", req.params.id);
    successResponse(res, 200, "Message click recorded", data);
  } catch (error) {
    handle(res, error, "Failed to record message click");
  }
};

export const unsubscribeInbox = async (req: Request, res: Response) => {
  try {
    const data = await unsubscribeService(
      emailOf(req) ?? "",
      (req.body?.channel as CampaignChannel) ?? "ON_SITE",
      req.body?.reason as string | undefined,
      req.body?.campaign_name as string | undefined
    );
    successResponse(res, 200, "Unsubscribed successfully", data);
  } catch (error) {
    handle(res, error, "Failed to unsubscribe");
  }
};
