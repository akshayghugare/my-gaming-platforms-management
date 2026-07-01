import { NAME_COL, dataCell, type ColumnDef } from '@/components/gamification/cells';

export const prizesharkCatalogColumns: ColumnDef[] = [
  NAME_COL,
  { header: 'Brand', render: dataCell('brand') },
  { header: 'Categorization', render: dataCell('categorization') },
  { header: 'Cost', render: dataCell('cost') },
  { header: 'Currency', render: dataCell('currency') },
];
