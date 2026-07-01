import { CAMPAIGN_TAG_OPTIONS } from './campaign.types';
import { SEGMENT_TAG_OPTIONS } from './segment.types';
import { TEMPLATE_TAG_OPTIONS } from './template.types';
import { CUSTOM_TRIGGER_TAG_OPTIONS } from './customTrigger.types';

export type TagsCrmsNavItemId =
  | 'all-crm-tags'
  | 'campaign-crm-tags'
  | 'segment-crm-tags'
  | 'template-crm-tags'
  | 'custom-trigger-crm-tags'
  | 'frequency-cap-crm-tags'
  | 'unsubscribe-report-crm-tags'
  | 'player-data-crm-tags';

export interface TagsCrmsNavItem {
  id: TagsCrmsNavItemId;
  label: string;
  icon: React.ReactNode;
}

export type CrmTagCategory =
  | 'campaign'
  | 'segment'
  | 'template'
  | 'custom-trigger'
  | 'frequency-cap'
  | 'unsubscribe-report'
  | 'player-data';

/** Shape returned by the backend (snake_case columns). */
export interface CrmTag {
  id: string;
  name: string;
  description?: string | null;
  category: CrmTagCategory;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmTagForm {
  id?: string;
  name: string;
  description?: string;
  category: CrmTagCategory | '';
}

export interface CrmTagErrors {
  name?: string;
  category?: string;
  description?: string;
}

export const CRM_CATEGORY_OPTIONS: {
  label: string;
  value: CrmTagCategory;
}[] = [
  { label: 'Campaign', value: 'campaign' },
  { label: 'Segment', value: 'segment' },
  { label: 'Template', value: 'template' },
  { label: 'Custom Trigger', value: 'custom-trigger' },
  { label: 'Frequency Cap', value: 'frequency-cap' },
  { label: 'Unsubscribe Report', value: 'unsubscribe-report' },
  { label: 'Player Data', value: 'player-data' },
];

/** Predefined tag names offered when creating a CRM tag, keyed by category. */
export const CRM_TAG_NAME_OPTIONS: Record<CrmTagCategory, string[]> = {
  campaign: CAMPAIGN_TAG_OPTIONS,
  segment: SEGMENT_TAG_OPTIONS,
  template: TEMPLATE_TAG_OPTIONS,
  'custom-trigger': CUSTOM_TRIGGER_TAG_OPTIONS,
  'frequency-cap': [],
  'unsubscribe-report': [],
  'player-data': [],
};
