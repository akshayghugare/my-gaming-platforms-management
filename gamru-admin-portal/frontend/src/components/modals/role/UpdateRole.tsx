import type { Dispatch, FC, SetStateAction } from 'react';
import type { RoleForm, RoleErrors } from '@/types/role';
import ModalInput from '@/components/inputs/ModalInput';

interface Props {
  setShow: Dispatch<SetStateAction<boolean>>;
  form: RoleForm;
  setForm: Dispatch<SetStateAction<RoleForm>>;
  errors: RoleErrors;
  onUpdate: () => void;
  loading: boolean;
}

const UpdateRole: FC<Props> = ({ setShow, form, setForm, errors, onUpdate, loading }) => {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex justify-center items-center"
      onClick={() => setShow(false)}
    >
      <div
        className="bg-slate-900 p-6 rounded w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-bold">Update Role</h2>

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

        <div className="mt-3">
          <label>Status</label>
          <select
            className="w-full px-3 py-2 bg-slate-800 rounded"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as any })}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setShow(false)}>Cancel</button>

          <button onClick={onUpdate} disabled={loading} className="bg-blue-600 px-4 py-2 rounded">
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateRole;
