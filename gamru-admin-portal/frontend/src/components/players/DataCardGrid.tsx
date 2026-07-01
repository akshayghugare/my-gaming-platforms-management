import type { FC } from 'react';
import { Calendar, Hash, Quote, ToggleLeft, ToggleRight } from 'lucide-react';

const isDateKey = (k: string) => /date|birthday/i.test(k);

const formatValue = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return 'Undefined';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return String(v);
  return String(v);
};

const ValueIcon: FC<{ keyName: string; value: unknown }> = ({ keyName, value }) => {
  if (typeof value === 'boolean')
    return value ? (
      <ToggleRight size={16} className="text-green-400" />
    ) : (
      <ToggleLeft size={16} className="text-slate-400" />
    );
  if (typeof value === 'number') return <Hash size={16} className="text-fuchsia-400" />;
  if (isDateKey(keyName)) return <Calendar size={16} className="text-amber-400" />;
  return <Quote size={16} className="text-slate-400" />;
};

const DataCardGrid: FC<{ data?: Record<string, unknown> | null }> = ({ data }) => {
  const entries = Object.entries(data ?? {});
  if (entries.length === 0) {
    return <div className="text-center text-slate-400 py-8 text-sm">No data available</div>;
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {entries.map(([k, v]) => {
        const undefinedVal = v === null || v === undefined || v === '';
        return (
          <div
            key={k}
            className="bg-slate-800/60 border border-slate-700 rounded-md p-3 flex items-start gap-2"
          >
            <span className="mt-0.5">
              <ValueIcon keyName={k} value={v} />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-400 truncate" title={k}>
                {k}
              </div>
              <div
                className={`text-sm font-medium break-words ${
                  undefinedVal ? 'italic text-slate-500' : 'text-white'
                }`}
              >
                {formatValue(v)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DataCardGrid;
