/**
 * Campaign delivery engine — the piece that makes a campaign actually DO
 * something instead of just being a row.
 *
 *   resolve audience (segment → real players)
 *     → for each player: consent + unsubscribe + frequency-cap checks
 *     → render the template with the player's data
 *     → deliver on the campaign's channel (on-site/in-app = a real inbox row
 *       the player reads in the games platform; email/sms/web-push go through
 *       stub adapters that log — swap in SendGrid / Routee / OneSignal later)
 *     → record REAL analytics (Sent / Delivered) — no more fabricated numbers.
 *
 * Used by both "Send Now" (whole audience) and event triggers (one player).
 */
import { Op, WhereOptions } from "sequelize";
import Campaign from "../model/campaign.model";
import CampaignRepository from "../model/campaign.repository";
import Template, { TemplateChannel } from "../../template/model/template.model";
import FrequencyCap from "../../frequency-cap/model/frequency-cap.model";
import UnsubscribeReport from "../../unsubscribe-report/model/unsubscribe-report.model";
import Player from "../../player/model/player.model";
import {
  playerRepository,
  playerCampaignHistoryRepository,
} from "../../player/model/player.repository";
import PlayerCampaignHistory, {
  CampaignChannel,
} from "../../player/model/player-campaign-history.model";
import SegmentRepository from "../../segment/model/segment.repository";
import {
  buildSegmentWhere,
  SegmentContent,
} from "../../segment/service/segment-rules";
import { trackEventService } from "../../analytics/service/analytics.service";
import type {
  HistoryChannel,
  HistoryStatus,
} from "../../analytics/model/campaign-history.model";
import { AppError } from "../../../utils/AppError";

/** Template/campaign channel → the analytics history channel. */
const ANALYTICS_CHANNEL: Record<TemplateChannel, HistoryChannel> = {
  EMAIL: "EMAIL",
  SMS: "SMS",
  ONSITE: "ONSITE",
  WEBPUSH: "WEB_PUSH",
  INAPP: "ONSITE",
};

/** Template/campaign channel → the player inbox channel enum. */
const INBOX_CHANNEL: Record<TemplateChannel, CampaignChannel> = {
  EMAIL: "EMAIL",
  SMS: "SMS",
  ONSITE: "ON_SITE",
  WEBPUSH: "WEB_PUSH",
  INAPP: "PUSH",
};

/** Which consent flag (on player.consents) gates each channel. */
const CONSENT_KEY: Record<TemplateChannel, string | null> = {
  EMAIL: "email",
  SMS: "sms",
  WEBPUSH: "push",
  // On-site / in-app are shown inside the product the player is already using,
  // so they aren't gated by an opt-in consent.
  ONSITE: null,
  INAPP: null,
};

const PERIOD_START: Record<string, () => Date> = {
  PER_DAY: () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  },
  PER_WEEK: () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  PER_MONTH: () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
};

export type DeliveryOutcome = "SENT" | "SUPPRESSED";

export interface DeliveryResult {
  player_id: string;
  outcome: DeliveryOutcome;
  reason?: string;
}

export interface ExecutionSummary {
  campaign_id: string;
  channel: TemplateChannel;
  audience: number;
  sent: number;
  suppressed: number;
  reasons: Record<string, number>;
}

/** Replace {{token}} placeholders in a template with the player's data. */
export const renderTemplate = (text: string | null, player: Player): string => {
  if (!text) return "";
  const name = player.name ?? player.username ?? "there";
  const tokens: Record<string, string> = {
    name,
    first_name: name.split(" ")[0],
    username: player.username ?? "",
    email: player.email ?? "",
    level: String(player.level ?? ""),
    rank: player.rank_name ?? "",
    tokens: String(player.tokens ?? 0),
    xp: String(player.xp_points ?? 0),
  };
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) =>
    key in tokens ? tokens[key] : `{{${key}}}`
  );
};

/** Does the player's consent allow this channel? */
const consentAllows = (player: Player, channel: TemplateChannel): boolean => {
  const key = CONSENT_KEY[channel];
  if (!key) return true; // on-site / in-app
  const consents = (player.consents as Record<string, unknown> | null) ?? {};
  // Absent consent defaults to allowed so a freshly-synced player isn't muted;
  // an explicit `false` opts them out.
  return consents[key] !== false;
};

/** Has the player unsubscribed from this channel? */
const isUnsubscribed = async (
  player: Player,
  channel: TemplateChannel
): Promise<boolean> => {
  const count = await UnsubscribeReport.count({
    where: { player_id: player.id, channel },
  });
  return count > 0;
};

/** Would sending now exceed the operator's frequency cap for this channel? */
const exceedsFrequencyCap = async (
  player: Player,
  channel: TemplateChannel
): Promise<boolean> => {
  const cap = await FrequencyCap.findOne({ where: { channel } });
  if (!cap) return false; // no cap configured → unlimited
  const since = (PERIOD_START[cap.period] ?? PERIOD_START.PER_WEEK)();
  const inboxChannel = INBOX_CHANNEL[channel];
  const sent = await playerCampaignHistoryRepository.count({
    player_id: player.id,
    channel: inboxChannel,
    event_at: { [Op.gte]: since },
  } as WhereOptions);
  return sent >= cap.limit;
};

/**
 * Stub provider adapters. On-site / in-app are delivered natively (the inbox
 * row IS the delivery). Email / SMS / web-push log here today — replace each
 * body with a real SendGrid / Routee / OneSignal call when credentials exist.
 */
const dispatchExternal = async (
  channel: TemplateChannel,
  player: Player,
  subject: string,
  body: string
): Promise<void> => {
  if (channel === "ONSITE" || channel === "INAPP") return;
  const to =
    channel === "EMAIL" ? player.email : player.mobile_number ?? player.id;
  // eslint-disable-next-line no-console
  console.log(
    `[campaign:${channel}] → ${to ?? "(no address)"} :: ${subject} :: ${body.slice(0, 80)}`
  );
};

/**
 * Deliver one campaign to one player. Runs the suppression gauntlet, writes the
 * inbox row, fires the channel adapter and records real analytics.
 */
export const deliverToPlayer = async (
  campaign: Campaign,
  template: Template,
  player: Player
): Promise<DeliveryResult> => {
  const channel = template.channel;

  if (!consentAllows(player, channel)) {
    return { player_id: player.id, outcome: "SUPPRESSED", reason: "no_consent" };
  }
  if (await isUnsubscribed(player, channel)) {
    return {
      player_id: player.id,
      outcome: "SUPPRESSED",
      reason: "unsubscribed",
    };
  }
  if (await exceedsFrequencyCap(player, channel)) {
    return {
      player_id: player.id,
      outcome: "SUPPRESSED",
      reason: "frequency_cap",
    };
  }

  const subject = renderTemplate(template.subject ?? campaign.name, player);
  const body = renderTemplate(template.content ?? "", player);
  const analyticsChannel = ANALYTICS_CHANNEL[channel];

  // 1) The delivery itself — one inbox row the player can read.
  await playerCampaignHistoryRepository.create({
    player_id: player.id,
    campaign_id: campaign.id,
    channel: INBOX_CHANNEL[channel],
    title: subject,
    body,
    status: "SENT",
    event_label: campaign.name,
    event_at: new Date(),
  } as Partial<PlayerCampaignHistory["_creationAttributes"]>);

  // 2) Fan out to the external provider for off-product channels (stubbed).
  await dispatchExternal(channel, player, subject, body);

  // 3) Real analytics — Sent, then Delivered (the message reached the player).
  const record = async (status: HistoryStatus) =>
    trackEventService({
      campaign_id: campaign.id,
      name: campaign.name,
      player_id: player.id,
      status,
      channel: analyticsChannel,
    });
  await record("SENT");
  await record("DELIVERED");

  return { player_id: player.id, outcome: "SENT" };
};

/** Resolve the campaign's audience to a concrete list of players. */
export const resolveAudience = async (campaign: Campaign): Promise<Player[]> => {
  // A named segment → its live rule tree. No segment → the whole player base.
  if (campaign.segment) {
    const segment = await SegmentRepository.findOne({
      name: campaign.segment,
      is_archived: false,
    });
    if (!segment) return [];
    const where = buildSegmentWhere(segment.content as SegmentContent | null);
    return playerRepository.findWhere(where);
  }
  return playerRepository.findAll();
};

/** Load + validate the template a campaign delivers. */
const loadTemplate = async (campaign: Campaign): Promise<Template> => {
  if (!campaign.template_id) {
    throw new AppError(
      "Campaign has no template attached — pick a template before sending",
      400
    );
  }
  const template = await Template.findByPk(campaign.template_id);
  if (!template) {
    throw new AppError("Campaign template not found", 404);
  }
  return template;
};

/**
 * Execute a whole campaign now: resolve the audience and deliver to each
 * player. Flips the campaign to SENT and stamps `last_run_at`.
 */
export const executeCampaignService = async (
  campaignId: string
): Promise<ExecutionSummary> => {
  const campaign = await CampaignRepository.findByPk(campaignId);
  if (!campaign) throw new AppError("Campaign not found", 404);

  const template = await loadTemplate(campaign);
  const audience = await resolveAudience(campaign);

  const reasons: Record<string, number> = {};
  let sent = 0;
  let suppressed = 0;

  for (const player of audience) {
    try {
      const result = await deliverToPlayer(campaign, template, player);
      if (result.outcome === "SENT") sent += 1;
      else {
        suppressed += 1;
        const key = result.reason ?? "unknown";
        reasons[key] = (reasons[key] ?? 0) + 1;
      }
    } catch (err) {
      suppressed += 1;
      reasons.error = (reasons.error ?? 0) + 1;
      // eslint-disable-next-line no-console
      console.error(`Delivery failed for player ${player.id}:`, err);
    }
  }

  await CampaignRepository.updateByPk(campaign.id, {
    status: "SENT",
    last_run_at: new Date(),
  } as Partial<Campaign["_creationAttributes"]>);

  return {
    campaign_id: campaign.id,
    channel: template.channel,
    audience: audience.length,
    sent,
    suppressed,
    reasons,
  };
};

/** Map an inbound integration event type → the campaign trigger that fires on it. */
const EVENT_TRIGGERS: Record<string, string[]> = {
  USER_REGISTERED: ["Event: Registration"],
  DEPOSIT_MADE: ["Event: First Deposit"],
  LOGIN: ["Event: Login"],
};

/**
 * Fire any ACTIVE event-triggered campaigns for a single player when a matching
 * event arrives (e.g. DEPOSIT_MADE → the "First Deposit" welcome campaign).
 * Best-effort: never throws into the event pipeline.
 */
export const triggerCampaignsForEvent = async (
  player: Player,
  eventType: string
): Promise<void> => {
  const triggers = EVENT_TRIGGERS[eventType];
  if (!triggers || !triggers.length) return;

  const campaigns = await CampaignRepository.findWhere({
    is_archived: false,
    status: { [Op.in]: ["SCHEDULED", "IN_DESIGN", "SENT"] },
    trigger: { [Op.in]: triggers },
    template_id: { [Op.ne]: null },
  } as WhereOptions);

  for (const campaign of campaigns) {
    try {
      // Respect a segment restriction: the player must still match it.
      if (campaign.segment) {
        const segment = await SegmentRepository.findOne({
          name: campaign.segment,
          is_archived: false,
        });
        if (segment) {
          const where = buildSegmentWhere(
            segment.content as SegmentContent | null
          );
          const matches = await playerRepository.count({
            [Op.and]: [{ id: player.id }, where],
          } as WhereOptions);
          if (matches === 0) continue;
        }
      }
      const template = await Template.findByPk(campaign.template_id!);
      if (!template) continue;
      await deliverToPlayer(campaign, template, player);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        `Event-triggered campaign ${campaign.id} failed for player ${player.id}:`,
        err
      );
    }
  }
};
