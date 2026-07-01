import { useEffect, useState, type FC } from 'react';
import { X } from 'lucide-react';

export interface AuthenticationApiConfig {
  auth_url: string;
  token_url: string;
  client_id: string;
  client_secret: string;
  scopes: string;
}

const EMPTY: AuthenticationApiConfig = {
  auth_url: '',
  token_url: '',
  client_id: '',
  client_secret: '',
  scopes: '',
};

interface Props {
  initialValue: Partial<AuthenticationApiConfig> | null;
  loading: boolean;
  closeModal: () => void;
  onSave: (data: AuthenticationApiConfig) => Promise<void> | void;
}

const inputClass = (hasError: boolean) =>
  `w-full px-3 py-2.5 rounded-lg text-sm bg-slate-800 border text-slate-100 placeholder-slate-500 outline-none transition-all focus:ring-1 focus:ring-blue-500/60 ${
    hasError
      ? 'border-red-500/60 focus:border-red-500'
      : 'border-slate-700/60 hover:border-slate-600 focus:border-blue-500/60'
  }`;

const AuthenticationApiModal: FC<Props> = ({ initialValue, loading, closeModal, onSave }) => {
  const [form, setForm] = useState<AuthenticationApiConfig>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof AuthenticationApiConfig, string>>>({});

  useEffect(() => {
    setForm({
      auth_url: initialValue?.auth_url ?? '',
      token_url: initialValue?.token_url ?? '',
      client_id: initialValue?.client_id ?? '',
      client_secret: initialValue?.client_secret ?? '',
      scopes: initialValue?.scopes ?? '',
    });
  }, [initialValue]);

  const validate = (): boolean => {
    const next: Partial<Record<keyof AuthenticationApiConfig, string>> = {};
    const isUrl = (v: string): boolean => {
      if (!v) return false;
      try {
        new URL(v);
        return true;
      } catch {
        return false;
      }
    };
    if (!isUrl(form.auth_url)) next.auth_url = 'Enter a valid URL';
    if (!isUrl(form.token_url)) next.token_url = 'Enter a valid URL';
    if (!form.client_id.trim()) next.client_id = 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onSave({
      auth_url: form.auth_url.trim(),
      token_url: form.token_url.trim(),
      client_id: form.client_id.trim(),
      client_secret: form.client_secret.trim(),
      scopes: form.scopes.trim(),
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
          <h2 className="text-base font-semibold text-slate-100">Authentication API</h2>
          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-400">
            Operator OAuth2 / OIDC endpoints used to authenticate platform API requests.
          </p>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Authorization URL *
            </label>
            <input
              type="url"
              value={form.auth_url}
              onChange={(e) => setForm((p) => ({ ...p, auth_url: e.target.value }))}
              placeholder="https://idp.example.com/oauth/authorize"
              className={inputClass(Boolean(errors.auth_url))}
            />
            {errors.auth_url && <p className="text-xs text-red-400">{errors.auth_url}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Token URL *
            </label>
            <input
              type="url"
              value={form.token_url}
              onChange={(e) => setForm((p) => ({ ...p, token_url: e.target.value }))}
              placeholder="https://idp.example.com/oauth/token"
              className={inputClass(Boolean(errors.token_url))}
            />
            {errors.token_url && <p className="text-xs text-red-400">{errors.token_url}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Client ID *
            </label>
            <input
              type="text"
              value={form.client_id}
              onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value }))}
              placeholder="oauth-client-id"
              className={inputClass(Boolean(errors.client_id))}
            />
            {errors.client_id && <p className="text-xs text-red-400">{errors.client_id}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Client Secret
            </label>
            <input
              type="password"
              value={form.client_secret}
              onChange={(e) => setForm((p) => ({ ...p, client_secret: e.target.value }))}
              placeholder="••••••••••••"
              className={inputClass(false)}
            />
            <p className="text-xs text-slate-500">
              Leave blank to keep the existing secret unchanged.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              Scopes
            </label>
            <input
              type="text"
              value={form.scopes}
              onChange={(e) => setForm((p) => ({ ...p, scopes: e.target.value }))}
              placeholder="openid profile email"
              className={inputClass(false)}
            />
            <p className="text-xs text-slate-500">Space-separated scopes.</p>
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

export default AuthenticationApiModal;
