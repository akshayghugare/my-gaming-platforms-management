import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import ModalSelect from '../dropdowns/ModalSelect';
import { settingsApi } from '@/services/systemSettings.service';
import SettingsValueModal, {
  type SettingsInputMode,
} from '../modals/settingsSystem/SettingsValueModal';

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

const PLAYER_CATEGORY_OPTIONS = [
  { label: 'Average Deposit Amount', value: 'Average Deposit Amount' },
  { label: 'Total Deposit Amount', value: 'Total Deposit Amount' },
  { label: 'Net Bet Amount', value: 'Net Bet Amount' },
];

const SPORTS_EVENT_OPTIONS = [
  { label: 'Placed Bets', value: 'Placed Bets' },
  { label: 'Settled Bets', value: 'Settled Bets' },
  { label: 'Winning Bets', value: 'Winning Bets' },
];

const COUNTER_RESET_OPTIONS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'Never', value: 'never' },
];

interface GamificationValues {
  default_currency: string;
  xp_setting: string;
  tokens_setting: string;
  player_category_setting: string;
  sports_event_setting: string;
  allow_ranks_downgrade: boolean;
  counter_reset_option: string;
  opt_out_reasons: string[];
  custom_fields: string[];
  low_stock_alert: number;
  pams_player_card_url: string;
}

const DEFAULTS: GamificationValues = {
  default_currency: 'USD - US Dollar (Default)',
  xp_setting: 'Total Bet Amount (RM Only)',
  tokens_setting: 'Total Bet Amount (RM Only)',
  player_category_setting: 'Average Deposit Amount',
  sports_event_setting: 'Placed Bets',
  allow_ranks_downgrade: false,
  counter_reset_option: 'monthly',
  opt_out_reasons: [],
  custom_fields: [],
  low_stock_alert: 0,
  pams_player_card_url: '',
};

interface RowProps {
  label: string;
  description?: string;
  type: 'dropdown' | 'toggle' | 'button';
  value?: string;
  options?: { label: string; value: string }[];
  toggle?: boolean;
  buttonLabel?: string;
  onChange?: (val: string) => void;
  onToggle?: (next: boolean) => void;
  onClick?: () => void;
}

const SettingRow = ({
  label,
  description,
  type,
  value,
  options,
  toggle,
  buttonLabel,
  onChange,
  onToggle,
  onClick,
}: RowProps) => (
  <div className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg px-5 py-4 hover:bg-slate-700/50 hover:border-slate-500 transition-colors">
    <div>
      <p className="font-semibold text-slate-200 text-sm">{label}</p>
      {description && <p className="text-slate-500 text-xs mt-0.5">{description}</p>}
    </div>

    {type === 'dropdown' && (
      <ModalSelect
        label=""
        value={value ?? ''}
        options={options ?? []}
        onChange={onChange ?? (() => {})}
      />
    )}

    {type === 'toggle' && (
      <div className="flex items-center gap-3">
        <button
          onClick={() => onToggle?.(!toggle)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            toggle ? 'bg-blue-500' : 'bg-slate-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white ${
              toggle ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-slate-400 text-sm">{toggle ? 'Enabled' : 'Disabled'}</span>
      </div>
    )}

    {type === 'button' && (
      <button
        onClick={onClick}
        className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-5 py-1.5 rounded-full"
      >
        {buttonLabel || 'Update'}
      </button>
    )}
  </div>
);

type ModalKey =
  | 'counter_reset_option'
  | 'opt_out_reasons'
  | 'custom_fields'
  | 'low_stock_alert'
  | 'pams_player_card_url';

interface ModalSpec {
  key: keyof GamificationValues;
  title: string;
  description?: string;
  fieldLabel?: string;
  helperText?: string;
  mode: SettingsInputMode;
  placeholder?: string;
  options?: { label: string; value: string }[];
  min?: number;
}

const MODAL_SPECS: Record<ModalKey, ModalSpec> = {
  counter_reset_option: {
    key: 'counter_reset_option',
    title: 'Counter Reset Option',
    description: 'How often opt-out counters reset for players.',
    fieldLabel: 'Reset Frequency',
    mode: 'select',
    options: COUNTER_RESET_OPTIONS,
  },
  opt_out_reasons: {
    key: 'opt_out_reasons',
    title: 'Opt Out Reasons',
    description: 'Reasons offered to players when they opt out of loyalty.',
    fieldLabel: 'Reasons',
    mode: 'chips',
    placeholder: 'Type a reason and press Enter',
    helperText: 'Press Enter or comma to add each reason.',
  },
  custom_fields: {
    key: 'custom_fields',
    title: 'Reward Shop — Custom Fields',
    description: 'Define custom fields collected at reward checkout.',
    fieldLabel: 'Custom Fields',
    mode: 'chips',
    placeholder: 'e.g. shipping_address',
    helperText: 'Press Enter to add each field key.',
  },
  low_stock_alert: {
    key: 'low_stock_alert',
    title: 'Low Stock Alert',
    description: 'Alert administrators when reward stock drops below this threshold.',
    fieldLabel: 'Threshold',
    mode: 'number',
    min: 0,
    placeholder: '10',
  },
  pams_player_card_url: {
    key: 'pams_player_card_url',
    title: 'PAMS Player Card URL',
    description: 'External URL pattern used to open the player card in PAMS.',
    fieldLabel: 'URL',
    mode: 'url',
    placeholder: 'https://pams.example.com/players/{id}',
    helperText: 'Use {id} as a placeholder for the player ID.',
  },
};

const GamificationPanel = () => {
  const [values, setValues] = useState<GamificationValues>(DEFAULTS);
  const [activeModal, setActiveModal] = useState<ModalKey | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await settingsApi.getByPanel('gamification');
        const d = (res.data ?? {}) as Partial<GamificationValues>;
        setValues({
          default_currency: (d.default_currency as string) ?? DEFAULTS.default_currency,
          xp_setting: (d.xp_setting as string) ?? DEFAULTS.xp_setting,
          tokens_setting: (d.tokens_setting as string) ?? DEFAULTS.tokens_setting,
          player_category_setting:
            (d.player_category_setting as string) ?? DEFAULTS.player_category_setting,
          sports_event_setting: (d.sports_event_setting as string) ?? DEFAULTS.sports_event_setting,
          allow_ranks_downgrade: Boolean(d.allow_ranks_downgrade),
          counter_reset_option: (d.counter_reset_option as string) ?? DEFAULTS.counter_reset_option,
          opt_out_reasons: (d.opt_out_reasons as string[]) ?? [],
          custom_fields: (d.custom_fields as string[]) ?? [],
          low_stock_alert: Number(d.low_stock_alert ?? 0),
          pams_player_card_url: (d.pams_player_card_url as string) ?? '',
        });
      } catch {
        toast.error('Failed to load gamification settings');
      }
    })();
  }, []);

  const save = async <K extends keyof GamificationValues>(key: K, value: GamificationValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    try {
      await settingsApi.upsert('gamification', key, value);
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    }
  };

  const saveFromModal = async (value: unknown) => {
    if (!activeModal) return;
    setSaving(true);
    try {
      await settingsApi.upsert('gamification', activeModal, value);
      setValues((prev) => ({ ...prev, [activeModal]: value as never }));
      toast.success('Saved');
      setActiveModal(null);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const currentSpec = useMemo(() => (activeModal ? MODAL_SPECS[activeModal] : null), [activeModal]);

  const summary = (key: ModalKey): string => {
    const v = values[key];
    if (Array.isArray(v)) return v.length === 0 ? '—' : v.join(', ');
    if (v == null || v === '') return '—';
    return String(v);
  };

  return (
    <div className="px-4 ">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white mb-6">Gamification</h1>
        <div className="space-y-2">
          <SettingRow
            label="Default Currency"
            type="dropdown"
            options={CURRENCY_OPTIONS}
            value={values.default_currency}
            onChange={(v) => save('default_currency', v)}
          />
          <SettingRow
            label="XP Points Settings"
            description="Select the setting for calculating XP points."
            type="dropdown"
            options={BET_OPTIONS}
            value={values.xp_setting}
            onChange={(v) => save('xp_setting', v)}
          />
          <SettingRow
            label="Tokens Settings"
            description="Select the setting for calculating tokens."
            type="dropdown"
            options={BET_OPTIONS}
            value={values.tokens_setting}
            onChange={(v) => save('tokens_setting', v)}
          />
          <SettingRow
            label="Player Category Settings"
            description="Select the category for player ranking."
            type="dropdown"
            options={PLAYER_CATEGORY_OPTIONS}
            value={values.player_category_setting}
            onChange={(v) => save('player_category_setting', v)}
          />
          <SettingRow
            label="Sports Event Type Contribution"
            description="Select the type of sports events that contribute to gamification."
            type="dropdown"
            options={SPORTS_EVENT_OPTIONS}
            value={values.sports_event_setting}
            onChange={(v) => save('sports_event_setting', v)}
          />
          <SettingRow
            label="Allow Ranks Downgrade"
            description="Allow players to be downgraded in rank."
            type="toggle"
            toggle={values.allow_ranks_downgrade}
            onToggle={(v) => save('allow_ranks_downgrade', v)}
          />
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-xl text-white mb-6">Loyalty Opt Out</h1>
        <div className="space-y-2">
          <SettingRow
            label="Counter Reset Option"
            description={summary('counter_reset_option')}
            type="button"
            buttonLabel="Change"
            onClick={() => setActiveModal('counter_reset_option')}
          />
          <SettingRow
            label="Opt Out Reasons"
            description={summary('opt_out_reasons')}
            type="button"
            buttonLabel="Update"
            onClick={() => setActiveModal('opt_out_reasons')}
          />
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-xl text-white mb-6">Reward Shop</h1>
        <div className="space-y-2">
          <SettingRow
            label="Custom Fields"
            description={summary('custom_fields')}
            type="button"
            buttonLabel="Change"
            onClick={() => setActiveModal('custom_fields')}
          />
          <SettingRow
            label="Low Stock Alert"
            description={summary('low_stock_alert')}
            type="button"
            buttonLabel="Change"
            onClick={() => setActiveModal('low_stock_alert')}
          />
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white mb-6">Player Card</h1>
        <div className="space-y-2">
          <SettingRow
            label="PAMS Player Card URL"
            description={summary('pams_player_card_url')}
            type="button"
            buttonLabel="Update"
            onClick={() => setActiveModal('pams_player_card_url')}
          />
        </div>
      </div>

      {currentSpec && activeModal && (
        <SettingsValueModal
          title={currentSpec.title}
          description={currentSpec.description}
          fieldLabel={currentSpec.fieldLabel}
          helperText={currentSpec.helperText}
          mode={currentSpec.mode}
          options={currentSpec.options}
          placeholder={currentSpec.placeholder}
          min={currentSpec.min}
          initialValue={values[currentSpec.key]}
          loading={saving}
          closeModal={() => setActiveModal(null)}
          onSave={saveFromModal}
        />
      )}
    </div>
  );
};

export default GamificationPanel;
