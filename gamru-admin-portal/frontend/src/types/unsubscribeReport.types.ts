export type UnsubscribeChannel = 'EMAIL' | 'SMS' | 'ONSITE' | 'WEBPUSH' | 'INAPP';

export interface UnsubscribeReport {
  id: string;
  player_id: string;
  campaign_name?: string | null;
  channel: UnsubscribeChannel;
  reason?: string | null;
  unsubscribed_at: string;
  created_at: string;
  updated_at: string;
}

export const UNSUBSCRIBE_CHANNEL_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Channels', value: '' },
  { label: 'Email', value: 'EMAIL' },
  { label: 'SMS', value: 'SMS' },
  { label: 'On Site Notification', value: 'ONSITE' },
  { label: 'Web Push Notification', value: 'WEBPUSH' },
  { label: 'In App Push Notification', value: 'INAPP' },
];

export const UNSUBSCRIBE_DATE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Lifetime', value: '' },
  { label: 'Today', value: '1' },
  { label: 'Last 7 Days', value: '7' },
  { label: 'Last 30 Days', value: '30' },
  { label: 'Last 90 Days', value: '90' },
];

export const channelLabel = (value: string): string =>
  UNSUBSCRIBE_CHANNEL_OPTIONS.find((o) => o.value === value)?.label ?? value;
