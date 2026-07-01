import { useEffect, useState, useRef, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MoreVertical, Search, Trash2 } from 'lucide-react';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import Pagination from '@/components/Pagination';
import AdminOnly from '@/components/AdminOnly';
import apiService from '@/services/api';
import type { ApiError, PaginatedData } from '@/types';
import {
  type CustomTrigger,
  type CustomTriggerFilters,
  CUSTOM_TRIGGER_STATUS_OPTIONS,
  CUSTOM_TRIGGER_EVENT_OPTIONS,
  CUSTOM_TRIGGER_TAG_OPTIONS,
} from '@/types/customTrigger.types';

const formatDate = (value?: string | null): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}\n${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} UTC`;
};

const StatusBadge: FC<{ status: CustomTrigger['status'] }> = ({ status }) => {
  const map: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    INACTIVE: 'bg-red-500/20 text-red-300 border border-red-500/40',
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs capitalize ${
        map[status] ?? map.INACTIVE
      }`}
    >
      {status.toLowerCase()}
    </span>
  );
};

const defaultFilters: CustomTriggerFilters = {
  search: '',
  trigger: '',
  status: '',
  tag: '',
};

const CustomTriggerTableList: FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CustomTrigger[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<CustomTriggerFilters>(defaultFilters);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const getItems = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<PaginatedData<CustomTrigger>>(
        '/custom-triggers/paginate',
        {
          page,
          limit,
          archived: false,
          search: filters.search || undefined,
          trigger: filters.trigger || undefined,
          status: filters.status || undefined,
          tag: filters.tag || undefined,
        }
      );
      if (response?.success && response?.data) {
        setItems(response.data.data);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Get custom triggers error:', err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applyFilters = () => {
    setPage(1);
    getItems();
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
    setTimeout(() => getItems(), 0);
  };

  const handleArchive = async (id: string) => {
    try {
      const response = await apiService.post(`/custom-triggers/archive/${id}`);
      if (response?.success) {
        toast.success(response.message || 'Custom trigger archived');
        getItems();
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to archive custom trigger');
    } finally {
      setOpenMenu(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiService.delete(`/custom-triggers/${id}`);
      if (response?.success) {
        toast.success(response.message || 'Custom trigger deleted');
        getItems();
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to delete custom trigger');
    } finally {
      setOpenMenu(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 w-full">
        <div className="flex justify-between items-center mb-6">
          <PageHeaderBreadcrumb
            title="Custom Triggers"
            items={[
              { label: 'Home', clickable: true },
              { label: 'CRM' },
              { label: 'Custom Triggers' },
            ]}
          />

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/crm/custom-triggers/archive')}
              className="px-4 py-2 rounded-full border border-amber-500 text-amber-400 text-sm hover:bg-amber-500/10"
            >
              Archive
            </button>
            <AdminOnly>
              <button
                onClick={() => navigate('/crm/custom-triggers/create')}
                className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Create Custom Triggers
              </button>
            </AdminOnly>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-md p-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Search</label>
              <div className="relative">
                <input
                  className="w-full pl-3 pr-9 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                />
                <Search
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Trigger</label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                value={filters.trigger}
                onChange={(e) => setFilters({ ...filters, trigger: e.target.value })}
              >
                <option value="">All Triggers</option>
                {CUSTOM_TRIGGER_EVENT_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Status</label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                {CUSTOM_TRIGGER_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Tags</label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                value={filters.tag}
                onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
              >
                <option value="">All Tags</option>
                {CUSTOM_TRIGGER_TAG_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="bg-blue-600 px-4 py-2 rounded text-white text-sm"
              >
                Apply
              </button>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-4 py-2 rounded text-red-400 text-sm hover:bg-red-500/10"
              >
                <Trash2 size={14} /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-700 rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Trigger</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-left">Created Date</th>
                <th className="p-3 text-left">Created By</th>
                <th className="p-3 text-left">Tags</th>
                <th className="p-3 text-left" />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    Loading custom triggers...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400">
                    <p className="font-semibold text-slate-300">No results found.</p>
                    <p className="text-xs mt-1">
                      What you searched for was unfortunately not found. Please try another
                      combination.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c.id} className="border-t border-slate-700 hover:bg-slate-800/40">
                    <td className="p-3">
                      <button
                        onClick={() => navigate(`/crm/custom-triggers/create?id=${c.id}`)}
                        className="font-medium text-blue-300 underline"
                      >
                        {c.name}
                      </button>
                    </td>
                    <td className="p-3">{c.trigger || '-'}</td>
                    <td className="p-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="p-3 text-slate-300 max-w-xs truncate">{c.description || '-'}</td>
                    <td className="p-3 whitespace-pre-line text-xs">{formatDate(c.created_at)}</td>
                    <td className="p-3">{c.created_by || '-'}</td>
                    <td className="p-3">
                      {c.tags && c.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {c.tags.map((tg) => (
                            <span
                              key={tg}
                              className="px-2 py-0.5 rounded-full text-[11px] bg-slate-700 text-slate-200"
                            >
                              {tg}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3 relative">
                      <AdminOnly
                        fallback={
                          <span className="block text-right text-xs text-slate-500">View only</span>
                        }
                      >
                        <button
                          onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                          className="p-1 rounded hover:bg-slate-700"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenu === c.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-6 top-8 z-10 w-36 bg-slate-800 border border-slate-700 rounded shadow-lg text-sm"
                          >
                            <button
                              className="block w-full text-left px-3 py-2 hover:bg-slate-700"
                              onClick={() => {
                                setOpenMenu(null);
                                navigate(`/crm/custom-triggers/create?id=${c.id}`);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="block w-full text-left px-3 py-2 hover:bg-slate-700"
                              onClick={() => handleArchive(c.id)}
                            >
                              Archive
                            </button>
                            <button
                              className="block w-full text-left px-3 py-2 text-red-400 hover:bg-slate-700"
                              onClick={() => handleDelete(c.id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </AdminOnly>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </DashboardLayout>
  );
};

export default CustomTriggerTableList;
