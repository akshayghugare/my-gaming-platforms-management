import { useEffect, useState, type FC } from 'react';
import { Search, Trash2 } from 'lucide-react';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import Pagination from '@/components/Pagination';
import apiService from '@/services/api';
import type { ApiError, PaginatedData } from '@/types';
import {
  type UnsubscribeReport,
  UNSUBSCRIBE_CHANNEL_OPTIONS,
  UNSUBSCRIBE_DATE_OPTIONS,
  channelLabel,
} from '@/types/unsubscribeReport.types';

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

const UnsubscribeReportList: FC = () => {
  const [items, setItems] = useState<UnsubscribeReport[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [channel, setChannel] = useState('');

  const getItems = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<PaginatedData<UnsubscribeReport>>(
        '/unsubscribe-reports/paginate',
        {
          page,
          limit,
          days: days || undefined,
          campaign_name: campaignName || undefined,
          player_id: playerId || undefined,
          channel: channel || undefined,
        }
      );
      if (response?.success && response?.data) {
        setItems(response.data.data);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Get unsubscribe reports error:', err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const applyFilters = () => {
    setPage(1);
    getItems();
  };

  const clearFilters = () => {
    setDays('');
    setCampaignName('');
    setPlayerId('');
    setChannel('');
    setPage(1);
    setTimeout(() => getItems(), 0);
  };

  return (
    <DashboardLayout>
      <div className="px-4 w-full">
        <div className="mb-6">
          <PageHeaderBreadcrumb
            title="Unsubscribe Report"
            items={[
              { label: 'Home', clickable: true },
              { label: 'CRM' },
              { label: 'Unsubscribe report' },
            ]}
          />
        </div>

        {/* Filters */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-md p-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Date</label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                value={days}
                onChange={(e) => setDays(e.target.value)}
              >
                {UNSUBSCRIBE_DATE_OPTIONS.map((o) => (
                  <option key={o.label} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Campaign Name</label>
              <div className="relative">
                <input
                  className="w-full pl-3 pr-9 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                />
                <Search
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Player ID</label>
              <div className="relative">
                <input
                  className="w-full pl-3 pr-9 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                />
                <Search
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Channel</label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                {UNSUBSCRIBE_CHANNEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
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
                <th className="p-3 text-left">Player ID</th>
                <th className="p-3 text-left">Campaign Name</th>
                <th className="p-3 text-left">Channel</th>
                <th className="p-3 text-left">Reason</th>
                <th className="p-3 text-left">Unsubscribed Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    Loading report...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-400">
                    <p className="font-semibold text-slate-300">No results found.</p>
                    <p className="text-xs mt-1">
                      What you searched for was unfortunately not found. Please try another
                      combination.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className="border-t border-slate-700 hover:bg-slate-800/40">
                    <td className="p-3 font-medium">{r.player_id}</td>
                    <td className="p-3">{r.campaign_name || '-'}</td>
                    <td className="p-3">{channelLabel(r.channel)}</td>
                    <td className="p-3 text-slate-300 max-w-xs truncate">{r.reason || '-'}</td>
                    <td className="p-3 whitespace-pre-line text-xs">
                      {formatDate(r.unsubscribed_at)}
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

export default UnsubscribeReportList;
