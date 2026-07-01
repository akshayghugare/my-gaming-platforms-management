import { useState, type FC } from 'react';
import { X } from 'lucide-react';

export interface WebhookFormData {
  name: string;
  url: string;
  is_enabled: boolean;
}

interface Props {
  loading: boolean;
  closeModal: () => void;
  onSave: (data: WebhookFormData) => Promise<void> | void;
}

const inputClass = (hasError: boolean) =>
  `w-full px-3 py-2.5 rounded-lg text-sm bg-slate-800 border text-slate-100 placeholder-slate-500 outline-none transition-all focus:ring-1 focus:ring-blue-500/60 ${
    hasError
      ? 'border-red-500/60 focus:border-red-500'
      : 'border-slate-700/60 hover:border-slate-600 focus:border-blue-500/60'
  }`;

const WebhookModal: FC<Props> = ({ loading, closeModal, onSave }) => {
  const [form, setForm] = useState<WebhookFormData>({
    name: '',
    url: '',
    is_enabled: true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof WebhookFormData, string>>>({});

  const validate = (): boolean => {
    const next: Partial<Record<keyof WebhookFormData, string>> = {};
    if (!form.name.trim()) next.name = 'Required';
    if (!form.url.trim()) {
      next.url = 'Required';
    } else {
      try {
        new URL(form.url);
      } catch {
        next.url = 'Enter a valid URL';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onSave({
      name: form.name.trim(),
      url: form.url.trim(),
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
          <h2 className="text-base font-semibold text-slate-100">Add Webhook</h2>
          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/60"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Player Created"
              className={inputClass(Boolean(errors.name))}
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              URL *
            </label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
              placeholder="https://example.com/webhook"
              className={inputClass(Boolean(errors.url))}
            />
            {errors.url && <p className="text-xs text-red-400">{errors.url}</p>}
          </div>

          <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm text-slate-200 font-medium">Enabled</p>
              <p className="text-xs text-slate-500">Whether this webhook is active.</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, is_enabled: !p.is_enabled }))}
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
            {loading ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebhookModal;
