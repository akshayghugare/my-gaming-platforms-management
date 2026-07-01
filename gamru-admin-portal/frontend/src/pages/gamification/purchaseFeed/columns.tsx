import {
  STATUS_COL,
  NAME_COL,
  TAGS_COL,
  dash,
  type ColumnDef,
} from '@/components/gamification/cells';

export const purchaseFeedColumns: ColumnDef[] = [
  STATUS_COL,
  NAME_COL,
  { header: 'Description', render: (r) => dash(r.description) },
  TAGS_COL,
];
