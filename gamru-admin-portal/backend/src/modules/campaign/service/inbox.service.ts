/**
 * Player-facing INBOX — the read side of the on-site channel. The games
 * platform calls these over `x-client-auth-key`, resolving the player by the
 * consumer's email (same contract as `/players/by-email`).
 *
 *   list   → the player's delivered campaign messages (+ unread badge count)
 *   read   → mark one opened   (records a real OPEN engagement event)
 *   click  → mark one clicked  (records a real CLICK engagement event)
 *   unsub  → opt the player out of a channel (writes the unsubscribe report)
 */
import { AppError } from "../../../utils/AppError";
import Player from "../../player/model/player.model";
import {
  playerRepository,
  playerCampaignHistoryRepository,
} from "../../player/model/player.repository";
import PlayerCampaignHistory, {
  CampaignChannel,
} from "../../player/model/player-campaign-history.model";
import UnsubscribeReport from "../../unsubscribe-report/model/unsubscribe-report.model";
import { trackEventService } from "../../analytics/service/analytics.service";
import type { HistoryChannel } from "../../analytics/model/campaign-history.model";
import type {
  UnsubscribeChannel,
} from "../../unsubscribe-report/model/unsubscribe-report.model";

/** Inbox channel enum → analytics history channel. */
const ANALYTICS_CHANNEL: Record<CampaignChannel, HistoryChannel> = {
  EMAIL: "EMAIL",
  SMS: "SMS",
  WEB_PUSH: "WEB_PUSH",
  ON_SITE: "ONSITE",
  PUSH: "ONSITE",
};

/** Inbox channel enum → consent / unsubscribe channel. */
const UNSUB_CHANNEL: Record<CampaignChannel, UnsubscribeChannel> = {
  EMAIL: "EMAIL",
  SMS: "SMS",
  WEB_PUSH: "WEBPUSH",
  ON_SITE: "ONSITE",
  PUSH: "INAPP",
};

const resolvePlayer = async (email?: string): Promise<Player> => {
  if (!email) throw new AppError("email is required", 400);
  const player = await playerRepository.findOne({ email });
  if (!player) throw new AppError("Player not found", 404);
  return player;
};

const toInboxItem = (row: PlayerCampaignHistory) => ({
  id: row.id,
  campaign_id: row.campaign_id ?? null,
  channel: row.channel,
  title: row.title,
  body: row.body ?? "",
  status: row.status,
  read: Boolean(row.read_at),
  event_label: row.event_label ?? null,
  event_at: row.event_at,
  read_at: row.read_at ?? null,
});

export const getInboxService = async (
  email: string,
  page: number,
  limit: number,
  unreadOnly: boolean
) => {
  const player = await resolvePlayer(email);
  const result = await playerCampaignHistoryRepository.paginateForPlayer(
    player.id,
    page,
    limit,
    undefined,
    unreadOnly
  );
  const unread = await playerCampaignHistoryRepository.countUnreadForPlayer(
    player.id
  );
  return {
    unread_count: unread,
    items: result.data.map(toInboxItem),
    pagination: result.pagination,
  };
};

const markEngagement = async (
  email: string,
  deliveryId: string,
  newStatus: "OPEN" | "CLICKED"
) => {
  const player = await resolvePlayer(email);
  const row = await playerCampaignHistoryRepository.findForPlayer(
    deliveryId,
    player.id
  );
  if (!row) throw new AppError("Message not found", 404);

  const patch: Partial<PlayerCampaignHistory["_creationAttributes"]> = {
    status: newStatus,
  };
  if (!row.read_at) patch.read_at = new Date();
  await row.update(patch);

  // Record the real engagement event against the campaign's analytics.
  if (row.campaign_id) {
    await trackEventService({
      campaign_id: row.campaign_id,
      player_id: player.id,
      status: newStatus === "OPEN" ? "OPEN" : "CLICK",
      channel: ANALYTICS_CHANNEL[row.channel],
    });
  }
  return toInboxItem(await row.reload());
};

export const markInboxReadService = (email: string, deliveryId: string) =>
  markEngagement(email, deliveryId, "OPEN");

export const markInboxClickedService = (email: string, deliveryId: string) =>
  markEngagement(email, deliveryId, "CLICKED");

export const unsubscribeService = async (
  email: string,
  channel: CampaignChannel,
  reason?: string,
  campaignName?: string
) => {
  const player = await resolvePlayer(email);

  // Flip the matching consent flag off so future deliveries are suppressed.
  const consents = {
    ...((player.consents as Record<string, unknown> | null) ?? {}),
  };
  const consentKey =
    channel === "EMAIL"
      ? "email"
      : channel === "SMS"
        ? "sms"
        : channel === "WEB_PUSH" || channel === "PUSH"
          ? "push"
          : null;
  if (consentKey) {
    consents[consentKey] = false;
    await playerRepository.updateByPk(player.id, {
      consents,
    } as Partial<Player["_creationAttributes"]>);
  }

  await UnsubscribeReport.create({
    player_id: player.id,
    campaign_name: campaignName ?? null,
    channel: UNSUB_CHANNEL[channel],
    reason: reason ?? null,
    unsubscribed_at: new Date(),
  });

  return { unsubscribed: true, channel };
};
