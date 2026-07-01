import { useEffect, useRef, useState, type FC } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

interface Props {
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

const MultiSelectDropdown: FC<Props> = ({
  options,
  selected,
  onChange,
  placeholder = 'Select…',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (tag: string) =>
    onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full min-h-[40px] px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-left flex flex-wrap items-center gap-1.5 focus:outline-none focus:border-blue-500"
      >
        {selected.length === 0 ? (
          <span className="text-slate-500">{placeholder}</span>
        ) : (
          selected.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600/30 text-blue-200 text-xs"
            >
              {t}
              <X
                size={12}
                className="cursor-pointer hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(t);
                }}
              />
            </span>
          ))
        )}
        <ChevronDown
          size={14}
          className={`ml-auto text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto bg-slate-800 border border-slate-700 rounded shadow-lg">
          {options.map((t) => {
            const checked = selected.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggle(t)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
              >
                <span>{t}</span>
                {checked && <Check size={14} className="text-blue-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
