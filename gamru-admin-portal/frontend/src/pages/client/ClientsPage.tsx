import { useEffect, useMemo, useState, type FC } from 'react';
import { toast } from 'react-toastify';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import Pagination from '@/components/Pagination';
import { DeleteRecord } from '@/components/DeleteRecord';
import AdminOnly from '@/components/AdminOnly';
import ClientFormModal from '@/components/modals/client/ClientFormModal';
import { clientsApi } from '@/services/clients.api';
import type { Client, ClientErrors, ClientForm, ClientStatus } from '@/types/client.types';
import type { ApiError } from '@/types';

const defaultForm: ClientForm = {
  id: '',
  name: '',
  slug: '',
  skin_id: '',
  description: '',
  contact_email: '',
  contact_phone: '',
  webhook_url: '',
  timezone: 'UTC',
  status: 'ENABLED',
};

const PAGE_SIZE = 10;

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const StatusBadge: FC<{ status: ClientStatus }> = ({ status }) => (
  <span
    className={`px-2 py-0.5 text-[11px] font-bold tracking-wide rounded-full ${
      status === 'ENABLED' ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'
    }`}
  >
    {status}
  </span>
);

const truncate = (text: string, n = 18): string =>
  text.length > n ? `${text.slice(0, n)}…` : text;

const CopyButton: FC<{ value: string; title?: string }> = ({ value, title }) => (
  <button
    type="button"
    title={title || 'Copy'}
    onClick={async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(value);
        toast.success('Copied to clipboard');
      } catch {
        toast.error('Copy failed');
      }
    }}
    className="text-slate-400 hover:text-blue-400"
    aria-label="Copy"
  >
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  </button>
);

const ClientsPage: FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | ''>('');
  const [showFilter, setShowFilter] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState<ClientForm>(defaultForm);
  const [errors, setErrors] = useState<ClientErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = async () => {
    try {
      setLoadingList(true);
      const response = await clientsApi.list({
        page,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      });
      if (response?.success && response?.data) {
        setClients(response.data.data);
        setTotalPages(response.data.pagination.totalPages || 1);
        setTotal(response.data.pagination.total || 0);
      }
    } catch (e) {
      const err = e as ApiError;
      toast.error(err?.message || 'Failed to load clients');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const validate = (): ClientErrors => {
    const err: ClientErrors = {};
    if (!form.name.trim()) err.name = 'Name is required';
    if (!form.slug.trim()) err.slug = 'Slug is required';
    else if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(form.slug.trim()))
      err.slug = 'Lowercase letters, digits and hyphens only';
    if (form.contact_email && !/^\S+@\S+\.\S+$/.test(form.contact_email))
      err.contact_email = 'Invalid email';
    if (form.webhook_url && !/^https?:\/\//i.test(form.webhook_url))
      err.webhook_url = 'Must start with http(s)://';
    return err;
  };

  const openCreate = () => {
    setForm(defaultForm);
    setErrors({});
    setModalMode('create');
  };

  const openEdit = (client: Client) => {
    setForm({
      id: client.id,
      name: client.name,
      slug: client.slug,
      skin_id: client.skin_id,
      description: client.description || '',
      contact_email: client.contact_email || '',
      contact_phone: client.contact_phone || '',
      webhook_url: client.webhook_url || '',
      timezone: client.timezone || 'UTC',
      status: client.status,
    });
    setErrors({});
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setForm(defaultForm);
    setErrors({});
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);

    try {
      setSubmitting(true);
      if (modalMode === 'create') {
        const r = await clientsApi.create(form);
        if (r?.success) toast.success(r?.message || 'Client created');
      } else if (modalMode === 'edit' && form.id) {
        const r = await clientsApi.update(form.id, form);
        if (r?.success) toast.success(r?.message || 'Client updated');
      }
      closeModal();
      fetchClients();
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRotateKey = async (client: Client) => {
    try {
      const r = await clientsApi.rotateAuthKey(client.id);
      if (r?.success) {
        toast.success('Auth key rotated');
        fetchClients();
      }
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr?.message || 'Failed to rotate key');
    }
  };

  const handleToggleStatus = async (client: Client) => {
    try {
      const r = await clientsApi.toggleStatus(client.id);
      if (r?.success) {
        toast.success(`Client ${r.data?.status === 'ENABLED' ? 'enabled' : 'disabled'}`);
        fetchClients();
      }
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr?.message || 'Failed to update status');
    }
  };

  const handleDelete = (client: Client) => {
    DeleteRecord({
      endpoint: `/clients/${client.id}`,
      successMessage: `Client "${client.name}" deleted`,
      onSuccess: fetchClients,
    });
  };

  const handleDownload = () => {
    if (!clients.length) {
      toast.info('Nothing to download');
      return;
    }
    const headers = [
      'Name',
      'Slug',
      'Skin ID',
      'Auth Key',
      'Status',
      'Timezone',
      'Contact Email',
      'Created',
    ];
    const escape = (v: unknown) => {
      const s = String(v ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = clients.map((c) =>
      [
        c.name,
        c.slug,
        c.skin_id,
        c.auth_key,
        c.status,
        c.timezone,
        c.contact_email || '',
        c.created_at,
      ]
        .map(escape)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSearch = () => {
    if (page === 1) fetchClients();
    else setPage(1);
  };

  const handleReset = () => {
    setSearch('');
    setStatusFilter('');
    setShowFilter(false);
    if (page === 1) fetchClients();
    else setPage(1);
  };

  const startEntry = useMemo(() => (total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1), [page, total]);
  const endEntry = useMemo(() => Math.min(page * PAGE_SIZE, total), [page, total]);

  return (
    <DashboardLayout>
      <div className="px-4 w-full">
        <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
          <PageHeaderBreadcrumb
            title="Clients"
            items={[
              { label: 'Home', clickable: true },
              { label: 'Configurations' },
              { label: 'Clients' },
            ]}
          />
        </div>

        {/* Filter / Search bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => setShowFilter((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filter
          </button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <AdminOnly>
              <button
                type="button"
                onClick={openCreate}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white text-sm font-semibold flex items-center gap-2"
              >
                <span className="text-lg leading-none">+</span> Add Client
              </button>
            </AdminOnly>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search"
              className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-slate-200 w-56"
            />

            <button
              type="button"
              onClick={handleSearch}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold"
            >
              Search
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded border border-slate-600 text-slate-200 hover:bg-slate-800 text-sm font-semibold"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center gap-2"
              title="Download current page as CSV"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </button>
          </div>
        </div>

        {showFilter && (
          <div className="bg-slate-800/50 border border-slate-700 rounded p-3 mb-4 flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-300">
              Status
              <select
                className="ml-2 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ClientStatus | '')}
              >
                <option value="">All</option>
                <option value="ENABLED">ENABLED</option>
                <option value="DISABLED">DISABLED</option>
              </select>
            </label>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto border border-slate-700 rounded-md bg-slate-900/40">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/70 text-slate-300">
              <tr>
                <th className="p-3 text-left font-semibold">Name</th>
                <th className="p-3 text-left font-semibold">Slug</th>
                <th className="p-3 text-left font-semibold">Skin ID</th>
                <th className="p-3 text-left font-semibold">Auth Key</th>
                <th className="p-3 text-left font-semibold">Status</th>
                <th className="p-3 text-left font-semibold">Last Seen</th>
                <th className="p-3 text-left font-semibold">Created</th>
                <th className="p-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loadingList ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    No clients found
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id} className="border-t border-slate-700 hover:bg-slate-800/40">
                    <td className="p-3 text-white font-medium">{c.name}</td>
                    <td className="p-3 text-slate-300">
                      <code className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 text-xs">
                        {c.slug}
                      </code>
                    </td>
                    <td className="p-3 text-slate-300">
                      <span className="inline-flex items-center gap-1.5">
                        {c.skin_id}
                        <CopyButton value={c.skin_id} title="Copy Skin ID" />
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                        {truncate(c.auth_key, 22)}
                        <CopyButton value={c.auth_key} title="Copy Auth Key" />
                      </span>
                    </td>
                    <td className="p-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="p-3 text-slate-400">{formatDate(c.last_seen_at)}</td>
                    <td className="p-3 text-slate-400">{formatDate(c.created_at)}</td>
                    <td className="p-3">
                      <AdminOnly
                        fallback={
                          <span className="block text-right text-xs text-slate-500">View only</span>
                        }
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            title="Rotate auth key"
                            onClick={() => handleRotateKey(c)}
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-blue-400"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="23 4 23 10 17 10" />
                              <polyline points="1 20 1 14 7 14" />
                              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            title={c.status === 'ENABLED' ? 'Disable client' : 'Enable client'}
                            onClick={() => handleToggleStatus(c)}
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-blue-400"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            title="Edit client"
                            onClick={() => openEdit(c)}
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-blue-400"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            title="Delete client"
                            onClick={() => handleDelete(c)}
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-red-400"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                            </svg>
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

        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-sm text-slate-400">
          <div>
            Showing <span className="text-white font-semibold">{startEntry}</span> -{' '}
            <span className="text-white font-semibold">{endEntry}</span> of{' '}
            <span className="text-white font-semibold">{total}</span> entries
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        <ClientFormModal
          mode={modalMode === 'edit' ? 'edit' : 'create'}
          open={modalMode !== null}
          form={form}
          setForm={setForm}
          errors={errors}
          loading={submitting}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      </div>
    </DashboardLayout>
  );
};

export default ClientsPage;
