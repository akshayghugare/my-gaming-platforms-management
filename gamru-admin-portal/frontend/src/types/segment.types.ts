export type SegmentType = 'DYNAMIC' | 'STATIC';

export interface Segment {
  id: string;
  name: string;
  type: SegmentType;
  description?: string | null;
  tags?: string[] | null;
  content?: Record<string, unknown> | null;
  player_count: number;
  last_counted_at?: string | null;
  created_by?: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type SegmentRefreshMode = 'Scheduled' | 'Manual';

export interface SegmentForm {
  name: string;
  type: SegmentType;
  tags: string[];
  description: string;
  refreshMode: SegmentRefreshMode;
  refreshMinutes: number;
  tree: RuleGroup;
}

// ─── Rule tree ─────────────────────────────────────────────────────
export type RuleMatch = 'AND' | 'OR';

export interface RuleCondition {
  id: string;
  type: 'condition';
  field: string;
  op: string;
  value: string;
  not: boolean;
}

export interface RuleGroup {
  id: string;
  type: 'group';
  match: RuleMatch;
  rules: RuleNode[];
}

export type RuleNode = RuleCondition | RuleGroup;

// ─── Field catalog (mirrors backend SEGMENT_FIELDS) ────────────────
export type SegmentFieldKind =
  | 'string'
  | 'number'
  | 'date'
  | 'boolean'
  | 'enum'
  | 'tags'
  | 'jsonBool';

export interface SegmentFieldDef {
  key: string;
  label: string;
  group: string;
  kind: SegmentFieldKind;
  options?: string[];
}

export const SEGMENT_FIELD_CATALOG: SegmentFieldDef[] = [
  { key: 'country', label: 'Country', group: 'Profile', kind: 'string' },
  { key: 'city', label: 'City', group: 'Profile', kind: 'string' },
  { key: 'language', label: 'Language', group: 'Profile', kind: 'string' },
  { key: 'registration_date', label: 'Registered at', group: 'Profile', kind: 'date' },

  {
    key: 'status',
    label: 'Player status',
    group: 'Status',
    kind: 'enum',
    options: ['ACTIVE', 'INACTIVE', 'BLOCKED', 'N/A'],
  },
  { key: 'account_status', label: 'Account status', group: 'Status', kind: 'string' },
  { key: 'gamification_active', label: 'Gamification active', group: 'Status', kind: 'boolean' },

  { key: 'level', label: 'Level', group: 'Gamification', kind: 'number' },
  { key: 'xp_points', label: 'XP points', group: 'Gamification', kind: 'number' },
  { key: 'rank_name', label: 'Rank', group: 'Gamification', kind: 'string' },
  { key: 'tokens', label: 'Tokens', group: 'Gamification', kind: 'number' },

  { key: 'email', label: 'Email', group: 'Contact', kind: 'string' },
  { key: 'mobile_number', label: 'Mobile', group: 'Contact', kind: 'string' },

  { key: 'tags', label: 'Tag', group: 'CRM', kind: 'tags' },
  { key: 'consent_email', label: 'Email marketing consent', group: 'CRM', kind: 'jsonBool' },
  { key: 'consent_sms', label: 'SMS marketing consent', group: 'CRM', kind: 'jsonBool' },
  { key: 'consent_push', label: 'Push marketing consent', group: 'CRM', kind: 'jsonBool' },
];

export const OPERATORS_BY_KIND: Record<SegmentFieldKind, string[]> = {
  string: ['equals', 'not_equals', 'contains', 'starts_with', 'is_set', 'is_not_set'],
  number: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'],
  date: ['before', 'after', 'in_last_days'],
  boolean: ['is_true', 'is_false'],
  enum: ['equals', 'not_equals'],
  tags: ['includes', 'not_includes'],
  jsonBool: ['is_true', 'is_false'],
};

export const OPERATOR_LABELS: Record<string, string> = {
  equals: 'equals',
  not_equals: 'not equals',
  contains: 'contains',
  starts_with: 'starts with',
  is_set: 'is set',
  is_not_set: 'is not set',
  eq: '=',
  ne: '≠',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  before: 'before',
  after: 'after',
  in_last_days: 'in last (days)',
  is_true: 'is true',
  is_false: 'is false',
  includes: 'includes',
  not_includes: 'does not include',
};

/** Operators that need no value input. */
export const VALUELESS_OPS = new Set(['is_set', 'is_not_set', 'is_true', 'is_false']);

/** Known segmentation tags suggested in the value box for `Tag` rules. */
export const KNOWN_PLAYER_TAGS = [
  'new_player',
  'vip',
  'high_value',
  'reactivation',
  'depositor',
  'no_deposit',
  'retention',
];

export interface SegmentErrors {
  name?: string;
  type?: string;
}

export interface SegmentFilters {
  search: string;
  type: string;
  created_by: string;
  tag: string;
}

export const SEGMENT_TYPE_OPTIONS: { label: string; value: SegmentType }[] = [
  { label: 'Dynamic', value: 'DYNAMIC' },
  { label: 'Static', value: 'STATIC' },
];

export const SEGMENT_TYPE_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Types', value: '' },
  { label: 'Dynamic', value: 'DYNAMIC' },
  { label: 'Static', value: 'STATIC' },
];

export const SEGMENT_TAG_OPTIONS: string[] = [
  'High Value',
  'Retention',
  'Reactivation',
  'No Deposit',
  'Depositor',
  'VIP',
  'New Player',
];
