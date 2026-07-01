import type { Dispatch, FC, SetStateAction } from 'react';
import ModalInput from '../../inputs/ModalInput';
import type { UserFormData, UserFormErrors, UserRole, UserStatus } from '@/types';
import { Role } from '@/types/role';

interface UpdateUserProps {
  closeShowUpdateModal: Dispatch<SetStateAction<boolean>>;
  form: UserFormData;
  setForm: Dispatch<SetStateAction<UserFormData>>;
  errors: UserFormErrors;
  handleUpdate: () => void;
  loading: boolean;
  roles: Role[];
}

const UpdateUser: FC<UpdateUserProps> = ({
  closeShowUpdateModal,
  form,
  setForm,
  errors,
  handleUpdate,
  loading,
  roles,
}) => {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
      onClick={() => closeShowUpdateModal(false)}
    >
      <div
        className="bg-slate-900 w-full max-w-lg rounded-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-5">Update User</h2>

        <div className="grid grid-cols-2 gap-4">
          <ModalInput
            label="First Name"
            value={form.first_name}
            onChange={(val) => setForm({ ...form, first_name: val })}
            error={errors.first_name}
          />

          <ModalInput
            label="Last Name"
            value={form.last_name}
            onChange={(val) => setForm({ ...form, last_name: val })}
            error={errors.last_name}
          />

          <ModalInput
            label="Email"
            value={form.email}
            onChange={(val) => setForm({ ...form, email: val })}
            error={errors.email}
          />

          <ModalInput
            label="Mobile"
            value={form.mobile}
            onChange={(val) => setForm({ ...form, mobile: val })}
            error={errors.mobile}
          />
        </div>

        <div className="mt-4">
          <ModalInput
            label="Username"
            value={form.username}
            onChange={(val) => setForm({ ...form, username: val })}
            error={errors.username}
          />
        </div>

        <div className="mt-4">
          <label className="text-sm block mb-1">Role</label>
          <select
            className="w-full px-3 py-2 bg-slate-800 rounded"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
          >
            <option value="">Select Role</option>
            {roles.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
          {errors.role && <p className="text-red-400 text-xs mt-1">{errors.role}</p>}
        </div>

        <div className="mt-4">
          <label className="text-sm block mb-1">User Status</label>
          <select
            className="w-full px-3 py-2 bg-slate-800 rounded"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as UserStatus })}
          >
            {['ACTIVE', 'INACTIVE'].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => closeShowUpdateModal(false)}>Cancel</button>

          <button
            onClick={handleUpdate}
            className="bg-blue-600 px-5 py-2 rounded text-white"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateUser;
