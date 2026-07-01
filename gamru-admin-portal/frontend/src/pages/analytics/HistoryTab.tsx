import { useEffect, useState, useRef, type FC } from 'react';
import { History, MoreVertical, Search } from 'lucide-react';
import apiService from '@/services/api';
import Pagination from '@/components/Pagination';
import type { ApiError, PaginatedData } from '@/types';
import {
  type CampaignHistoryRow,
  ANALYTICS_PERIOD_OPTIONS,
  HISTORY_STATUS_OPTIONS,
  CHANNEL_OPTIONS,
  CHANNEL_LABEL,
} from '@/types/analytics.types';

const StatusDot: FC<{ status: string }> = ({ status }) => {
  const color: Record<string, string> = {
    SENT: 'bg-blue-400',
    DELIVERED: 'bg-cyan-400',
    OPEN: 'bg-emerald-400',
    CLICK: 'bg-violet-400',
    LOGIN: 'bg-green-400',
    BOUNCED: 'bg-amber-400',
    FAILED: 'bg-red-400',
  };
  return (
    <span className="inline-flex items-center gap-2 capitalize">
      <span className={`w-2 h-2 rounded-full ${color[status] ?? 'bg-slate-400'}`} />
      {status.toLowerCase()}
    </span>
  );
};

const HistoryTab: FC = () => {
  const [rows, setRows] = useState<CampaignHistoryRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);

  const [period, setPeriod] = useState('lifetime');
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<PaginatedData<CampaignHistoryRow>>(
        '/analytics/history',
        {
          page,
          limit,
          period,
          channel: channel || undefined,
          status: status || undefined,
          search: search || undefined,
        }
      );
      if (response?.success && response?.data) {
        setRows(response.data.data);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('History error:', err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  const apply = () => {
    setPage(1);
    fetchData();
  };

  return (
    <>
      <div className="bg-slate-800/40 border border-slate-700 rounded-md p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
          <div>
            <label className="text-xs text-slate-400 block mb-1">Channel</label>
            <select
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              {CHANNEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Status</label>
            <select
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {HISTORY_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
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
        </div>
        <div className="mt-3">
          <button onClick={apply} className="bg-blue-600 px-4 py-2 rounded text-white text-sm">
            Apply
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-700 rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-slate-800">
            <tr>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Player ID</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Channel</th>
              <th className="p-3 text-left" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">
                  Loading history...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">
                  No history found
                </td>
              </tr>
            ) : (
              rows.map((h) => (
                <tr key={h.id} className="border-t border-slate-700 hover:bg-slate-800/40">
                  <td className="p-3">
                    <StatusDot status={h.status} />
                  </td>
                  <td className="p-3 font-medium text-blue-300 underline">{h.name}</td>
                  <td className="p-3 text-xs">{h.player_id}</td>
                  <td className="p-3 text-xs whitespace-pre-line">
                    {new Date(h.event_date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {'\n'}
                    {new Date(h.event_date).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    UTC
                  </td>
                  <td className="p-3">{CHANNEL_LABEL[h.channel]}</td>
                  <td className="p-3 relative">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setOpenMenu(openMenu === h.id ? null : h.id)}
                        className="p-1 rounded hover:bg-slate-700"
                      >
                        <MoreVertical size={16} />
                      </button>
                      <button
                        className="p-1 rounded hover:bg-slate-700 text-slate-300"
                        title="Event timeline"
                      >
                        <History size={16} />
                      </button>
                    </div>
                    {openMenu === h.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-8 top-8 z-10 w-40 bg-slate-800 border border-slate-700 rounded shadow-lg text-sm"
                      >
                        <div className="px-3 py-2 text-slate-400 text-xs border-b border-slate-700">
                          {h.name}
                        </div>
                        <div className="px-3 py-2">Channel: {CHANNEL_LABEL[h.channel]}</div>
                        <div className="px-3 py-2 capitalize">Status: {h.status.toLowerCase()}</div>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  );
};

export default HistoryTab;
