export interface ChannelMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  sms_parts: number;
}

export interface CampaignAnalyticsRow {
  id: string;
  name: string;
  type: string;
  status: string;
  tags?: string[] | null;
  created_at: string;
  email: ChannelMetrics;
  sms: ChannelMetrics;
  web_push: ChannelMetrics;
  onsite: ChannelMetrics;
}

export type HistoryStatus =
  | 'SENT'
  | 'DELIVERED'
  | 'OPEN'
  | 'CLICK'
  | 'LOGIN'
  | 'BOUNCED'
  | 'FAILED';

export type HistoryChannel = 'EMAIL' | 'SMS' | 'WEB_PUSH' | 'ONSITE';

export interface CampaignHistoryRow {
  id: string;
  campaign_id: string | null;
  name: string;
  player_id: string;
  status: HistoryStatus;
  channel: HistoryChannel;
  event_date: string;
  created_at: string;
}

export const ANALYTICS_PERIOD_OPTIONS: { label: string; value: string }[] = [
  { label: 'Lifetime', value: 'lifetime' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
];

export const ANALYTICS_STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Status', value: '' },
  { label: 'In Design', value: 'IN_DESIGN' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Paused', value: 'PAUSED' },
];

export const HISTORY_STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Status', value: '' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Click', value: 'CLICK' },
  { label: 'Login', value: 'LOGIN' },
  { label: 'Bounced', value: 'BOUNCED' },
  { label: 'Failed', value: 'FAILED' },
];

export const CHANNEL_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Channels', value: '' },
  { label: 'Email', value: 'EMAIL' },
  { label: 'SMS', value: 'SMS' },
  { label: 'Web Push Notification', value: 'WEB_PUSH' },
  { label: 'On-site Notification', value: 'ONSITE' },
];

export const CHANNEL_LABEL: Record<HistoryChannel, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  WEB_PUSH: 'Web Push Notification',
  ONSITE: 'On-site Notification',
};
