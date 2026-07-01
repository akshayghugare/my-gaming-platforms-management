import type { FC } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  label: string;
  value: string;
}

interface Props {
  label: string;
  value: string;
  options: Option[];
  onChange: (val: string) => void;
  error?: string;
}

const ModalSelect: FC<Props> = ({ label, value, options, onChange, error }) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-300 tracking-wide">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="
            w-full appearance-none
            bg-slate-800/80 border border-slate-600/50 rounded-md px-3 py-2 pr-9
            text-sm text-slate-100
            focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/30
            transition-all duration-200 cursor-pointer
          "
        >
          <option value="" disabled hidden />
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      </div>
      {error && <span className="text-xs text-red-400 mt-0.5">{error}</span>}
    </div>
  );
};

export default ModalSelect;
