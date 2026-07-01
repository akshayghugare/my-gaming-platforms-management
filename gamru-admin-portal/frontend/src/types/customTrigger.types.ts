export type CustomTriggerStatus = 'ACTIVE' | 'INACTIVE';

export interface CustomTrigger {
  id: string;
  name: string;
  trigger?: string | null;
  status: CustomTriggerStatus;
  description?: string | null;
  tags?: string[] | null;
  builder?: Record<string, unknown> | null;
  created_by?: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomTriggerForm {
  name: string;
  trigger: string;
  status: CustomTriggerStatus;
  description: string;
  tags: string[];
  builder: string;
}

export interface CustomTriggerErrors {
  name?: string;
}

export interface CustomTriggerFilters {
  search: string;
  trigger: string;
  status: string;
  tag: string;
}

export const CUSTOM_TRIGGER_STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Status', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

export const CUSTOM_TRIGGER_EVENT_OPTIONS: string[] = [
  'Event: Registration',
  'Event: First Deposit',
  'Event: Login',
  'Event: Deposit',
  'Event: Withdrawal',
  'Event: Bet Placed',
  'Scheduled - Now',
  'Daily At 00:00 UTC',
];

export const CUSTOM_TRIGGER_TAG_OPTIONS: string[] = [
  'Welcome',
  'Retention',
  'Reactivation',
  'Promotion',
  'Transactional',
];
