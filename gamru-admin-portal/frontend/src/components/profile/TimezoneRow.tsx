import { ChevronDown } from 'lucide-react';

interface Props {
  description: string;
  value: string;
  onClick?: () => void;
}

const TimezoneRow = ({ description, value, onClick }: Props) => (
  <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-5 py-4 hover:border-slate-500 transition-colors">
    <div>
      <p className="text-xs font-semibold text-slate-400 mb-0.5">Time Zone</p>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
    <div className="ml-4 flex-shrink-0">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 text-xs px-3 py-2 rounded-md transition-colors"
      >
        <span className="max-w-[160px] truncate">{value}</span>
        <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
      </button>
    </div>
  </div>
);

export default TimezoneRow;
