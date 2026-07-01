import type { Dispatch, FC, SetStateAction } from 'react';
import ModalInput from '@/components/inputs/ModalInput';
import {
  CasinoCatalogGameFormData,
  CasinoCatalogGameFormErrors,
} from '@/types/casinoCatalog.types';

interface CreateCatalogCasinoGameProps {
  isOpen: boolean;
  closeModal: () => void;
  form: CasinoCatalogGameFormData;
  setForm: Dispatch<SetStateAction<CasinoCatalogGameFormData>>;
  errors: CasinoCatalogGameFormErrors;
  onSave: () => void;
  loading: boolean;
  /** If provided, the modal is in edit mode */
  editId?: string | null;
}

const CreateCatalogCasinoGame: FC<CreateCatalogCasinoGameProps> = ({
  isOpen,
  closeModal,
  form,
  setForm,
  errors,
  onSave,
  loading,
  editId,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
      onClick={closeModal}
    >
      <div
        className="bg-slate-900 w-full max-w-lg rounded-xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">{editId ? 'Edit Game' : 'New Game'}</h2>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ID & Name */}
        <div className="grid grid-cols-2 gap-4">
          <ModalInput
            label="ID"
            value={form.id}
            onChange={(val) => setForm((f) => ({ ...f, id: val }))}
            error={errors.id}
          />
          <ModalInput
            label="Name"
            value={form.name}
            onChange={(val) => setForm((f) => ({ ...f, name: val }))}
            error={errors.name}
          />
        </div>

        {/* Provider & Category */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Provider */}
          <div>
            <label className="text-sm text-slate-300 block mb-1">Provider</label>
            <div className="relative">
              <select
                className="w-full appearance-none px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                value={form.provider}
                onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
              >
                <option value="">Select provider</option>
                <option value="PragmaticPlay">PragmaticPlay</option>
                <option value="RedTiger">Red Tiger</option>
                <option value="KAGaming">KAGaming</option>
              </select>
              <svg
                className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            {errors.provider && <p className="text-red-400 text-xs mt-1">{errors.provider}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="text-sm text-slate-300 block mb-1">Category</label>
            <div className="relative">
              <select
                className="w-full appearance-none px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="">Select category</option>
                <option value="slots">Slots</option>
                <option value="table_games">Table Games</option>
                <option value="live_casino">Live Casino</option>
              </select>
              <svg
                className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
          </div>
        </div>

        {/* Game Thumbnail */}
        <div className="mt-4">
          <ModalInput
            label="Game Thumbnail URL (Optional)"
            value={form.gameThumbnail ?? ''}
            onChange={(val) => setForm((f) => ({ ...f, gameThumbnail: val }))}
          />
        </div>

        {/* Tournament Widget Thumbnail */}
        <div className="mt-4">
          <ModalInput
            label="Tournament Widget Thumbnail URL (Optional)"
            value={form.tournamentWidgetThumbnail ?? ''}
            onChange={(val) => setForm((f) => ({ ...f, tournamentWidgetThumbnail: val }))}
          />
        </div>

        {/* Bonus Buy & Device Support */}
        <div className="mt-4 flex gap-8">
          <div>
            <p className="text-sm text-slate-300 mb-2">Bonus Buy Allow</p>
            <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-200">
              <input
                type="checkbox"
                className="w-4 h-4 accent-blue-600"
                checked={form.bonusBuyAllow}
                onChange={(e) => setForm((f) => ({ ...f, bonusBuyAllow: e.target.checked }))}
              />
              Yes
            </label>
          </div>
          <div>
            <p className="text-sm text-slate-300 mb-2">Device Support</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-blue-600"
                  checked={form.deviceSupport.mobile}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      deviceSupport: { ...f.deviceSupport, mobile: e.target.checked },
                    }))
                  }
                />
                Mobile
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-200">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-blue-600"
                  checked={form.deviceSupport.desktop}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      deviceSupport: { ...f.deviceSupport, desktop: e.target.checked },
                    }))
                  }
                />
                Desktop
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={closeModal}
            type="button"
            className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            type="button"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded text-sm text-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : editId ? 'Update' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCatalogCasinoGame;
