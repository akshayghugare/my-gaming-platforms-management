import { useState, type FC } from 'react';
import { X } from 'lucide-react';
import type { EmailSmtpDTO, EmailSmtpInput, EmailSmtpType } from '@/types/systemSettings.types';

interface Props {
  type: EmailSmtpType;
  initialValue: EmailSmtpDTO | null;
  loading: boolean;
  closeModal: () => void;
  onSave: (data: EmailSmtpInput) => Promise<void> | void;
}

interface FormState {
  host: string;
  port: string;
  username: string;
  password: string;
  from_email: string;
  is_enabled: boolean;
}

const inputClass = (hasError: boolean) =>
  `w-full px-3 py-2.5 rounded-lg text-sm bg-slate-800 border text-slate-100 placeholder-slate-500 outline-none transition-all focus:ring-1 focus:ring-blue-500/60 ${
    hasError
      ? 'border-red-500/60 focus:border-red-500'
      : 'border-slate-700/60 hover:border-slate-600 focus:border-blue-500/60'
  }`;

const labelClass = 'block text-xs font-medium text-slate-300 uppercase tracking-wider';

const EmailSmtpModal: FC<Props> = ({ type, initialValue, loading, closeModal, onSave }) => {
  const [form, setForm] = useState<FormState>({
    host: initialValue?.host ?? '',
    port: initialValue?.port != null ? String(initialValue.port) : '587',
    username: initialValue?.username ?? '',
    password: '',
    from_email: initialValue?.from_email ?? '',
    is_enabled: initialValue?.is_enabled ?? false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.host.trim()) next.host = 'Required';
    if (!form.port.trim()) next.port = 'Required';
    else if (Number.isNaN(Number(form.port))) next.port = 'Must be a number';
    if (!form.username.trim()) next.username = 'Required';
    // Password required only on first setup (when none stored yet)
    if (!initialValue?.id && !form.password.trim()) next.password = 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onSave({
      host: form.host.trim(),
      port: Number(form.port),
      username: form.username.trim(),
      // Empty password => keep existing one (handled by backend)
      password: form.password.trim() || undefined,
      from_email: form.from_email.trim() || null,
      is_enabled: form.is_enabled,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={closeModal}
    >
      <div
        className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <h2 className="text-base font-semibold text-slate-100 capitalize">
            {type} SMTP Configuration
          </h2>
          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/60"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <label className={labelClass}>Host *</label>
            <input
              type="text"
              value={form.host}
              onChange={(e) => set('host', e.target.value)}
              placeholder="smtp.gmail.com"
              className={inputClass(Boolean(errors.host))}
            />
            {errors.host && <p className="text-xs text-red-400">{errors.host}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Port *</label>
            <input
              type="text"
              value={form.port}
              onChange={(e) => set('port', e.target.value)}
              placeholder="587"
              className={inputClass(Boolean(errors.port))}
            />
            {errors.port && <p className="text-xs text-red-400">{errors.port}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>User *</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => set('username', e.target.value)}
              placeholder="you@example.com"
              className={inputClass(Boolean(errors.username))}
            />
            {errors.username && <p className="text-xs text-red-400">{errors.username}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>Password {initialValue?.id ? '' : '*'}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder={initialValue?.id ? 'Leave blank to keep current' : 'App password'}
              className={inputClass(Boolean(errors.password))}
            />
            {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
          </div>

          <div className="space-y-1.5">
            <label className={labelClass}>From</label>
            <input
              type="text"
              value={form.from_email}
              onChange={(e) => set('from_email', e.target.value)}
              placeholder={'"App Name <you@example.com>"'}
              className={inputClass(false)}
            />
          </div>

          <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm text-slate-200 font-medium">Enabled</p>
              <p className="text-xs text-slate-500">Send {type} emails using this SMTP.</p>
            </div>
            <button
              type="button"
              onClick={() => set('is_enabled', !form.is_enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                form.is_enabled ? 'bg-blue-500' : 'bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white ${
                  form.is_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700/50">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white"
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailSmtpModal;
