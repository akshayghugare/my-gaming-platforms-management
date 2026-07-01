import { useEffect, useState, type FC } from 'react';
import { X, Trophy } from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '@/services/api';

interface LeaderboardRow {
  rank: number;
  player_id: string | null;
  email: string;
  name: string;
  score: number;
}

interface Props {
  tournamentId: string;
  tournamentName: string;
  closeModal: () => void;
}

const medal = ['text-amber-400', 'text-slate-300', 'text-orange-400'];

const TournamentLeaderboardModal: FC<Props> = ({ tournamentId, tournamentName, closeModal }) => {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiService.get<LeaderboardRow[]>(
          `/tournament-leaderboard/${tournamentId}`
        );
        if (res?.success && res?.data) setRows(res.data);
      } catch {
        toast.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [tournamentId]);

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-xs flex justify-center items-center z-50"
      onClick={closeModal}
    >
      <div
        className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl shadow-black/60 w-full max-w-lg mx-4 max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 shrink-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-100">
            <Trophy size={18} className="text-amber-400" /> Leaderboard
            <span className="text-slate-400 font-normal">· {tournamentName}</span>
          </h2>
          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/60"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-slate-500 py-6 text-center">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              No participants have scored yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs border-b border-slate-700/60">
                  <th className="text-left py-2 w-12">#</th>
                  <th className="text-left py-2">Player</th>
                  <th className="text-right py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.email} className="border-b border-slate-800">
                    <td className={`py-2.5 font-bold ${medal[r.rank - 1] ?? 'text-slate-500'}`}>
                      {r.rank}
                    </td>
                    <td className="py-2.5 text-slate-200">
                      {r.name}
                      {r.name !== r.email && (
                        <span className="block text-[11px] text-slate-500">{r.email}</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-slate-100">
                      {r.score.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentLeaderboardModal;
