import { useEffect, useState, useRef, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MoreVertical, Search } from 'lucide-react';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import Pagination from '@/components/Pagination';
import AdminOnly from '@/components/AdminOnly';
import apiService from '@/services/api';
import type { ApiError, PaginatedData } from '@/types';
import {
  type Campaign,
  type CampaignFilters,
  CAMPAIGN_STATUS_OPTIONS,
  CAMPAIGN_TRIGGER_OPTIONS,
  CAMPAIGN_TAG_OPTIONS,
} from '@/types/campaign.types';

const formatDate = (value?: string | null): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}\n${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
};

const StatusBadge: FC<{ status: Campaign['status'] }> = ({ status }) => {
  const map: Record<string, string> = {
    SENT: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
    IN_DESIGN: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40',
    SCHEDULED: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    PAUSED: 'bg-slate-500/20 text-slate-300 border border-slate-500/40',
    ARCHIVED: 'bg-slate-600/20 text-slate-400 border border-slate-600/40',
  };
  const label = status.replace('_', ' ').toLowerCase();
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs capitalize ${
        map[status] ?? map.PAUSED
      }`}
    >
      {label}
    </span>
  );
};

const defaultFilters: CampaignFilters = {
  search: '',
  status: '',
  trigger: '',
  tag: '',
};

const CampaignTableList: FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<CampaignFilters>(defaultFilters);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const getCampaigns = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<PaginatedData<Campaign>>('/campaigns/paginate', {
        page,
        limit,
        archived: false,
        search: filters.search || undefined,
        status: filters.status || undefined,
        trigger: filters.trigger || undefined,
        tag: filters.tag || undefined,
      });
      if (response?.success && response?.data) {
        setCampaigns(response.data.data);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      const apiErr = err as ApiError;
      console.error('Get campaigns error:', apiErr);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCampaigns();
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
    getCampaigns();
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
    setTimeout(() => getCampaigns(), 0);
  };

  const handleArchive = async (id: string) => {
    try {
      const response = await apiService.post(`/campaigns/archive/${id}`);
      if (response?.success) {
        toast.success(response.message || 'Campaign archived');
        getCampaigns();
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to archive campaign');
    } finally {
      setOpenMenu(null);
    }
  };

  const handleSend = async (id: string) => {
    setOpenMenu(null);
    try {
      const response = await apiService.post<{
        sent: number;
        suppressed: number;
        audience: number;
      }>(`/campaigns/send/${id}`);
      if (response?.success) {
        toast.success(response.message || 'Campaign sent');
        getCampaigns();
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to send campaign');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiService.delete(`/campaigns/${id}`);
      if (response?.success) {
        toast.success(response.message || 'Campaign deleted');
        getCampaigns();
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to delete campaign');
    } finally {
      setOpenMenu(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 w-full">
        <div className="flex justify-between items-center mb-6">
          <PageHeaderBreadcrumb
            title="Campaigns"
            items={[{ label: 'Home', clickable: true }, { label: 'CRM' }, { label: 'Campaign' }]}
          />

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/crm/campaigns/archive')}
              className="px-4 py-2 rounded-full border border-amber-500 text-amber-400 text-sm hover:bg-amber-500/10"
            >
              Archive
            </button>
            <AdminOnly>
              <button
                onClick={() => navigate('/crm/campaigns/create')}
                className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Create Campaign
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
              <label className="text-xs text-slate-400 block mb-1">Status</label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                {CAMPAIGN_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Triggers</label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                value={filters.trigger}
                onChange={(e) => setFilters({ ...filters, trigger: e.target.value })}
              >
                <option value="">All Triggers</option>
                {CAMPAIGN_TRIGGER_OPTIONS.map((o) => (
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
                {CAMPAIGN_TAG_OPTIONS.map((t) => (
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
                className="px-4 py-2 rounded text-red-400 text-sm hover:bg-red-500/10"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-700 rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Created Date</th>
                <th className="p-3 text-left">Start Date</th>
                <th className="p-3 text-left">End Date</th>
                <th className="p-3 text-left">Trigger</th>
                <th className="p-3 text-left">Segment</th>
                <th className="p-3 text-left">Created By</th>
                <th className="p-3 text-left" />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-400">
                    Loading campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-400">
                    No campaigns found
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="border-t border-slate-700 hover:bg-slate-800/40">
                    <td className="p-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="p-3 font-medium text-blue-300 underline">{c.name}</td>
                    <td className="p-3">{c.type}</td>
                    <td className="p-3 whitespace-pre-line text-xs">{formatDate(c.created_at)}</td>
                    <td className="p-3 whitespace-pre-line text-xs">{formatDate(c.start_date)}</td>
                    <td className="p-3 whitespace-pre-line text-xs">{formatDate(c.end_date)}</td>
                    <td className="p-3">{c.trigger || '-'}</td>
                    <td className="p-3 underline">{c.segment || '-'}</td>
                    <td className="p-3">{c.created_by || '-'}</td>
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
                                navigate(`/crm/campaigns/create?id=${c.id}`);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="block w-full text-left px-3 py-2 text-emerald-400 hover:bg-slate-700"
                              onClick={() => handleSend(c.id)}
                            >
                              Send now
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

export default CampaignTableList;
