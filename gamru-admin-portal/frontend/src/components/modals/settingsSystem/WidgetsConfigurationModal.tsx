import { useState, type FC } from 'react';
import { X, ChevronDown, Eye, EyeOff } from 'lucide-react';

export interface WidgetsConfiguration {
  missions_banner_desktop: string;
  missions_banner_mobile: string;
  tournaments_banner_desktop: string;
  tournaments_banner_mobile: string;
  tournaments_tag_color_casino: string;
  tournaments_tag_color_sport: string;
}

export const WIDGETS_CONFIG_DEFAULTS: WidgetsConfiguration = {
  missions_banner_desktop: '',
  missions_banner_mobile: '',
  tournaments_banner_desktop: '',
  tournaments_banner_mobile: '',
  tournaments_tag_color_casino: '#9013fe',
  tournaments_tag_color_sport: '#417505',
};

interface Props {
  value: WidgetsConfiguration;
  onSave: (value: WidgetsConfiguration) => void;
  loading: boolean;
  closeModal: () => void;
}

const Accordion: FC<{
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, open, onToggle, children }) => (
  <div className="rounded-lg border border-slate-700/60 overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/60 hover:bg-slate-800 transition-colors"
    >
      <span className="text-sm font-semibold text-slate-100">{title}</span>
      <ChevronDown
        size={18}
        className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      />
    </button>
    {open && <div className="px-4 py-4 space-y-4 bg-slate-900/40">{children}</div>}
  </div>
);

const BannerField: FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => {
  const [preview, setPreview] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-300">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="flex-1 px-3 py-2.5 rounded-lg text-sm bg-slate-800 border border-slate-700/60 text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 hover:border-slate-600 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60"
        />
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          disabled={!value}
          title={preview ? 'Hide preview' : 'Show preview'}
          className="p-2.5 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 disabled:opacity-40 transition-all duration-200"
        >
          {preview ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {preview && value && (
        <img
          src={value}
          alt={label}
          className="mt-2 max-h-32 w-full object-contain rounded-lg border border-slate-700/60 bg-slate-950"
        />
      )}
    </div>
  );
};

const ColorField: FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-medium text-slate-300">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        className="flex-1 px-3 py-2.5 rounded-lg text-sm bg-slate-800 border border-slate-700/60 text-slate-100 placeholder-slate-500 outline-none transition-all duration-200 hover:border-slate-600 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60"
      />
      <label
        className="h-10 w-10 rounded-lg border border-slate-700/60 overflow-hidden cursor-pointer shrink-0"
        style={{ background: value }}
      >
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="opacity-0 h-full w-full cursor-pointer"
        />
      </label>
    </div>
  </div>
);

const WidgetsConfigurationModal: FC<Props> = ({ value, onSave, loading, closeModal }) => {
  const [form, setForm] = useState<WidgetsConfiguration>(value);
  const [openSection, setOpenSection] = useState<'missions' | 'tournaments' | null>('missions');

  const set = <K extends keyof WidgetsConfiguration>(key: K, v: WidgetsConfiguration[K]) =>
    setForm((prev) => ({ ...prev, [key]: v }));

  const toggle = (section: 'missions' | 'tournaments') =>
    setOpenSection((prev) => (prev === section ? null : section));

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-xs flex justify-center items-center z-50"
      onClick={closeModal}
    >
      <div
        className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl shadow-black/60 w-full max-w-lg mx-4 max-h-[90vh] flex flex-col thin-scrollbar overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 shrink-0">
          <h2 className="text-base font-semibold text-slate-100 tracking-tight">
            Widgets Configuration
          </h2>
          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-all duration-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3 overflow-y-auto">
          <Accordion
            title="Missions"
            open={openSection === 'missions'}
            onToggle={() => toggle('missions')}
          >
            <BannerField
              label="Missions Page Banner Desktop"
              value={form.missions_banner_desktop}
              onChange={(v) => set('missions_banner_desktop', v)}
            />
            <BannerField
              label="Missions Page Banner Mobile"
              value={form.missions_banner_mobile}
              onChange={(v) => set('missions_banner_mobile', v)}
            />
          </Accordion>

          <Accordion
            title="Tournaments"
            open={openSection === 'tournaments'}
            onToggle={() => toggle('tournaments')}
          >
            <BannerField
              label="Tournaments Page Banner Desktop"
              value={form.tournaments_banner_desktop}
              onChange={(v) => set('tournaments_banner_desktop', v)}
            />
            <BannerField
              label="Tournaments Page Banner Mobile"
              value={form.tournaments_banner_mobile}
              onChange={(v) => set('tournaments_banner_mobile', v)}
            />
            <ColorField
              label="Tag color for casino"
              value={form.tournaments_tag_color_casino}
              onChange={(v) => set('tournaments_tag_color_casino', v)}
            />
            <ColorField
              label="Tag color for sport"
              value={form.tournaments_tag_color_sport}
              onChange={(v) => set('tournaments_tag_color_sport', v)}
            />
          </Accordion>
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
            onClick={() => onSave(form)}
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

export default WidgetsConfigurationModal;
