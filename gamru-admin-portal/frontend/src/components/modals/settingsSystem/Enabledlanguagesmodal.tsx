import type { Dispatch, FC, SetStateAction } from 'react';
import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { EnabledLanguagesForm } from '@/types/systemSettings.types';

interface Props {
  form: EnabledLanguagesForm;
  setForm: Dispatch<SetStateAction<EnabledLanguagesForm>>;
  onSave: () => void;
  loading: boolean;
  closeModal: () => void;
}

const LANGUAGE_OPTIONS = [
  { value: 'German', label: 'German' },
  { value: 'French', label: 'French' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Turkish', label: 'Turkish' },
  { value: 'Finnish', label: 'Finnish' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'English', label: 'English' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Arabic', label: 'Arabic' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Dutch', label: 'Dutch' },
  { value: 'Polish', label: 'Polish' },
  { value: 'Swedish', label: 'Swedish' },
];

const FLAG_OPTIONS = [
  { value: 'Germany', label: 'Germany', emoji: '🇩🇪' },
  { value: 'France', label: 'France', emoji: '🇫🇷' },
  { value: 'Portugal', label: 'Portugal', emoji: '🇵🇹' },
  { value: 'Brazil', label: 'Brazil', emoji: '🇧🇷' },
  { value: 'Turkey', label: 'Turkey', emoji: '🇹🇷' },
  { value: 'Finland', label: 'Finland', emoji: '🇫🇮' },
  { value: 'Japan', label: 'Japan', emoji: '🇯🇵' },
  { value: 'South Korea', label: 'South Korea', emoji: '🇰🇷' },
  { value: 'UK', label: 'UK', emoji: '🇬🇧' },
  { value: 'USA', label: 'USA', emoji: '🇺🇸' },
  { value: 'China', label: 'China', emoji: '🇨🇳' },
  { value: 'Spain', label: 'Spain', emoji: '🇪🇸' },
  { value: 'Italy', label: 'Italy', emoji: '🇮🇹' },
  { value: 'Russia', label: 'Russia', emoji: '🇷🇺' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia', emoji: '🇸🇦' },
  { value: 'India', label: 'India', emoji: '🇮🇳' },
  { value: 'Netherlands', label: 'Netherlands', emoji: '🇳🇱' },
  { value: 'Poland', label: 'Poland', emoji: '🇵🇱' },
  { value: 'Sweden', label: 'Sweden', emoji: '🇸🇪' },
];

const getEmojiForFlag = (flag: string) => FLAG_OPTIONS.find((f) => f.value === flag)?.emoji ?? '🏳️';

const EnabledLanguagesModal: FC<Props> = ({ form, setForm, onSave, loading, closeModal }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  const updateLanguage = (index: number, field: 'language' | 'flag', value: string) => {
    setForm((prev) => {
      const next = [...prev.languages];
      const emoji =
        field === 'flag'
          ? (FLAG_OPTIONS.find((f) => f.value === value)?.emoji ?? next[index].flagEmoji)
          : next[index].flagEmoji;
      next[index] = { ...next[index], [field]: value, flagEmoji: emoji };
      return { ...prev, languages: next };
    });
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    backgroundColor: '#1e293b',
    border: '1px solid rgba(100,116,139,0.4)',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '13px',
    outline: 'none',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    paddingRight: '32px',
    cursor: 'pointer',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#64748b',
    marginBottom: '4px',
    display: 'block',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-xs flex justify-center items-center z-50"
      onClick={closeModal}
    >
      <div
        className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl shadow-black/60 w-full max-w-lg mx-4 flex flex-col max-h-[90vh] thin-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 shrink-0">
          <h2 className="text-base font-semibold text-slate-100 tracking-tight">
            Enabled Languages
          </h2>
          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-all duration-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {form.languages.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">No languages configured.</p>
          )}

          {form.languages.map((item, index) => {
            const isOpen = expandedIndex === index;
            return (
              <div key={item.id} className="border border-slate-700/40 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleExpand(index)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800/80 transition-colors duration-150"
                >
                  <span className="text-base leading-none">{getEmojiForFlag(item.flag)}</span>
                  <span className="flex-1 text-left text-sm font-medium text-slate-200">
                    {item.language || 'Select a language'}
                  </span>
                  {isOpen ? (
                    <ChevronUp size={15} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={15} className="text-slate-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 py-4 bg-slate-800/20 border-t border-slate-700/30 grid grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>Language</label>
                      <select
                        style={selectStyle}
                        value={item.language}
                        onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                      >
                        <option value="">Select language</option>
                        {LANGUAGE_OPTIONS.map((l) => (
                          <option key={l.value} value={l.value}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={labelStyle}>Flag</label>
                      <select
                        style={selectStyle}
                        value={item.flag}
                        onChange={(e) => updateLanguage(index, 'flag', e.target.value)}
                      >
                        <option value="">Select flag</option>
                        {FLAG_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.emoji} {f.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700/50 shrink-0">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={loading}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white disabled:text-white/50 transition-all duration-200 shadow-lg shadow-blue-900/30"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnabledLanguagesModal;
