import { useEffect, useState, type FC } from 'react';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import apiService from '@/services/api';
import Pagination from '@/components/Pagination';
import { toast } from 'react-toastify';

import type { Role, RoleForm, RoleErrors } from '@/types/role';
import CreateRole from '@/components/modals/role/CreateRole';
import UpdateRole from '@/components/modals/role/UpdateRole';
import { ApiError } from '@/types';
import { DeleteRecord } from '@/components/DeleteRecord';
import AdminOnly from '@/components/AdminOnly';

interface PaginatedData<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const defaultForm: RoleForm = {
  id: '',
  name: '',
  description: '',
  status: 'ACTIVE',
};

const RoleTableList: FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState<RoleForm>(defaultForm);
  const [errors, setErrors] = useState<RoleErrors>({});
  const [loading, setLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

  const openCreateModal = () => {
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setForm(defaultForm);
    setErrors({});
  };

  const validate = (): RoleErrors => {
    const err: RoleErrors = {};
    if (!form.name) err.name = 'Required';
    return err;
  };

  const getRoles = async () => {
    try {
      const response = await apiService.get<PaginatedData<Role>>('/roles/paginate', {
        page,
        limit,
      });
      console.log('Get Roles response:', response);
      if (response?.success && response?.data) {
        setRoles(response?.data?.data);
        setTotalPages(response?.data?.pagination?.totalPages);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async () => {
    const err = validate();
    if (Object.keys(err).length) return setErrors(err);

    try {
      setLoading(true);

      const response = await apiService.post('/roles/add', {
        name: form.name,
        description: form.description,
      });
      console.log('Create Role response:', response);
      if (response?.success) {
        toast.success(response?.message || 'Role created successfully');
        getRoles();
        closeCreateModal();
      } else {
        closeCreateModal();
      }
    } catch (err) {
      const apiErr = err as ApiError;
      console.log('Create Role error:', apiErr);
      toast.error(apiErr.message || 'Failed to create role');
    } finally {
      setLoading(false);
      closeCreateModal();
    }
  };

  const handleUpdate = async () => {
    const err = validate();
    if (Object.keys(err).length) return setErrors(err);

    if (!form.id) return;

    try {
      setLoading(true);

      const response = await apiService.post(`/roles/update-by/${form.id}`, {
        name: form.name,
        description: form.description,
        status: form.status,
      });
      console.log('Update Role response:', response);
      if (response?.success) {
        toast.success(response?.message || 'Role updated successfully');
        getRoles();
      }
    } catch (err) {
      const apiErr = err as ApiError;
      console.log('Update Role error:', apiErr);
      toast.error(apiErr.message || 'Failed to update role');
    } finally {
      setLoading(false);
      setShowUpdate(false);
      setForm(defaultForm);
      setErrors({});
    }
  };

  const handleDelete = (id: string | number): void => {
    DeleteRecord({
      endpoint: `/roles/${id}`,
      successMessage: 'Role deleted',
      onSuccess: getRoles,
    });
  };

  useEffect(() => {
    getRoles();
  }, [page]);

  const filteredRoles = roles.filter((r) =>
    `${r.name} ${r.description ?? ''}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="px-4 w-full">
        <div className="flex justify-between items-center mb-6">
          <PageHeaderBreadcrumb
            title="Role Management"
            items={[{ label: 'Home', clickable: true }, { label: 'Settings' }, { label: 'Roles' }]}
          />

          <AdminOnly>
            <button
              onClick={() => openCreateModal()}
              className="bg-blue-600 px-4 py-2 rounded text-white"
            >
              + Create New Role
            </button>
          </AdminOnly>
        </div>

        <input
          placeholder="Search role..."
          className="w-72 px-4 py-2 rounded bg-slate-800 border border-slate-700 mb-5"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="overflow-x-auto border border-slate-700 rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No data found
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr key={role?.id} className="border-t border-slate-700">
                    <td className="p-3">{role?.name}</td>
                    <td className="p-3">{role?.description}</td>
                    <td className="p-3">{role?.status}</td>
                    <td className="p-3">
                      <AdminOnly
                        fallback={
                          <span className="block text-right text-xs text-slate-500">View only</span>
                        }
                      >
                        <div className="flex gap-2">
                          <button
                            className="bg-blue-600 px-2 py-1 rounded text-xs"
                            onClick={() => {
                              setForm({
                                id: role?.id,
                                name: role?.name,
                                description: role?.description || '',
                                status: role?.status,
                              });
                              setShowUpdate(true);
                            }}
                          >
                            Edit
                          </button>

                          <button
                            className="bg-red-600 px-2 py-1 rounded text-xs"
                            onClick={() => handleDelete(role?.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </AdminOnly>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {showCreateModal && (
          <CreateRole
            form={form}
            setForm={setForm}
            errors={errors}
            onSave={handleCreate}
            loading={loading}
            closeCreateModal={closeCreateModal}
          />
        )}

        {showUpdate && (
          <UpdateRole
            setShow={setShowUpdate}
            form={form}
            setForm={setForm}
            errors={errors}
            onUpdate={handleUpdate}
            loading={loading}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default RoleTableList;
