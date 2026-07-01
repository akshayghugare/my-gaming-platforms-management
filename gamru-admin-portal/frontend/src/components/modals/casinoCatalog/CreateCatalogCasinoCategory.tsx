import type { Dispatch, FC, SetStateAction } from 'react';
import ModalInput from '@/components/inputs/ModalInput';
import {
  CasinoCatalogCategoryFormData,
  CasinoCatalogCategoryFormErrors,
} from '@/types/casinoCatalog.types';

interface CreateCatalogCasinoCategoryProps {
  isOpen: boolean;
  closeModal: () => void;
  form: CasinoCatalogCategoryFormData;
  setForm: Dispatch<SetStateAction<CasinoCatalogCategoryFormData>>;
  errors: CasinoCatalogCategoryFormErrors;
  onSave: () => void;
  loading: boolean;
  /** If provided, the modal is in edit mode */
  editId?: string | null;
}

const CreateCatalogCasinoCategory: FC<CreateCatalogCasinoCategoryProps> = ({
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
        className="bg-slate-900 w-full max-w-sm rounded-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">
            {editId ? 'Edit Category' : 'New Category'}
          </h2>
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

        <div className="flex flex-col gap-4">
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

export default CreateCatalogCasinoCategory;
