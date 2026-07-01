import { useEffect, useState, type FC } from 'react';
import { Eye, Search } from 'lucide-react';
import apiService from '@/services/api';
import Pagination from '@/components/Pagination';
import type { ApiError, PaginatedData } from '@/types';
import {
  type CampaignAnalyticsRow,
  ANALYTICS_PERIOD_OPTIONS,
  ANALYTICS_STATUS_OPTIONS,
} from '@/types/analytics.types';
import { CAMPAIGN_TAG_OPTIONS } from '@/types/campaign.types';
import CampaignAnalyticsDetailModal from './CampaignAnalyticsDetailModal';

const StatusBadge: FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    SENT: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
    IN_DESIGN: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40',
    SCHEDULED: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    ACTIVE: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    PAUSED: 'bg-slate-500/20 text-slate-300 border border-slate-500/40',
    ARCHIVED: 'bg-slate-600/20 text-slate-400 border border-slate-600/40',
  };
  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs capitalize ${
        map[status] ?? map.PAUSED
      }`}
    >
      {status.replace('_', ' ').toLowerCase()}
    </span>
  );
};

type ColumnKey = 'email' | 'sms' | 'web_push' | 'onsite';

const COLUMN_GROUPS: { key: ColumnKey; label: string; hasParts?: boolean }[] = [
  { key: 'email', label: 'Email' },
  { key: 'sms', label: 'SMS', hasParts: true },
  { key: 'web_push', label: 'Web Push' },
  { key: 'onsite', label: 'On-site' },
];

const CampaignsAnalyticsTab: FC = () => {
  const [rows, setRows] = useState<CampaignAnalyticsRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [tag, setTag] = useState('');
  const [period, setPeriod] = useState('lifetime');

  const [visible, setVisible] = useState<Record<ColumnKey, boolean>>({
    email: true,
    sms: true,
    web_push: false,
    onsite: false,
  });
  const [showColsMenu, setShowColsMenu] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const visibleGroups = COLUMN_GROUPS.filter((g) => visible[g.key]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<PaginatedData<CampaignAnalyticsRow>>(
        '/analytics/campaigns',
        {
          page,
          limit,
          search: search || undefined,
          status: status || undefined,
          tag: tag || undefined,
          period,
        }
      );
      if (response?.success && response?.data) {
        setRows(response.data.data);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Campaign analytics error:', err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const apply = () => {
    setPage(1);
    fetchData();
  };

  const colCount = 2 + visibleGroups.reduce((n, g) => n + (g.hasParts ? 5 : 4), 0) + 1;

  return (
    <>
      {/* Filters */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-md p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Search</label>
            <div className="relative">
              <input
                className="w-full pl-3 pr-9 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && apply()}
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
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {ANALYTICS_STATUS_OPTIONS.map((o) => (
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
              {CAMPAIGN_TAG_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="text-xs text-slate-400 block mb-1">Show Columns</label>
            <button
              type="button"
              onClick={() => setShowColsMenu((s) => !s)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-left"
            >
              Name +{visibleGroups.reduce((n, g) => n + (g.hasParts ? 5 : 4), 0)}
            </button>
            {showColsMenu && (
              <div className="absolute z-10 mt-1 w-full bg-slate-800 border border-slate-700 rounded shadow-lg p-2">
                {COLUMN_GROUPS.map((g) => (
                  <label
                    key={g.key}
                    className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-slate-700 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={visible[g.key]}
                      onChange={() => setVisible((v) => ({ ...v, [g.key]: !v[g.key] }))}
                    />
                    {g.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Date</label>
            <select
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {ANALYTICS_PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <button onClick={apply} className="bg-blue-600 px-4 py-2 rounded text-white text-sm">
            Apply
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-700 rounded-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/80 text-slate-300">
              <th className="p-3 text-left border-r border-slate-700" colSpan={2}>
                Campaign
              </th>
              {visibleGroups.map((g) => (
                <th
                  key={g.key}
                  className="p-3 text-left border-r border-slate-700"
                  colSpan={g.hasParts ? 5 : 4}
                >
                  {g.label}
                </th>
              ))}
              <th className="p-3" />
            </tr>
            <tr className="bg-slate-800">
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left border-r border-slate-700">Name</th>
              {visibleGroups.map((g) => (
                <FragmentHead key={g.key} hasParts={g.hasParts} />
              ))}
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colCount} className="p-6 text-center text-slate-400">
                  Loading analytics...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="p-6 text-center text-slate-400">
                  No campaigns found
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-700 hover:bg-slate-800/40">
                  <td className="p-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-3 font-medium border-r border-slate-700">{r.name}</td>
                  {visibleGroups.map((g) => {
                    const m = r[g.key];
                    return <FragmentCell key={g.key} m={m} hasParts={g.hasParts} />;
                  })}
                  <td className="p-3">
                    <button
                      onClick={() => setDetailId(r.id)}
                      className="p-1 rounded hover:bg-slate-700 text-slate-300"
                      title="View analytics"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {detailId && (
        <CampaignAnalyticsDetailModal campaignId={detailId} onClose={() => setDetailId(null)} />
      )}
    </>
  );
};

const FragmentHead: FC<{ hasParts?: boolean }> = ({ hasParts }) => (
  <>
    <th className="p-3 text-left">Sent</th>
    <th className="p-3 text-left">Delivered</th>
    <th className="p-3 text-left">Opened</th>
    <th className={`p-3 text-left ${hasParts ? '' : 'border-r border-slate-700'}`}>Clicked</th>
    {hasParts && <th className="p-3 text-left border-r border-slate-700">SMS Parts</th>}
  </>
);

const FragmentCell: FC<{
  m: { sent: number; delivered: number; opened: number; clicked: number; sms_parts: number };
  hasParts?: boolean;
}> = ({ m, hasParts }) => {
  const dash = (n: number) => (n ? n : '-');
  return (
    <>
      <td className="p-3">{dash(m.sent)}</td>
      <td className="p-3">{dash(m.delivered)}</td>
      <td className="p-3">{dash(m.opened)}</td>
      <td className={`p-3 ${hasParts ? '' : 'border-r border-slate-700'}`}>{dash(m.clicked)}</td>
      {hasParts && <td className="p-3 border-r border-slate-700">{dash(m.sms_parts)}</td>}
    </>
  );
};

export default CampaignsAnalyticsTab;
