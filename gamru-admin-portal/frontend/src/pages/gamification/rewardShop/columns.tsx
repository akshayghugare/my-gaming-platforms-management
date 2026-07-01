import {
  STATUS_COL,
  NAME_COL,
  TAGS_COL,
  pill,
  dash,
  dataCell,
  type ColumnDef,
} from '@/components/gamification/cells';

export const rewardShopColumns: ColumnDef[] = [
  STATUS_COL,
  NAME_COL,
  { header: 'Type', render: dataCell('type') },
  {
    header: 'Stock',
    render: (r) =>
      pill(`${r.data?.stock_available ?? r.data?.stock_total ?? 0} / ${r.data?.stock_total ?? 0}`),
  },
  {
    header: 'Token Price',
    render: (r) => (r.data?.token_price ? `${r.data.token_price} Tokens` : dash(null)),
  },
  {
    header: 'Real Price',
    render: (r) =>
      r.data?.real_price ? `${r.data.real_price} ${r.data?.currency ?? 'USD'}` : dash(null),
  },
  {
    header: 'Supplier',
    render: (r) => (r.data?.supplier ? pill(String(r.data.supplier)) : dash(null)),
  },
  TAGS_COL,
  {
    header: 'Eligibility',
    render: (r) => dash(r.data?.eligibility_type ?? 'All Players'),
  },
  { header: 'Product Visibility', render: dataCell('product_visibility') },
];
