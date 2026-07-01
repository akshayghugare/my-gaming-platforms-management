import type { FC } from 'react';

interface Props {
  label: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  rows?: number;
  placeholder?: string;
}

const ModalTextarea: FC<Props> = ({
  label,
  value,
  onChange,
  error,
  rows = 4,
  placeholder = '',
}) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-slate-400">{label}</label>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`
          bg-slate-900 border rounded-md px-3 py-2 text-sm text-slate-100
          placeholder:text-slate-500 resize-vertical outline-none w-full
          transition-colors duration-150
          ${
            error ? 'border-red-500 focus:border-red-400' : 'border-slate-700 focus:border-blue-500'
          }
        `}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
};

export default ModalTextarea;
