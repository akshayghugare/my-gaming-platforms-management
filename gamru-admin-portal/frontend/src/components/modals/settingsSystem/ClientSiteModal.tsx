import type { Dispatch, FC, SetStateAction } from 'react';
import { X } from 'lucide-react';
import { ClientSiteErrors, ClientSiteForm } from '@/types/systemSettings.types';

interface Props {
  form: ClientSiteForm;
  setForm: Dispatch<SetStateAction<ClientSiteForm>>;
  errors: ClientSiteErrors;
  onSave: () => void;
  loading: boolean;
  closeModal: () => void;
}

const ClientSiteModal: FC<Props> = ({ form, setForm, errors, onSave, loading, closeModal }) => {
  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-xs flex justify-center items-center z-50"
      onClick={closeModal}
    >
      <div
        className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl shadow-black/60 w-full max-w-lg mx-4 flex flex-col thin-scrollbar  overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 shrink-0">
          <h2 className="text-base font-semibold text-slate-100 tracking-tight">Client Site</h2>
          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition-all duration-200"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-400">
            In order to use the client site, please add the URL
          </p>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
              URL
            </label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="https://your-client-site.com"
              className={`
                w-full px-3 py-2.5 rounded-lg text-sm
                bg-slate-800 border text-slate-100 placeholder-slate-500
                outline-none transition-all duration-200
                focus:ring-1 focus:ring-blue-500/60
                ${
                  errors.url
                    ? 'border-red-500/60 focus:border-red-500'
                    : 'border-slate-700/60 hover:border-slate-600 focus:border-blue-500/60'
                }
              `}
            />
            {errors.url ? (
              <p className="text-xs text-red-400 mt-1">{errors.url}</p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">Example: https://your-client-site.com</p>
            )}
          </div>
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
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientSiteModal;
