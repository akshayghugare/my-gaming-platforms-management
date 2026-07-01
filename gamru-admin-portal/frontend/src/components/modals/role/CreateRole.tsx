import type { Dispatch, FC, SetStateAction } from 'react';
import type { RoleForm, RoleErrors } from '@/types/role';
import ModalInput from '@/components/inputs/ModalInput';

interface Props {
  form: RoleForm;
  setForm: Dispatch<SetStateAction<RoleForm>>;
  errors: RoleErrors;
  onSave: () => void;
  loading: boolean;
  closeCreateModal: () => void;
}

const CreateRole: FC<Props> = ({ form, setForm, errors, onSave, loading, closeCreateModal }) => {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex justify-center items-center"
      onClick={() => {
        closeCreateModal();
      }}
    >
      <div
        className="bg-slate-900 p-6 rounded w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-bold">Create Role</h2>

        <ModalInput
          label="Role Name"
          value={form.name}
          onChange={(val) => setForm({ ...form, name: val })}
          error={errors.name}
        />

        <div className="mt-3">
          <ModalInput
            label="Description"
            value={form.description}
            onChange={(val) => setForm({ ...form, description: val })}
          />
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => closeCreateModal()}>Cancel</button>

          <button onClick={onSave} disabled={loading} className="bg-blue-600 px-4 py-2 rounded">
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRole;
