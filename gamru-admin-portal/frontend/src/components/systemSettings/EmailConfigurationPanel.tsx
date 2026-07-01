import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { emailSmtpApi } from '@/services/systemSettings.service';
import type { EmailSmtpDTO, EmailSmtpInput, EmailSmtpType } from '@/types/systemSettings.types';
import EmailSmtpModal from '../modals/settingsSystem/EmailSmtpModal';

interface FlowMeta {
  type: EmailSmtpType;
  title: string;
  description: string;
}

const FLOWS: FlowMeta[] = [
  {
    type: 'register',
    title: 'Registration Email',
    description: 'Welcome email sent to a user when their account is created.',
  },
  {
    type: 'reward',
    title: 'Reward Email',
    description: 'Email sent when a player is given a reward.',
  },
];

const EmailConfigurationPanel = () => {
  const [configs, setConfigs] = useState<Record<string, EmailSmtpDTO>>({});
  const [editing, setEditing] = useState<EmailSmtpType | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await emailSmtpApi.list();
        const map: Record<string, EmailSmtpDTO> = {};
        (res.data ?? []).forEach((c) => {
          map[c.type] = c;
        });
        setConfigs(map);
      } catch {
        toast.error('Failed to load Email SMTP');
      }
    })();
  }, []);

  const save = async (type: EmailSmtpType, data: EmailSmtpInput) => {
    setSaving(true);
    try {
      const res = await emailSmtpApi.upsert(type, data);
      if (res?.success && res.data) {
        setConfigs((prev) => ({ ...prev, [type]: res.data as EmailSmtpDTO }));
        toast.success('Email SMTP saved');
        setEditing(null);
      } else {
        toast.error(res?.message || 'Failed to save Email SMTP');
      }
    } catch (err) {
      toast.error((err as { message?: string })?.message || 'Failed to save Email SMTP');
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (type: EmailSmtpType) => {
    const current = configs[type];
    if (!current?.host) {
      toast.info('Configure SMTP credentials before enabling this email.');
      setEditing(type);
      return;
    }
    await save(type, { is_enabled: !current.is_enabled });
  };

  return (
    <div className="px-4 space-y-4 text-slate-200">
      <div>
        <h2 className="text-base font-semibold text-slate-100 mb-1">Email SMTP Configuration</h2>
        <p className="text-xs text-slate-400 mb-3">
          Set SMTP credentials per email flow and toggle each one on or off.
        </p>

        <div className="space-y-3">
          {FLOWS.map((flow) => {
            const cfg = configs[flow.type];
            const enabled = cfg?.is_enabled ?? false;
            return (
              <div
                key={flow.type}
                className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900"
              >
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100">{flow.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{flow.description}</p>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {cfg?.host
                        ? `${cfg.host}:${cfg.port ?? ''} · ${cfg.username ?? ''}`
                        : 'Not configured'}
                    </p>
                  </div>

                  <div className="ml-4 flex items-center gap-3 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleEnabled(flow.type)}
                      title={enabled ? 'Disable' : 'Enable'}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enabled ? 'bg-blue-500' : 'bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => setEditing(flow.type)}
                      className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors"
                    >
                      {cfg?.host ? 'Update' : 'Configure'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editing && (
        <EmailSmtpModal
          type={editing}
          initialValue={configs[editing] ?? null}
          loading={saving}
          closeModal={() => setEditing(null)}
          onSave={(data) => save(editing, data)}
        />
      )}
    </div>
  );
};

export default EmailConfigurationPanel;
