import { useEffect, useState, type FC } from 'react';
import { X, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { gamificationApi, type ParticipantRow } from '@/services/gamification.api';
import type { GamificationFeatureKey } from '@/types/gamification.types';

interface Props {
  featureKey: GamificationFeatureKey;
  entityId: string;
  entityName: string;
  closeModal: () => void;
}

const LIMIT = 10;

const STATUS_STYLES: Record<string, string> = {
  IN_PROGRESS: 'bg-amber-500/15 text-amber-300',
  COMPLETED: 'bg-blue-500/15 text-blue-300',
  CLAIMED: 'bg-green-500/15 text-green-400',
};

const StatusPill: FC<{ status: string | null }> = ({ status }) => {
  if (!status) return <span className="text-slate-500">—</span>;
  const cls = STATUS_STYLES[status] ?? 'bg-slate-700 text-slate-300';
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

/**
 * Players who participated in (claimed) a mission / mission-bundle.
 * Same overlay/look as the tournament leaderboard modal, with pagination
 * like the segment players modal.
 */
const ParticipantsModal: FC<Props> = ({ featureKey, entityId, entityName, closeModal }) => {
  const [rows, setRows] = useState<ParticipantRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('');
  const [sources, setSources] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await gamificationApi(featureKey).participants(entityId, {
          page,
          limit: LIMIT,
          ...(source ? { source } : {}),
        });
        if (active && res?.success && res?.data) {
          setRows(res.data.data ?? []);
          setTotal(res.data.total ?? 0);
          setSources(res.data.sources ?? []);
        }
      } catch {
        if (active) toast.error('Failed to load participants');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [featureKey, entityId, page, source]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const fmt = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '—';

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-xs flex justify-center items-center z-50"
      onClick={closeModal}
    >
      <div
        className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl shadow-black/60 w-full max-w-xl mx-4 max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 shrink-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-100">
            <Users size={18} className="text-blue-400" /> Participated players
            <span className="text-slate-400 font-normal">· {entityName}</span>
          </h2>
          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/60"
          >
            <X size={16} />
          </button>
        </div>

        {sources.length > 0 && (
          <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-700/50 shrink-0">
            <span className="text-xs text-slate-400">Source</span>
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setPage(1);
              }}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
            >
              <option value="">All</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="px-6 py-4 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-slate-500 py-6 text-center">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No players have participated yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs border-b border-slate-700/60">
                  <th className="text-left py-2">Player</th>
                  <th className="text-left py-2">Source</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.player_id ?? r.email} className="border-b border-slate-800">
                    <td className="py-2.5 text-slate-200">
                      {r.name}
                      {r.email && r.email !== r.name && (
                        <span className="block text-[11px] text-slate-500">{r.email}</span>
                      )}
                    </td>
                    <td className="py-2.5 text-slate-300">{r.source ?? '—'}</td>
                    <td className="py-2.5">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="py-2.5 text-right text-slate-400">{fmt(r.joined_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {total > LIMIT && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-700/50 text-xs text-slate-400 shrink-0">
            <span>{total} total</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2 py-1 rounded border border-slate-700 disabled:opacity-40 hover:bg-slate-800"
              >
                Prev
              </button>
              <span>
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2 py-1 rounded border border-slate-700 disabled:opacity-40 hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantsModal;
