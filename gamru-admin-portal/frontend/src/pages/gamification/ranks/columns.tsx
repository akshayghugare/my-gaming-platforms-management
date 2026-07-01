import {
  STATUS_COL,
  NAME_COL,
  TAGS_COL,
  BadgeCol,
  dash,
  type ColumnDef,
} from '@/components/gamification/cells';

export const ranksColumns: ColumnDef[] = [
  STATUS_COL,
  NAME_COL,
  {
    header: 'Levels',
    render: (r) => {
      const lvls = (r.data?.levels as { xp_start?: number; xp_end?: number }[] | undefined) ?? [];
      if (lvls.length) {
        const start = lvls[0]?.xp_start ?? 0;
        const end = lvls[lvls.length - 1]?.xp_end ?? 0;
        return `${lvls.length} levels (${start} – ${end} XP)`;
      }
      return r.data?.level_from && r.data?.level_to
        ? `${r.data.level_from} - ${r.data.level_to}`
        : dash(null);
    },
  },
  BadgeCol('Rewards', 'reward_type'),
  TAGS_COL,
];
