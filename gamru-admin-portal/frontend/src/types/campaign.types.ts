export type CampaignStatus = 'IN_DESIGN' | 'SENT' | 'SCHEDULED' | 'PAUSED' | 'ARCHIVED';

export interface Campaign {
  id: string;
  name: string;
  type: string;
  status: CampaignStatus;
  description?: string | null;
  tags?: string[] | null;
  trigger?: string | null;
  trigger_config?: Record<string, unknown> | null;
  segment?: string | null;
  target_group?: Record<string, unknown> | null;
  channel?: string | null;
  template_id?: string | null;
  schedule_at?: string | null;
  last_run_at?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_by?: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CampaignForm {
  name: string;
  type: string;
  tags: string[];
  description: string;
  trigger: string;
  channel: string;
  template_id: string;
  segment: string;
  start_date: string;
  end_date: string;
  target_group: string;
}

export interface CampaignErrors {
  name?: string;
  trigger?: string;
  start_date?: string;
}

export interface CampaignFilters {
  search: string;
  status: string;
  trigger: string;
  tag: string;
}

export const CAMPAIGN_STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Status', value: '' },
  { label: 'In Design', value: 'IN_DESIGN' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Paused', value: 'PAUSED' },
];

export const CAMPAIGN_TRIGGER_OPTIONS: { label: string; value: string }[] = [
  { label: 'Scheduled - Now', value: 'Scheduled - Now' },
  { label: 'Daily At 00:00 UTC', value: 'Daily At 00:00 UTC' },
  { label: 'Event: Registration', value: 'Event: Registration' },
  { label: 'Event: First Deposit', value: 'Event: First Deposit' },
  { label: 'Event: Login', value: 'Event: Login' },
];

/**
 * Dummy Target Group notes keyed by the campaign trigger. Pre-fills the
 * "Target Group" step with a sensible audience description for that event so
 * the operator has a starting point to edit instead of a blank box.
 */
export const CAMPAIGN_TARGET_GROUP_PRESETS: Record<string, string> = {
  'Scheduled - Now': 'All players in the selected segment at the moment the campaign is sent.',
  'Daily At 00:00 UTC':
    'Players matching the selected segment, re-evaluated every day at 00:00 UTC.',
  'Event: Registration':
    'Newly registered players who just created an account and have not deposited yet — onboarding / welcome audience.',
  'Event: First Deposit':
    'Players who have just made their first deposit — ideal for a welcome bonus and next-step guidance.',
  'Event: Login':
    'Returning players on login — re-engage active users with their latest missions, rewards and rank progress.',
};

export const CAMPAIGN_CHANNEL_OPTIONS: { label: string; value: string }[] = [
  { label: 'On-site (inbox)', value: 'ONSITE' },
  { label: 'In-app push', value: 'INAPP' },
  { label: 'Email', value: 'EMAIL' },
  { label: 'SMS', value: 'SMS' },
  { label: 'Web push', value: 'WEBPUSH' },
];

export const CAMPAIGN_TAG_OPTIONS: string[] = [
  'Welcome',
  'Retention',
  'Reactivation',
  'Promotion',
  'No Deposit',
];

export const CAMPAIGN_SEGMENT_OPTIONS: string[] = [
  'Level -1',
  'Join No Deposit Last 24 Hours',
  'reg no depo',
  'Registration',
];
