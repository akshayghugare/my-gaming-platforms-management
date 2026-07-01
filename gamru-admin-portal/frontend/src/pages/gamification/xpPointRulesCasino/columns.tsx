import { STATUS_COL, TAGS_COL, dataCell, type ColumnDef } from '@/components/gamification/cells';

export const xpPointRulesCasinoColumns: ColumnDef[] = [
  STATUS_COL,
  { header: 'Name', render: (r) => r.name },
  { header: 'Ranks', render: dataCell('ranks') },
  { header: 'Contribution Type', render: dataCell('contribution_type') },
  { header: 'Contribution %', render: dataCell('contribution_percentage') },
  TAGS_COL,
];
