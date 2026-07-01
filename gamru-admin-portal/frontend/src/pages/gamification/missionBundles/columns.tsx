import {
  STATUS_COL,
  NAME_COL,
  TAGS_COL,
  dataCell,
  dash,
  type ColumnDef,
} from '@/components/gamification/cells';
import { toMissionRefs } from '@/components/gamification/fields';

export const missionBundlesColumns: ColumnDef[] = [
  STATUS_COL,
  NAME_COL,
  { header: 'Type', render: dataCell('bundle_type') },
  { header: 'Priority', render: (r) => r.priority },
  {
    header: 'Missions',
    render: (r) => {
      const names = toMissionRefs(r.data?.missions)
        .map((m) => m.name)
        .filter(Boolean);
      return names.length ? names.join(', ') : dash(null);
    },
  },
  { header: 'Eligibility', render: dataCell('eligibility_type') },
  TAGS_COL,
];
