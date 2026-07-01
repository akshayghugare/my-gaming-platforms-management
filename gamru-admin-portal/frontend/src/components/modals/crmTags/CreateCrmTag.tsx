import type { Dispatch, FC, SetStateAction } from 'react';
import {
  CrmTagCategory,
  CrmTagErrors,
  CrmTagForm,
  CRM_TAG_NAME_OPTIONS,
} from '@/types/crmTags.types';
import ModalSelect from '@/components/dropdowns/ModalSelect';
import ModalTextarea from '@/components/inputs/ModalTextarea';

interface CategoryOption {
  label: string;
  value: CrmTagCategory;
}

interface Props {
  form: CrmTagForm;
  setForm: Dispatch<SetStateAction<CrmTagForm>>;
  errors: CrmTagErrors;
  onSave: () => void;
  loading: boolean;
  closeCreateModal: () => void;
  categoryOptions: CategoryOption[];
  /** When true the category is fixed by the active tab and not editable. */
  lockCategory?: boolean;
}

const CreateCrmTag: FC<Props> = ({
  form,
  setForm,
  errors,
  onSave,
  loading,
  closeCreateModal,
  categoryOptions,
  lockCategory = false,
}) => {
  const lockedLabel =
    categoryOptions.find((o) => o.value === form.category)?.label ?? form.category;
  const nameOptions = form.category ? CRM_TAG_NAME_OPTIONS[form.category] : [];
  return (
    <div
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
      onClick={closeCreateModal}
    >
      <div
        className="bg-slate-900 p-6 rounded-lg w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-lg leading-none"
          onClick={closeCreateModal}
        >
          &times;
        </button>

        <h2 className="text-base font-medium text-slate-100 mb-5">Create CRM Tag</h2>

        <div className="mb-4">
          {lockCategory ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-300 tracking-wide">Category</label>
              <div className="bg-slate-800/80 border border-slate-600/50 rounded-md px-3 py-2 text-sm text-slate-300">
                {lockedLabel}
              </div>
            </div>
          ) : (
            <ModalSelect
              label="Category"
              value={form.category ?? ''}
              options={categoryOptions}
              onChange={(val) =>
                setForm({
                  ...form,
                  category: val as CrmTagForm['category'],
                  name: '',
                })
              }
              error={errors.category}
            />
          )}
        </div>

        <div className="mb-4">
          <ModalSelect
            label="Name"
            value={form.name}
            options={nameOptions.map((n) => ({ label: n, value: n }))}
            onChange={(val) => setForm({ ...form, name: val })}
            error={errors.name}
          />
        </div>

        <div className="mb-6">
          <ModalTextarea
            label="Description"
            value={form.description ?? ''}
            onChange={(val) => setForm({ ...form, description: val })}
            error={errors.description}
            rows={4}
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={closeCreateModal}
            className="text-red-400 hover:text-red-300 text-sm px-3 py-2"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-5 py-2 rounded-md"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCrmTag;
