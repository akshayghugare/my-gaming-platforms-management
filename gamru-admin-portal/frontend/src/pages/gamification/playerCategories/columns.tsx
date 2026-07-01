import { STATUS_COL, NAME_COL, pill, dash, type ColumnDef } from '@/components/gamification/cells';

export const playerCategoriesColumns: ColumnDef[] = [
  STATUS_COL,
  NAME_COL,
  {
    header: 'Type',
    render: (r) => <span className="text-blue-400 underline">{dash(r.data?.category_type)}</span>,
  },
  {
    header: 'Range',
    render: (r) =>
      r.data?.range_from !== undefined && r.data?.range_to !== undefined
        ? pill(
            `${r.data.range_from} ${r.data.currency ?? 'USD'} - ${
              r.data.range_to
            } ${r.data.currency ?? 'USD'}`
          )
        : dash(null),
  },
];
