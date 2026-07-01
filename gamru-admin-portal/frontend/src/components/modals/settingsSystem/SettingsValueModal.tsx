import { useEffect, useRef, useState, type FC, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';

export type SettingsInputMode = 'text' | 'number' | 'url' | 'textarea' | 'chips' | 'select';

export interface SettingsValueModalProps {
  title: string;
  description?: string;
  fieldLabel?: string;
  helperText?: string;
  mode: SettingsInputMode;
  /**
   * For chips: string[] expected. For other modes: a primitive (string|number|null).
   */
  initialValue: unknown;
  /** options for `select` mode */
  options?: { label: string; value: string }[];
  /** placeholder for the input */
  placeholder?: string;
  /** for `number` mode */
  min?: number;
  /** for `chips`: optional validator for each chip (e.g. email) */
  validateChip?: (chip: string) => string | null;
  loading: boolean;
  closeModal: () => void;
  onSave: (value: unknown) => void | Promise<void>;
}

const ChipInput: FC<{
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  validateChip?: (chip: string) => string | null;
}> = ({ value, onChange, placeholder, validateChip }) => {
  const [input, setInput] = useState('');
  const [chipError, setChipError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (validateChip) {
      const err = validateChip(v);
      if (err) {
        setChipError(err);
        return;
      }
    }
    if (!value.includes(v)) onChange([...value, v]);
    setInput('');
    setChipError(null);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', 'Tab'].includes(e.key)) {
      e.preventDefault();
      commit(input);
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div>
      <div
        className="min-h-[44px] bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 flex flex-wrap gap-2 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1.5 bg-slate-700 text-slate-200 text-xs px-3 py-1 rounded-full"
          >
            {chip}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(value.filter((c) => c !== chip));
              }}
              className="text-slate-400 hover:text-white leading-none"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (chipError) setChipError(null);
          }}
          onKeyDown={onKey}
          onBlur={() => commit(input)}
          placeholder={value.length === 0 ? (placeholder ?? 'Type and press Enter') : ''}
          className="bg-transparent text-slate-200 text-sm outline-none placeholder-slate-500 min-w-[160px] flex-1"
        />
      </div>
      {chipError && <p className="text-xs text-red-400 mt-1.5">{chipError}</p>}
    </div>
  );
};

const inputClass = (hasError: boolean) =>
  `w-full px-3 py-2.5 rounded-lg text-sm bg-slate-800 border text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 focus:ring-1 focus:ring-blue-500/60 ${
    hasError
      ? 'border-red-500/60 focus:border-red-500'
      : 'border-slate-700/60 hover:border-slate-600 focus:border-blue-500/60'
  }`;

const SettingsValueModal: FC<SettingsValueModalProps> = ({
  title,
  description,
  fieldLabel,
  helperText,
  mode,
  initialValue,
  options,
  placeholder,
  min,
  validateChip,
  loading,
  closeModal,
  onSave,
}) => {
  const [text, setText] = useState('');
  const [chips, setChips] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'chips') {
      setChips(Array.isArray(initialValue) ? (initialValue as string[]) : []);
    } else if (mode === 'number') {
      setText(initialValue == null || initialValue === '' ? '' : String(initialValue));
    } else {
      setText(initialValue == null ? '' : String(initialValue));
    }
  }, [initialValue, mode]);

  const submit = async () => {
    setError(null);
    let value: unknown = text;

    if (mode === 'chips') {
      value = chips;
    } else if (mode === 'number') {
      if (text.trim() === '') {
        value = 0;
      } else {
        const n = Number(text);
        if (Number.isNaN(n)) {
          setError('Enter a valid number');
          return;
        }
        if (min != null && n < min) {
          setError(`Value must be ≥ ${min}`);
          return;
        }
        value = n;
      }
    } else if (mode === 'url') {
      if (text.trim() !== '') {
        try {
          new URL(text);
        } catch {
          setError('Enter a valid URL (e.g. https://example.com)');
          return;
        }
      }
    } else if (mode === 'textarea') {
      // try to parse JSON if it looks like one, otherwise keep as string
      const trimmed = text.trim();
      if (
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))
      ) {
        try {
          value = JSON.parse(trimmed);
        } catch (e) {
          setError(`Invalid JSON: ${(e as Error).message}`);
          return;
        }
      }
    }

    await onSave(value);
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={closeModal}
    >
      <div
        className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl shadow-black/60 w-full max-w-lg mx-4 flex flex-col thin-scrollbar overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 shrink-0">
          <h2 className="text-base font-semibold text-slate-100 tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-all duration-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {description && <p className="text-sm text-slate-400">{description}</p>}

          <div className="space-y-1.5">
            {fieldLabel && (
              <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
                {fieldLabel}
              </label>
            )}

            {mode === 'text' && (
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                className={inputClass(Boolean(error))}
              />
            )}

            {mode === 'url' && (
              <input
                type="url"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder ?? 'https://...'}
                className={inputClass(Boolean(error))}
              />
            )}

            {mode === 'number' && (
              <input
                type="number"
                value={text}
                min={min}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                className={inputClass(Boolean(error))}
              />
            )}

            {mode === 'textarea' && (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                rows={8}
                className={`${inputClass(Boolean(error))} font-mono`}
              />
            )}

            {mode === 'chips' && (
              <ChipInput
                value={chips}
                onChange={setChips}
                placeholder={placeholder}
                validateChip={validateChip}
              />
            )}

            {mode === 'select' && (
              <select
                value={text}
                onChange={(e) => setText(e.target.value)}
                className={inputClass(Boolean(error))}
              >
                {(options ?? []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}

            {error ? (
              <p className="text-xs text-red-400 mt-1">{error}</p>
            ) : helperText ? (
              <p className="text-xs text-slate-500 mt-1">{helperText}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700/50 shrink-0">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white disabled:text-white/50 transition-all shadow-lg shadow-blue-900/30"
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsValueModal;
