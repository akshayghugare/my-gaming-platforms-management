import type { Dispatch, FC, SetStateAction } from 'react';
import ModalSelect from '@/components/dropdowns/ModalSelect';
import { MediaDatabaseErrors, MediaDatabaseForm } from '@/types/medaiDatabase.types';

interface CategoryOption {
  label: string;
  value: string;
}

interface Props {
  form: MediaDatabaseForm;
  setForm: Dispatch<SetStateAction<MediaDatabaseForm>>;
  errors: MediaDatabaseErrors;
  onSave: () => void;
  loading: boolean;
  closeCreateModal: () => void;
  categoryOptions: CategoryOption[];
  /** When true the folder is fixed by the active tab and not editable. */
  lockCategory?: boolean;
}

const CreateMediaDatabase: FC<Props> = ({
  form,
  setForm,
  errors,
  onSave,
  loading,
  closeCreateModal,
  categoryOptions,
  lockCategory = false,
}) => {
  const folderSelected = !!form.category && form.category !== '';
  const lockedLabel =
    categoryOptions.find((o) => o.value === form.category)?.label ?? form.category;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
      onClick={closeCreateModal}
    >
      <div
        className="bg-slate-900 p-6 rounded-lg w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-lg leading-none"
          onClick={closeCreateModal}
        >
          &times;
        </button>

        <h2 className="text-lg font-semibold text-white mb-6">Upload Media</h2>

        {/* Folder */}
        <div className="mb-4">
          {lockCategory ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-300 tracking-wide">Folder</label>
              <div className="bg-slate-800/80 border border-slate-600/50 rounded-md px-3 py-2 text-sm text-slate-300">
                {lockedLabel}
              </div>
            </div>
          ) : (
            <ModalSelect
              label="Folder"
              value={form.category ?? ''}
              options={categoryOptions}
              onChange={(val) =>
                setForm((prev) => ({
                  ...prev,
                  category: val,
                }))
              }
              error={errors.category}
            />
          )}
        </div>

        {/* Upload */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-3 mb-6 transition-colors ${
            folderSelected
              ? 'border-slate-500 hover:border-blue-500'
              : 'border-slate-600 opacity-60'
          }`}
        >
          {!folderSelected && (
            <p className="text-slate-400 text-sm text-center">Please select a folder first.</p>
          )}

          {/* Preview */}
          {form.imageUrl && (
            <img
              src={form.imageUrl}
              alt="preview"
              className="w-28 h-28 object-cover rounded-lg border border-slate-700"
            />
          )}

          <label
            className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-5 py-2 rounded-full font-medium transition-colors ${
              !folderSelected ? 'pointer-events-none opacity-60' : 'cursor-pointer'
            }`}
          >
            Browse File
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={!folderSelected}
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  const imageUrl = URL.createObjectURL(file);

                  setForm((prev) => ({
                    ...prev,
                    file,
                    imageUrl,
                    name: prev.name || file.name,
                  }));
                }
              }}
            />
          </label>

          {form.file?.name && (
            <p className="text-xs text-slate-400 truncate max-w-full">{form.file.name}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={closeCreateModal}
            className="text-red-400 hover:text-red-300 text-sm px-3 py-2"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            disabled={loading || !folderSelected}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm px-5 py-2 rounded-md"
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMediaDatabase;
