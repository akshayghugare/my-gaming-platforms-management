export type FrequencyCapChannel = 'EMAIL' | 'SMS' | 'ONSITE' | 'WEBPUSH' | 'INAPP';
export type FrequencyCapPeriod = 'PER_DAY' | 'PER_WEEK' | 'PER_MONTH';

export interface FrequencyCap {
  id: string;
  channel: FrequencyCapChannel;
  period: FrequencyCapPeriod;
  limit: number;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FrequencyCapForm {
  channel: FrequencyCapChannel | '';
  period: FrequencyCapPeriod | '';
  limit: string;
}

export interface FrequencyCapErrors {
  channel?: string;
  period?: string;
  limit?: string;
}

export const FREQUENCY_CAP_CHANNEL_OPTIONS: { label: string; value: FrequencyCapChannel }[] = [
  { label: 'Email', value: 'EMAIL' },
  { label: 'SMS', value: 'SMS' },
  { label: 'On Site Notification', value: 'ONSITE' },
  { label: 'Web Push Notification', value: 'WEBPUSH' },
  { label: 'In App Push Notification', value: 'INAPP' },
];

export const FREQUENCY_CAP_PERIOD_OPTIONS: { label: string; value: FrequencyCapPeriod }[] = [
  { label: 'Per Day', value: 'PER_DAY' },
  { label: 'Per Week', value: 'PER_WEEK' },
  { label: 'Per Month', value: 'PER_MONTH' },
];

export const channelLabel = (value: string): string =>
  FREQUENCY_CAP_CHANNEL_OPTIONS.find((o) => o.value === value)?.label ?? value;

export const periodLabel = (value: string): string =>
  FREQUENCY_CAP_PERIOD_OPTIONS.find((o) => o.value === value)?.label ?? value;
