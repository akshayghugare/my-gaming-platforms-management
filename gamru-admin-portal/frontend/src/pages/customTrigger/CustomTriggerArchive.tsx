import { useEffect, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { History, Search } from 'lucide-react';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import Pagination from '@/components/Pagination';
import apiService from '@/services/api';
import type { ApiError, PaginatedData } from '@/types';
import {
  type CustomTrigger,
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

const CustomTriggerArchive: FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CustomTrigger[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [trigger, setTrigger] = useState('');
  const [tag, setTag] = useState('');

  const getArchived = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<PaginatedData<CustomTrigger>>(
        '/custom-triggers/paginate',
        {
          page,
          limit,
          archived: true,
          search: search || undefined,
          trigger: trigger || undefined,
          tag: tag || undefined,
        }
      );
      if (response?.success && response?.data) {
        setItems(response.data.data);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Get archived custom triggers error:', err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getArchived();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleRestore = async (id: string) => {
    try {
      const response = await apiService.post(`/custom-triggers/restore/${id}`);
      if (response?.success) {
        toast.success(response.message || 'Custom trigger restored');
        getArchived();
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to restore custom trigger');
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 w-full">
        <div className="flex justify-between items-center mb-6">
          <PageHeaderBreadcrumb
            title="Custom Triggers Archive"
            items={[
              { label: 'Home', clickable: true },
              { label: 'CRM' },
              { label: 'Custom Triggers' },
              { label: 'Archive' },
            ]}
          />
          <button
            onClick={() => navigate('/crm/custom-triggers')}
            className="px-4 py-2 rounded-full border border-slate-600 text-slate-300 text-sm hover:bg-slate-700"
          >
            Back to Custom Triggers
          </button>
        </div>

        <div className="bg-slate-800/40 border border-slate-700 rounded-md p-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Search</label>
              <div className="relative">
                <input
                  className="w-full pl-3 pr-9 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (setPage(1), getArchived())}
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
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
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
              <label className="text-xs text-slate-400 block mb-1">Tags</label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              >
                <option value="">All Tags</option>
                {CUSTOM_TRIGGER_TAG_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setPage(1);
                getArchived();
              }}
              className="bg-blue-600 px-4 py-2 rounded text-white text-sm h-[38px]"
            >
              Apply
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-700 rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-amber-700/80 text-white">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Trigger</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-left">Created Date</th>
                <th className="p-3 text-left">Created By</th>
                <th className="p-3 text-left" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No archived custom triggers
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c.id} className="border-t border-slate-700 hover:bg-slate-800/40">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3">{c.trigger || '-'}</td>
                    <td className="p-3 capitalize">{c.status.toLowerCase()}</td>
                    <td className="p-3 text-slate-300 max-w-xs truncate">{c.description || '-'}</td>
                    <td className="p-3 whitespace-pre-line text-xs">{formatDate(c.created_at)}</td>
                    <td className="p-3">{c.created_by || '-'}</td>
                    <td className="p-3">
                      <button
                        title="Restore"
                        onClick={() => handleRestore(c.id)}
                        className="p-2 rounded hover:bg-slate-700 text-slate-300"
                      >
                        <History size={16} />
                      </button>
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

export default CustomTriggerArchive;
