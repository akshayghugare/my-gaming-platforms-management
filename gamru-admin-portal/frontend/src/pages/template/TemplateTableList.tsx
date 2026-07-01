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
  type Template,
  type TemplateChannel,
  type TemplateFilters,
  TEMPLATE_CHANNELS,
  TEMPLATE_LANGUAGE_OPTIONS,
  TEMPLATE_TAG_OPTIONS,
} from '@/types/template.types';

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

const defaultFilters: TemplateFilters = {
  search: '',
  language: '',
  tag: '',
};

const TemplateTableList: FC = () => {
  const navigate = useNavigate();
  const [channel, setChannel] = useState<TemplateChannel>('EMAIL');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TemplateFilters>(defaultFilters);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const getTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<PaginatedData<Template>>('/templates/paginate', {
        page,
        limit,
        archived: false,
        channel,
        search: filters.search || undefined,
        language: filters.language || undefined,
        tag: filters.tag || undefined,
      });
      if (response?.success && response?.data) {
        setTemplates(response.data.data);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Get templates error:', err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, channel]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchChannel = (c: TemplateChannel) => {
    setChannel(c);
    setPage(1);
  };

  const applyFilters = () => {
    setPage(1);
    getTemplates();
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
    setTimeout(() => getTemplates(), 0);
  };

  const handleArchive = async (id: string) => {
    try {
      const response = await apiService.post(`/templates/archive/${id}`);
      if (response?.success) {
        toast.success(response.message || 'Template archived');
        getTemplates();
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to archive template');
    } finally {
      setOpenMenu(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiService.delete(`/templates/${id}`);
      if (response?.success) {
        toast.success(response.message || 'Template deleted');
        getTemplates();
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to delete template');
    } finally {
      setOpenMenu(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <PageHeaderBreadcrumb
            title="Templates"
            items={[{ label: 'Home', clickable: true }, { label: 'CRM' }, { label: 'Templates' }]}
          />

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/crm/templates/archive')}
              className="px-4 py-2 rounded-full border border-amber-500 text-amber-400 text-sm hover:bg-amber-500/10"
            >
              Archive
            </button>
            <AdminOnly>
              <button
                onClick={() => navigate(`/crm/templates/create?channel=${channel}`)}
                className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Create Template
              </button>
            </AdminOnly>
          </div>
        </div>

        {/* Channel tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {TEMPLATE_CHANNELS.map((c) => (
            <button
              key={c.value}
              onClick={() => switchChannel(c.value)}
              className={`px-4 py-1.5 rounded-full text-sm transition ${
                channel === c.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-md p-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
              <label className="text-xs text-slate-400 block mb-1">Languages</label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                value={filters.language}
                onChange={(e) => setFilters({ ...filters, language: e.target.value })}
              >
                <option value="">All Languages</option>
                {TEMPLATE_LANGUAGE_OPTIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
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
                {TEMPLATE_TAG_OPTIONS.map((t) => (
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
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-left">Language</th>
                <th className="p-3 text-left">Created Date</th>
                <th className="p-3 text-left">Created By</th>
                <th className="p-3 text-left">Tags</th>
                <th className="p-3 text-left" />
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    Loading templates...
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    <p className="font-semibold text-slate-300">No results found.</p>
                    <p className="text-xs mt-1">
                      What you searched for was unfortunately not found. Please try another
                      combination.
                    </p>
                  </td>
                </tr>
              ) : (
                templates.map((t) => (
                  <tr key={t.id} className="border-t border-slate-700 hover:bg-slate-800/40">
                    <td className="p-3">
                      <button
                        onClick={() => navigate(`/crm/templates/create?id=${t.id}`)}
                        className="font-medium text-blue-300 underline"
                      >
                        {t.name}
                      </button>
                    </td>
                    <td className="p-3 text-slate-300 max-w-xs truncate">{t.description || '-'}</td>
                    <td className="p-3">{t.language || '-'}</td>
                    <td className="p-3 whitespace-pre-line text-xs">{formatDate(t.created_at)}</td>
                    <td className="p-3">{t.created_by || '-'}</td>
                    <td className="p-3">
                      {t.tags && t.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {t.tags.map((tg) => (
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
                          onClick={() => setOpenMenu(openMenu === t.id ? null : t.id)}
                          className="p-1 rounded hover:bg-slate-700"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenu === t.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-6 top-8 z-10 w-36 bg-slate-800 border border-slate-700 rounded shadow-lg text-sm"
                          >
                            <button
                              className="block w-full text-left px-3 py-2 hover:bg-slate-700"
                              onClick={() => {
                                setOpenMenu(null);
                                navigate(`/crm/templates/create?id=${t.id}`);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="block w-full text-left px-3 py-2 hover:bg-slate-700"
                              onClick={() => handleArchive(t.id)}
                            >
                              Archive
                            </button>
                            <button
                              className="block w-full text-left px-3 py-2 text-red-400 hover:bg-slate-700"
                              onClick={() => handleDelete(t.id)}
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

export default TemplateTableList;
