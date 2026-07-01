import { useState, useEffect, type FC } from 'react';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import CreateNewUser from '@/components/modals/user/CreateNewUser';
import UpdateUser from '@/components/modals/user/UpdateUser';
import apiService from '@/services/api';
import Pagination from '@/components/Pagination';
import type {
  AddOrUpdateUserRequest,
  ApiError,
  PaginatedData,
  User,
  UserFormData,
  UserFormErrors,
} from '@/types';
import { toast } from 'react-toastify';
import { Role } from '@/types/role';
import { DeleteRecord } from '@/components/DeleteRecord';
import AdminOnly from '@/components/AdminOnly';

const defaultForm: UserFormData = {
  first_name: '',
  last_name: '',
  email: '',
  mobile: '',
  username: '',
  role: '',
  status: 'ACTIVE',
};

const UserTableList: FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [form, setForm] = useState<UserFormData>(defaultForm);
  const [errors, setErrors] = useState<UserFormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);

  const filteredUsers = users.filter((user) =>
    `${user?.first_name ?? ''} ${user?.last_name ?? ''} ${user?.email ?? ''} ${user?.username ?? ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const openCreateModal = (): void => {
    setShowCreateModal(true);
  };
  const closeCreateModal = (): void => {
    setShowCreateModal(false);
    setForm(defaultForm);
    setErrors({});
  };

  const openShowUpdateModal = (user: User): void => {
    setShowUpdateModal(true);
    setForm({
      id: user?.id,
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      mobile: user?.mobile || '',
      username: user?.username || '',
      role: user?.role || '',
      status: user?.status || 'ACTIVE',
    });
  };
  const closeShowUpdateModal = (): void => {
    setShowUpdateModal(false);
    setForm(defaultForm);
    setErrors({});
  };

  const validate = (): UserFormErrors => {
    const newErrors: UserFormErrors = {};
    if (!form?.first_name) newErrors.first_name = 'Required';
    if (!form?.last_name) newErrors.last_name = 'Required';
    if (!form?.email) newErrors.email = 'Required';
    if (!form?.mobile) newErrors.mobile = 'Required';
    if (!form?.username) newErrors.username = 'Required';
    if (!form?.role) newErrors.role = 'Required';
    return newErrors;
  };

  const getUsers = async (): Promise<void> => {
    try {
      const response = await apiService.get<PaginatedData<User>>('/users/paginate', {
        page,
        limit,
      });

      if (response?.success && response?.data) {
        setUsers(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (): Promise<void> => {
    const newErrors = validate();
    console.log('Validation Errors:', newErrors);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      const response = await apiService.post<AddOrUpdateUserRequest>('/users/add', {
        first_name: form?.first_name,
        last_name: form?.last_name,
        email: form?.email,
        mobile: form?.mobile,
        username: form?.username,
        role: form?.role,
        status: form?.status,
      });
      console.log('Create User response:', response);
      if (response?.success) {
        closeCreateModal();
        toast.success('User created successfully');
        getUsers();
      } else {
        console.error('Create User failed:', response);
        toast.error(response?.message || 'Failed to create user');
      }
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr?.errors) {
        setErrors(apiErr.errors);
      } else {
        console.log('apiErr:', apiErr);
        toast.error(apiErr?.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (): Promise<void> => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.post<AddOrUpdateUserRequest>(
        `/users/update-by/${form?.id}`,
        {
          first_name: form?.first_name,
          last_name: form?.last_name,
          email: form?.email,
          mobile: form?.mobile,
          username: form?.username,
          role: form?.role,
          status: form?.status,
        }
      );
      if (response?.success) {
        toast.success(response?.message || 'User updated successfully');
        getUsers();
        closeShowUpdateModal();
      } else {
        toast.error(response?.message || 'Failed to update user');
        closeShowUpdateModal();
      }
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr?.errors) {
        setErrors(apiErr.errors);
      } else {
        console.log('apiErr:', apiErr);
        toast.error(apiErr?.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string | number): void => {
    DeleteRecord({
      endpoint: `/users/${id}`,
      successMessage: 'User deleted',
      onSuccess: getUsers,
    });
  };

  const getRoles = async (): Promise<void> => {
    try {
      const response = await apiService.get<PaginatedData<Role>>('/roles/paginate', {
        page: 1,
        limit: 100,
      });
      console.log('Get Roles response:', response);
      if (response?.success && response?.data) {
        setRoles(response?.data?.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getUsers();
    getRoles();
  }, [page, limit]);

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 w-full max-w-[1600px] mx-auto">
        <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
          <PageHeaderBreadcrumb
            title="User Management"
            items={[{ label: 'Home', clickable: true }, { label: 'Settings' }, { label: 'Users' }]}
          />

          <AdminOnly>
            <button
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20"
            >
              + Create New User
            </button>
          </AdminOnly>
        </div>

        <div className="rounded-xl border border-slate-700 bg-[#162040] overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <div className="relative max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by name, email or username..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition-all focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-800 text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">
                    Mobile
                  </th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">
                    Username
                  </th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold uppercase tracking-wide text-xs">
                    Role
                  </th>
                  <th className="px-4 py-3 text-right font-semibold uppercase tracking-wide text-xs">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user?.id}
                      className="border-t border-slate-700/60 hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-200 font-medium">
                        {user?.first_name} {user?.last_name}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{user?.email}</td>
                      <td className="px-4 py-3 text-slate-300">{user?.mobile}</td>
                      <td className="px-4 py-3 text-slate-300">{user?.username}</td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            user?.status === 'ACTIVE'
                              ? 'bg-green-500/15 text-green-400'
                              : 'bg-red-500/15 text-red-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user?.status === 'ACTIVE' ? 'bg-green-400' : 'bg-red-400'
                            }`}
                          />
                          {user?.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-300">{user?.role}</td>

                      <td className="px-4 py-3">
                        <AdminOnly
                          fallback={
                            <span className="block text-right text-xs text-slate-500">
                              View only
                            </span>
                          }
                        >
                          <div className="flex gap-2 justify-end">
                            <button
                              className="bg-blue-600/90 hover:bg-blue-500 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                              onClick={() => {
                                openShowUpdateModal(user);
                              }}
                            >
                              Edit
                            </button>

                            <button
                              className="bg-red-600/90 hover:bg-red-500 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                              onClick={() => handleDelete(user?.id)}
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
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {showCreateModal && (
          <CreateNewUser
            closeCreateModal={closeCreateModal}
            form={form}
            setForm={setForm}
            errors={errors}
            handleSave={handleSave}
            loading={loading}
            roles={roles}
          />
        )}

        {showUpdateModal && (
          <UpdateUser
            closeShowUpdateModal={closeShowUpdateModal}
            form={form}
            setForm={setForm}
            errors={errors}
            handleUpdate={handleUpdate}
            loading={loading}
            roles={roles}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default UserTableList;
