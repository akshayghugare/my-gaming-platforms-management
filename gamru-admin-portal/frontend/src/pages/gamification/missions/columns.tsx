import {
  STATUS_COL,
  NAME_COL,
  TAGS_COL,
  BadgeCol,
  type ColumnDef,
} from '@/components/gamification/cells';

export const missionsColumns: ColumnDef[] = [
  STATUS_COL,
  NAME_COL,
  TAGS_COL,
  BadgeCol('Rewards', 'reward_type'),
  BadgeCol('Objectives', 'objective_type'),
];
