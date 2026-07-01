import { useState, type FC } from 'react';
import { toast } from 'react-toastify';
import { Check } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { THEME_OPTIONS, type ThemeName } from '@/types/profile';
import ProfileModalShell from './ProfileModalShell';

interface Props {
  currentTheme: ThemeName;
  onClose: () => void;
  onSaved: (theme: ThemeName) => void;
}

const ThemeModal: FC<Props> = ({ currentTheme, onClose, onSaved }) => {
  const { saveTheme } = useTheme();
  const [selected, setSelected] = useState<ThemeName>(currentTheme);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    if (selected === currentTheme) {
      onClose();
      return;
    }
    setLoading(true);
    const ok = await saveTheme(selected);
    setLoading(false);
    if (ok) {
      toast.success('Theme updated successfully');
      onSaved(selected);
      onClose();
    } else {
      toast.error('Failed to update theme');
    }
  };

  return (
    <ProfileModalShell
      title="Appearance Theme"
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      submitLabel="Apply Theme"
    >
      <div className="grid grid-cols-2 gap-3">
        {THEME_OPTIONS.map((opt) => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                active
                  ? 'border-blue-500 bg-blue-600/15'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-500'
              }`}
            >
              <span
                className="w-6 h-6 rounded-full border border-slate-600 flex-shrink-0"
                style={{ background: opt.swatch }}
              />
              <span className="text-sm text-slate-200 flex-1 text-left">{opt.label}</span>
              {active && <Check size={16} className="text-blue-400" />}
            </button>
          );
        })}
      </div>
    </ProfileModalShell>
  );
};

export default ThemeModal;
