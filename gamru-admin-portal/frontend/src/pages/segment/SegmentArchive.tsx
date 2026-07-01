import { useEffect, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { History, Search, Users } from 'lucide-react';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import Pagination from '@/components/Pagination';
import apiService from '@/services/api';
import type { ApiError, PaginatedData } from '@/types';
import {
  type Segment,
  SEGMENT_TYPE_FILTER_OPTIONS,
  SEGMENT_TAG_OPTIONS,
} from '@/types/segment.types';

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

const SegmentArchive: FC = () => {
  const navigate = useNavigate();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [tag, setTag] = useState('');

  const getArchived = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<PaginatedData<Segment>>('/segments/paginate', {
        page,
        limit,
        archived: true,
        search: search || undefined,
        type: type || undefined,
        tag: tag || undefined,
      });
      if (response?.success && response?.data) {
        setSegments(response.data.data);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Get archived segments error:', err as ApiError);
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
      const response = await apiService.post(`/segments/restore/${id}`);
      if (response?.success) {
        toast.success(response.message || 'Segment restored');
        getArchived();
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to restore segment');
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 w-full">
        <div className="flex justify-between items-center mb-6">
          <PageHeaderBreadcrumb
            title="Segments Archive"
            items={[
              { label: 'Home', clickable: true },
              { label: 'CRM' },
              { label: 'Segments' },
              { label: 'Archive' },
            ]}
          />
          <button
            onClick={() => navigate('/crm/segments')}
            className="px-4 py-2 rounded-full border border-slate-600 text-slate-300 text-sm hover:bg-slate-700"
          >
            Back to Segments
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
              <label className="text-xs text-slate-400 block mb-1">Types</label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {SEGMENT_TYPE_FILTER_OPTIONS.map((o) => (
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
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              >
                <option value="">All Tags</option>
                {SEGMENT_TAG_OPTIONS.map((t) => (
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
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Created Date</th>
                <th className="p-3 text-left">Created By</th>
                <th className="p-3 text-left">Last Segment Count</th>
                <th className="p-3 text-left">Tags</th>
                <th className="p-3 text-left" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : segments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    No archived segments
                  </td>
                </tr>
              ) : (
                segments.map((s) => (
                  <tr key={s.id} className="border-t border-slate-700 hover:bg-slate-800/40">
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3 text-slate-300 max-w-xs">{s.description || '-'}</td>
                    <td className="p-3 capitalize">{s.type.toLowerCase()}</td>
                    <td className="p-3 whitespace-pre-line text-xs">{formatDate(s.created_at)}</td>
                    <td className="p-3">{s.created_by || '-'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/20 text-blue-300">
                          <Users size={14} />
                        </span>
                        <div>
                          <div className="font-medium">{s.player_count ?? 0} players</div>
                          <div className="text-[11px] text-slate-400 whitespace-pre-line">
                            {formatDate(s.last_counted_at)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      {s.tags && s.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {s.tags.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-full text-[11px] bg-slate-700 text-slate-200"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        title="Restore"
                        onClick={() => handleRestore(s.id)}
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

export default SegmentArchive;
