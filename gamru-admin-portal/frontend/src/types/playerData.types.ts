export type PlayerDataType = 'STRING' | 'BOOLEAN' | 'NUMBER' | 'DATE';

export interface PlayerData {
  id: string;
  name: string;
  description?: string | null;
  data_type: PlayerDataType;
  data_option?: string | null;
  is_custom: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlayerDataForm {
  name: string;
  description: string;
  data_type: PlayerDataType | '';
}

export interface PlayerDataErrors {
  name?: string;
  data_type?: string;
}

export const PLAYER_DATA_TYPE_OPTIONS: { label: string; value: PlayerDataType }[] = [
  { label: 'String', value: 'STRING' },
  { label: 'Boolean', value: 'BOOLEAN' },
  { label: 'Number', value: 'NUMBER' },
  { label: 'Date', value: 'DATE' },
];

export const dataTypeBadgeClass = (type: string): string => {
  const map: Record<string, string> = {
    STRING: 'bg-slate-600/40 text-slate-200 border border-slate-500/40',
    BOOLEAN: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    NUMBER: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
    DATE: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  };
  return map[type] ?? map.STRING;
};

export const dataTypeLabel = (type: string): string =>
  PLAYER_DATA_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
