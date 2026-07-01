import { useEffect, useState, type FC } from 'react';
import { Bell, Mail, Monitor, Search, Trash2 } from 'lucide-react';
import apiService from '@/services/api';
import Pagination from '@/components/Pagination';
import type { ApiError, PaginatedData } from '@/types';
import type {
  CampaignChannel,
  CampaignDeliveryStatus,
  PlayerCampaignHistory,
} from '@/types/player.types';

const channelMeta: Record<CampaignChannel, { icon: React.ReactNode; label: string; bar: string }> =
  {
    WEB_PUSH: {
      icon: <Monitor size={16} />,
      label: 'Web Push Notification',
      bar: 'bg-emerald-500',
    },
    ON_SITE: { icon: <Bell size={16} />, label: 'On Site Notification', bar: 'bg-slate-400' },
    EMAIL: { icon: <Mail size={16} />, label: 'Email', bar: 'bg-blue-500' },
    SMS: { icon: <Mail size={16} />, label: 'SMS', bar: 'bg-blue-500' },
    PUSH: { icon: <Bell size={16} />, label: 'Push', bar: 'bg-emerald-500' },
  };

const statusBadge: Record<CampaignDeliveryStatus, string> = {
  SENT: 'bg-green-500/20 text-green-300',
  OPEN: 'bg-emerald-500/20 text-emerald-300',
  ERROR: 'bg-red-500/20 text-red-300',
  CLICKED: 'bg-blue-500/20 text-blue-300',
  PENDING: 'bg-slate-500/20 text-slate-300',
};

const fmtDay = (v: string) => {
  const d = new Date(v);
  return {
    dow: d.toLocaleDateString('en-GB', { weekday: 'short' }),
    day: d.getDate(),
    rest: d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
};

const CampaignHistoryTab: FC<{ playerId: string }> = ({ playerId }) => {
  const [rows, setRows] = useState<PlayerCampaignHistory[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchRows = async () => {
    try {
      setLoading(true);
      const res = await apiService.get<PaginatedData<PlayerCampaignHistory>>(
        `/players/${playerId}/campaign-history`,
        { page, limit: 25, search: search || undefined }
      );
      if (res?.success && res?.data) {
        setRows(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Campaign history error:', err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const clear = () => {
    setSearch('');
    setPage(1);
    setTimeout(fetchRows, 0);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Search Campaign</label>
          <div className="relative">
            <input
              className="w-64 pl-3 pr-9 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  setTimeout(fetchRows, 0);
                }
              }}
            />
            <Search
              size={15}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Date</label>
          <select className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm">
            <option>Lifetime</option>
            <option>Last 30 days</option>
          </select>
        </div>
        <button onClick={clear} className="flex items-center gap-1 text-red-400 text-sm py-2">
          <Trash2 size={14} /> Clear
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-slate-400 py-8">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No campaign history</p>
        ) : (
          rows.map((r) => {
            const m = channelMeta[r.channel];
            const d = fmtDay(r.event_at);
            return (
              <div key={r.id} className="flex gap-4">
                <div className="w-16 text-center text-slate-300">
                  <div className="text-xs text-slate-400">{d.dow}</div>
                  <div className="text-xl font-bold">{d.day}th</div>
                  <div className="text-[10px] text-slate-500">{d.rest}</div>
                </div>
                <div
                  className={`flex-1 bg-slate-800/50 border border-slate-700 rounded-md p-4 border-l-4`}
                  style={{ borderLeftColor: 'rgb(16 185 129)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center">
                      {m.icon}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{m.label}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${statusBadge[r.status]}`}
                        >
                          {r.status.charAt(0) + r.status.slice(1).toLowerCase()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {d.time} UTC{r.event_label ? ` - ${r.event_label}` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-end gap-4 text-sm text-slate-300">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        <span>
          <span className="font-semibold">Total:</span> {total}
        </span>
      </div>
    </div>
  );
};

export default CampaignHistoryTab;
