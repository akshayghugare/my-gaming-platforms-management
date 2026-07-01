import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import ModalSelect from '../dropdowns/ModalSelect';
import { settingsApi } from '@/services/systemSettings.service';

const CURRENCY_OPTIONS = [
  { label: 'USD - US Dollar (Default)', value: 'USD - US Dollar (Default)' },
  { label: 'EUR - Euro', value: 'EUR - Euro' },
  { label: 'GBP - British Pound', value: 'GBP - British Pound' },
  { label: 'INR - Indian Rupee', value: 'INR - Indian Rupee' },
  { label: 'JPY - Japanese Yen', value: 'JPY - Japanese Yen' },
];

const BET_OPTIONS = [
  { label: 'Total Bet Amount (RM Only)', value: 'Total Bet Amount (RM Only)' },
  { label: 'Net Bet Amount', value: 'Net Bet Amount' },
  { label: 'Deposit Amount', value: 'Deposit Amount' },
];

interface MissionValues {
  default_currency: string;
  xp_setting: string;
  allow_ranks_downgrade: boolean;
}

const DEFAULTS: MissionValues = {
  default_currency: 'USD - US Dollar (Default)',
  xp_setting: 'Total Bet Amount (RM Only)',
  allow_ranks_downgrade: false,
};

const RowShell = ({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg px-5 py-4 hover:bg-slate-700/50 hover:border-slate-500 transition-colors">
    <div>
      <p className="font-semibold text-slate-200 text-sm">{label}</p>
      {description && <p className="text-slate-500 text-xs mt-0.5">{description}</p>}
    </div>
    {children}
  </div>
);

const MissionsPanel = () => {
  const [values, setValues] = useState<MissionValues>(DEFAULTS);

  useEffect(() => {
    (async () => {
      try {
        const res = await settingsApi.getByPanel('mission');
        const d = (res.data ?? {}) as Partial<MissionValues>;
        setValues({
          default_currency: (d.default_currency as string) ?? DEFAULTS.default_currency,
          xp_setting: (d.xp_setting as string) ?? DEFAULTS.xp_setting,
          allow_ranks_downgrade: Boolean(d.allow_ranks_downgrade),
        });
      } catch {
        toast.error('Failed to load mission settings');
      }
    })();
  }, []);

  const save = async <K extends keyof MissionValues>(key: K, value: MissionValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    try {
      await settingsApi.upsert('mission', key, value);
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  return (
    <div className="px-4 ">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white mb-6">Missions</h1>
        <div className="space-y-2">
          <RowShell
            label="Default Currency"
            description="Select the default currency for the gamification system."
          >
            <ModalSelect
              label=""
              value={values.default_currency}
              options={CURRENCY_OPTIONS}
              onChange={(v) => save('default_currency', v)}
            />
          </RowShell>

          <RowShell
            label="XP Points Settings"
            description="Select the setting for calculating XP points."
          >
            <ModalSelect
              label=""
              value={values.xp_setting}
              options={BET_OPTIONS}
              onChange={(v) => save('xp_setting', v)}
            />
          </RowShell>

          <RowShell
            label="Allow Ranks Downgrade"
            description="Allow players to be downgraded in rank."
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => save('allow_ranks_downgrade', !values.allow_ranks_downgrade)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                  values.allow_ranks_downgrade ? 'bg-blue-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white ${
                    values.allow_ranks_downgrade ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-slate-400 text-sm">
                {values.allow_ranks_downgrade ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </RowShell>
        </div>
      </div>
    </div>
  );
};

export default MissionsPanel;
