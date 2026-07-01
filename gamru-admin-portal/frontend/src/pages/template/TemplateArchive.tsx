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
  type Template,
  type TemplateChannel,
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

const TemplateArchive: FC = () => {
  const navigate = useNavigate();
  const [channel, setChannel] = useState<TemplateChannel>('EMAIL');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState('');
  const [tag, setTag] = useState('');

  const getArchived = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<PaginatedData<Template>>('/templates/paginate', {
        page,
        limit,
        archived: true,
        channel,
        search: search || undefined,
        language: language || undefined,
        tag: tag || undefined,
      });
      if (response?.success && response?.data) {
        setTemplates(response.data.data);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Get archived templates error:', err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getArchived();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, channel]);

  const handleRestore = async (id: string) => {
    try {
      const response = await apiService.post(`/templates/restore/${id}`);
      if (response?.success) {
        toast.success(response.message || 'Template restored');
        getArchived();
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to restore template');
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <PageHeaderBreadcrumb
            title="Templates Archive"
            items={[
              { label: 'Home', clickable: true },
              { label: 'CRM' },
              { label: 'Templates' },
              { label: 'Archive' },
            ]}
          />
          <button
            onClick={() => navigate('/crm/templates')}
            className="px-4 py-2 rounded-full border border-slate-600 text-slate-300 text-sm hover:bg-slate-700"
          >
            Back to Templates
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {TEMPLATE_CHANNELS.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                setChannel(c.value);
                setPage(1);
              }}
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
              <label className="text-xs text-slate-400 block mb-1">Languages</label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
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
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              >
                <option value="">All Tags</option>
                {TEMPLATE_TAG_OPTIONS.map((t) => (
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
                    Loading...
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No archived templates
                  </td>
                </tr>
              ) : (
                templates.map((t) => (
                  <tr key={t.id} className="border-t border-slate-700 hover:bg-slate-800/40">
                    <td className="p-3 font-medium">{t.name}</td>
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
                    <td className="p-3">
                      <button
                        title="Restore"
                        onClick={() => handleRestore(t.id)}
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

export default TemplateArchive;
