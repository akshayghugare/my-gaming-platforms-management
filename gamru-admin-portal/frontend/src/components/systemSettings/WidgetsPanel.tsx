import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { settingsApi } from '@/services/systemSettings.service';
import { THEME_OPTIONS, type ThemeName } from '@/types/profile';
import { useAppSettings } from '@/context/SettingsContext';
import WidgetsConfigurationModal, {
  WIDGETS_CONFIG_DEFAULTS,
  type WidgetsConfiguration,
} from '@/components/modals/settingsSystem/WidgetsConfigurationModal';

const DASHBOARD_WIDGETS: { key: string; label: string; description: string }[] = [
  {
    key: 'kpi_overview',
    label: 'KPI Overview',
    description: 'Top-line cards: players, revenue, retention.',
  },
  {
    key: 'active_players',
    label: 'Active Players',
    description: 'Active player count over time.',
  },
  {
    key: 'campaign_performance',
    label: 'Campaign Performance',
    description: 'Delivery & engagement rates per campaign.',
  },
  {
    key: 'reward_shop',
    label: 'Reward Shop',
    description: 'Recent reward shop activity.',
  },
  {
    key: 'tournaments',
    label: 'Tournaments',
    description: 'Active / upcoming tournament summary.',
  },
];

const SIDEBAR_MODULES: { key: string; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'players', label: 'Players' },
  { key: 'crm', label: 'CRM' },
  { key: 'gamification', label: 'Gamification' },
  { key: 'settings', label: 'Settings' },
];

interface WidgetsValues {
  enabled_widgets: string[];
  enabled_sidebar_modules: string[];
  theme: ThemeName;
  configuration: WidgetsConfiguration;
}

const DEFAULTS: WidgetsValues = {
  enabled_widgets: DASHBOARD_WIDGETS.map((w) => w.key),
  enabled_sidebar_modules: SIDEBAR_MODULES.map((m) => m.key),
  theme: 'dark',
  configuration: WIDGETS_CONFIG_DEFAULTS,
};

const Toggle = ({
  enabled,
  onChange,
  disabled = false,
  title,
}: {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
  title?: string;
}) => (
  <button
    type="button"
    onClick={disabled ? undefined : onChange}
    title={title}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      enabled ? 'bg-blue-500' : 'bg-slate-600'
    } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="mb-8">
    <h2 className="text-base font-semibold text-slate-100 mb-1">{title}</h2>
    {description && <p className="text-xs text-slate-400 mb-3">{description}</p>}
    <div className="rounded-lg overflow-hidden border border-slate-700 divide-y divide-slate-700">
      {children}
    </div>
  </div>
);

const WidgetsPanel = () => {
  const [values, setValues] = useState<WidgetsValues>(DEFAULTS);
  const [configOpen, setConfigOpen] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const { setEnabledSidebarModules, setEnabledWidgets } = useAppSettings();

  useEffect(() => {
    (async () => {
      try {
        const res = await settingsApi.getByPanel('widgets');
        const d = (res.data ?? {}) as Partial<WidgetsValues>;
        setValues({
          enabled_widgets: (d.enabled_widgets as string[] | undefined) ?? DEFAULTS.enabled_widgets,
          enabled_sidebar_modules:
            (d.enabled_sidebar_modules as string[] | undefined) ?? DEFAULTS.enabled_sidebar_modules,
          theme: (d.theme as ThemeName | undefined) ?? DEFAULTS.theme,
          configuration: {
            ...DEFAULTS.configuration,
            ...((d.configuration as Partial<WidgetsConfiguration> | undefined) ?? {}),
          },
        });
      } catch {
        toast.error('Failed to load widgets settings');
      }
    })();
  }, []);

  const saveConfiguration = async (configuration: WidgetsConfiguration) => {
    setConfigSaving(true);
    try {
      await settingsApi.upsert('widgets', 'configuration', configuration);
      setValues((prev) => ({ ...prev, configuration }));
      toast.success('Saved');
      setConfigOpen(false);
    } catch {
      toast.error('Failed to save');
    } finally {
      setConfigSaving(false);
    }
  };

  const save = async <K extends keyof WidgetsValues>(key: K, value: WidgetsValues[K]) => {
    const previous = values[key];
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === 'enabled_sidebar_modules') {
      setEnabledSidebarModules(value as string[]);
    } else if (key === 'enabled_widgets') {
      setEnabledWidgets(value as string[]);
    }
    try {
      await settingsApi.upsert('widgets', key, value);
      toast.success('Saved');
    } catch {
      setValues((prev) => ({ ...prev, [key]: previous }));
      if (key === 'enabled_sidebar_modules') {
        setEnabledSidebarModules(previous as string[]);
      } else if (key === 'enabled_widgets') {
        setEnabledWidgets(previous as string[]);
      }
      toast.error('Failed to save');
    }
  };

  const toggleWidget = (key: string) => {
    const next = values.enabled_widgets.includes(key)
      ? values.enabled_widgets.filter((k) => k !== key)
      : [...values.enabled_widgets, key];
    save('enabled_widgets', next);
  };

  const toggleSidebar = (key: string) => {
    const next = values.enabled_sidebar_modules.includes(key)
      ? values.enabled_sidebar_modules.filter((k) => k !== key)
      : [...values.enabled_sidebar_modules, key];
    save('enabled_sidebar_modules', next);
  };

  return (
    <div className="px-4">
      <h1 className="text-xl font-semibold text-slate-100 mb-6">Widgets</h1>

      <Section
        title="Widgets Configuration"
        description="Page banners and tag colors for the Missions and Tournaments widgets."
      >
        <div className="flex items-center justify-between bg-slate-900 px-5 py-4">
          <div>
            <p className="text-slate-200 text-sm font-semibold">Missions & Tournaments</p>
            <p className="text-slate-500 text-xs mt-0.5">
              Configure page banners (desktop / mobile) and casino / sport tag colors.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfigOpen(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-blue-500/60 text-blue-300 hover:bg-blue-500/10 transition-colors"
          >
            Update
          </button>
        </div>
      </Section>

      <Section
        title="Dashboard Widgets"
        description="Choose which dashboard widgets are available to operators."
      >
        {DASHBOARD_WIDGETS.map((w) => {
          const enabled = values.enabled_widgets.includes(w.key);
          return (
            <div key={w.key} className="flex items-center justify-between bg-slate-900 px-5 py-4">
              <div>
                <p className="text-slate-200 text-sm font-semibold">{w.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{w.description}</p>
              </div>
              <Toggle enabled={enabled} onChange={() => toggleWidget(w.key)} />
            </div>
          );
        })}
      </Section>

      <Section
        title="Sidebar Modules"
        description="Show or hide top-level sidebar entries. Settings is always shown so you can re-enable other modules later."
      >
        {SIDEBAR_MODULES.map((m) => {
          const enabled =
            m.key === 'settings' ? true : values.enabled_sidebar_modules.includes(m.key);
          const locked = m.key === 'settings';
          return (
            <div key={m.key} className="flex items-center justify-between bg-slate-900 px-5 py-4">
              <div>
                <p className="text-slate-200 text-sm font-semibold">{m.label}</p>
                {locked && (
                  <p className="text-slate-500 text-xs mt-0.5">
                    Always visible — required to manage these toggles.
                  </p>
                )}
              </div>
              <Toggle
                enabled={enabled}
                onChange={() => toggleSidebar(m.key)}
                disabled={locked}
                title={locked ? 'Settings is always visible' : undefined}
              />
            </div>
          );
        })}
      </Section>

      <Section
        title="Theme"
        description="Default theme applied to operators who haven't set a personal preference."
      >
        <div className="bg-slate-900 px-5 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {THEME_OPTIONS.map((opt) => {
              const selected = values.theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => save('theme', opt.value)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-colors ${
                    selected
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/60'
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-md border border-white/10 shrink-0"
                    style={{ background: opt.swatch }}
                  />
                  <span
                    className={`text-sm ${selected ? 'text-blue-300 font-medium' : 'text-slate-200'}`}
                  >
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      {configOpen && (
        <WidgetsConfigurationModal
          value={values.configuration}
          onSave={saveConfiguration}
          loading={configSaving}
          closeModal={() => setConfigOpen(false)}
        />
      )}
    </div>
  );
};

export default WidgetsPanel;
