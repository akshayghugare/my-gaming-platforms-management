import { useEffect, useState, type FC } from 'react';
import { ChevronUp } from 'lucide-react';
import apiService from '@/services/api';
import Pagination from '@/components/Pagination';
import type { ApiError, PaginatedData } from '@/types';
import type { PlayerLog } from '@/types/player.types';

const fmt = (v: string) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString('en-GB');
};

const AccountInformationTab: FC<{ playerId: string }> = ({ playerId }) => {
  const [logs, setLogs] = useState<PlayerLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiService.get<PaginatedData<PlayerLog>>(`/players/${playerId}/logs`, {
        page,
        limit: 25,
      });
      if (res?.success && res?.data) {
        setLogs(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Logs error:', err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-lg">
      <div className="flex items-center gap-2 px-4 py-3">
        <ChevronUp size={16} className="text-slate-400" />
        <span className="font-semibold text-sm">Logs</span>
        <span className="ml-1 text-xs bg-blue-500/20 text-blue-300 rounded-full px-2 py-0.5">
          {total}
        </span>
      </div>

      <div className="px-4 pb-4">
        {loading ? (
          <p className="text-center text-slate-400 py-8">Loading…</p>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-16 border-2 border-slate-600 rounded mb-3" />
            <p className="font-semibold text-slate-300">No results found.</p>
            <p className="text-xs text-slate-500 mt-1">
              What you searched for was unfortunately not found. Please try another combination.
            </p>
          </div>
        ) : (
          <div className="overflow-auto h-screen">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-slate-400 text-xs">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Action</th>
                  <th className="p-3 text-left">Detail</th>
                  <th className="p-3 text-left">Actor</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t border-slate-700/60">
                    <td className="p-3">{fmt(l.created_at)}</td>
                    <td className="p-3">{l.action}</td>
                    <td className="p-3">{l.detail || '-'}</td>
                    <td className="p-3">{l.actor || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {logs.length > 0 && (
          <div className="flex items-center justify-end gap-4 mt-3 text-sm text-slate-300">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            <span>
              <span className="font-semibold">Total:</span> {total}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountInformationTab;
