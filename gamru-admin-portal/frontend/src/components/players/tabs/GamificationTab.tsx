import { useEffect, useState, type FC } from 'react';
import apiService from '@/services/api';
import Pagination from '@/components/Pagination';
import ManualRewardModal from '@/components/modals/players/ManualRewardModal';
import type { ApiError, PaginatedData } from '@/types';
import type { PlayerReward, RewardStatus } from '@/types/player.types';

const rewardStatusBadge: Record<RewardStatus, string> = {
  IN_PROGRESS: 'bg-amber-500/20 text-amber-300',
  GRANTED: 'bg-green-500/20 text-green-300',
  EXPIRED: 'bg-slate-500/20 text-slate-300',
  CANCELLED: 'bg-red-500/20 text-red-300',
};

/** Per-player mission progress (GAMRU is the source of truth). */
interface PlayerMission {
  id: string;
  name: string;
  category: string;
  status: 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'CLAIMED';
  progress: number;
  target: number;
  reward_label: string;
  condition: string;
  completed_at: string | null;
  claimed_at: string | null;
  /** Which track this row came from — standalone mission vs joined in a bundle. */
  participation_type?: 'mission' | 'mission-bundle';
}

/** A player's mission bundle with grouped progress (completed/total + missions). */
interface PlayerBundle {
  id: string;
  name: string;
  description: string | null;
  large_image: string | null;
  periodicity: string | null;
  bundle_type: string | null;
  total: number;
  completed: number;
  missions: PlayerMission[];
}

/** Per-player tournament standing + prize. */
interface PlayerTournament {
  tournament_id: string;
  name: string;
  industry: string;
  plays: number;
  xp: number;
  rank: number;
  prize: number;
  claimed: boolean;
  last_played_at: string | null;
}

const missionStatusBadge: Record<PlayerMission['status'], string> = {
  AVAILABLE: 'bg-slate-500/20 text-slate-300',
  IN_PROGRESS: 'bg-amber-500/20 text-amber-300',
  COMPLETED: 'bg-blue-500/20 text-blue-300',
  CLAIMED: 'bg-green-500/20 text-green-300',
};

const fmt = (v?: string | null) => {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })} - ${d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const pct = (progress: number, target: number) =>
  target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0;

const titleCase = (s: string) =>
  s
    .toLowerCase()
    .replace('_', ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

const GamificationTab: FC<{ playerId: string }> = ({ playerId }) => {
  const [rewards, setRewards] = useState<PlayerReward[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [missions, setMissions] = useState<PlayerMission[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(false);
  const [bundles, setBundles] = useState<PlayerBundle[]>([]);
  const [bundlesLoading, setBundlesLoading] = useState(false);
  const [tournaments, setTournaments] = useState<PlayerTournament[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(false);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const res = await apiService.get<PaginatedData<PlayerReward>>(
        `/players/${playerId}/rewards`,
        { page, limit: 25 }
      );
      if (res?.success && res?.data) {
        setRewards(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Rewards error:', err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  const fetchMissions = async () => {
    try {
      setMissionsLoading(true);
      const res = await apiService.get<{ missions: PlayerMission[] }>(
        `/players/${playerId}/missions`
      );
      if (res?.success && res?.data) setMissions(res.data.missions ?? []);
    } catch (err) {
      console.error('Player missions error:', err as ApiError);
    } finally {
      setMissionsLoading(false);
    }
  };

  const fetchBundles = async () => {
    try {
      setBundlesLoading(true);
      const res = await apiService.get<{ bundles: PlayerBundle[] }>(`/players/${playerId}/bundles`);
      if (res?.success && res?.data) setBundles(res.data.bundles ?? []);
    } catch (err) {
      console.error('Player bundles error:', err as ApiError);
    } finally {
      setBundlesLoading(false);
    }
  };

  const fetchTournaments = async () => {
    try {
      setTournamentsLoading(true);
      const res = await apiService.get<{ tournaments: PlayerTournament[] }>(
        `/players/${playerId}/tournaments`
      );
      if (res?.success && res?.data) setTournaments(res.data.tournaments ?? []);
    } catch (err) {
      console.error('Player tournaments error:', err as ApiError);
    } finally {
      setTournamentsLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    fetchMissions();
    fetchBundles();
    fetchTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  // Missions and mission-bundles are separate features. Standalone missions are
  // the "GAMRU" track; bundle progress is grouped per bundle (see fetchBundles).
  const standaloneMissions = missions.filter((m) => m.participation_type !== 'mission-bundle');

  // The mission table body (Status / Mission / Progress / Reward / Completed /
  // Claimed) — reused by the Missions section and inside each bundle card.
  const missionTableInner = (list: PlayerMission[], loadingFlag: boolean, empty: string) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-800 text-slate-400 text-xs">
          <tr>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Mission</th>
            <th className="p-3 text-left">Progress</th>
            <th className="p-3 text-left">Reward</th>
            <th className="p-3 text-left">Completed</th>
            <th className="p-3 text-left">Claimed</th>
          </tr>
        </thead>
        <tbody>
          {loadingFlag ? (
            <tr>
              <td colSpan={6} className="p-6 text-center text-slate-400">
                Loading…
              </td>
            </tr>
          ) : list.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-6 text-center text-slate-400">
                {empty}
              </td>
            </tr>
          ) : (
            list.map((m, i) => (
              <tr key={`${m.id}-${i}`} className="border-t border-slate-700/60">
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${missionStatusBadge[m.status]}`}
                  >
                    {titleCase(m.status)}
                  </span>
                </td>
                <td className="p-3">
                  <div className="font-medium text-slate-200">{m.name}</div>
                  <div className="text-xs text-slate-500">{m.condition || m.category}</div>
                </td>
                <td className="p-3 min-w-[160px]">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>
                      {m.progress} / {m.target}
                    </span>
                    <span>{pct(m.progress, m.target)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${pct(m.progress, m.target)}%` }}
                    />
                  </div>
                </td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300">
                    {m.reward_label || '-'}
                  </span>
                </td>
                <td className="p-3">{fmt(m.completed_at)}</td>
                <td className="p-3">{fmt(m.claimed_at)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const missionTable = (title: string, list: PlayerMission[], empty: string) => (
    <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-5">
      <h3 className="font-semibold mb-4">{title}</h3>
      {missionTableInner(list, missionsLoading, empty)}
    </div>
  );

  // One bundle = a header (name + overall completed/total) + its missions, each
  // with that bundle-track's own progress.
  const bundleCard = (b: PlayerBundle) => (
    <div key={b.id} className="border border-slate-700/60 rounded-lg p-4 bg-slate-900/30">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-100">{b.name}</span>
            {b.bundle_type && (
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide bg-slate-600/40 text-slate-300">
                {b.bundle_type}
              </span>
            )}
            {b.periodicity && (
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide bg-purple-500/20 text-purple-300">
                {b.periodicity}
              </span>
            )}
          </div>
          {b.description && <div className="text-xs text-slate-500 mt-0.5">{b.description}</div>}
        </div>
        <div className="text-right shrink-0 min-w-[120px]">
          <div className="text-xs text-slate-400 mb-1">
            Completed {b.completed} / {b.total}
          </div>
          <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-purple-500"
              style={{ width: `${pct(b.completed, b.total)}%` }}
            />
          </div>
        </div>
      </div>
      {missionTableInner(b.missions, false, 'No missions joined in this bundle yet.')}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* My Rewards */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">My Rewards</h3>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-1.5 rounded-full border border-blue-500 text-blue-300 text-sm hover:bg-blue-500/10"
          >
            + Manual Reward
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-400 text-xs">
              <tr>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Granted Date</th>
                <th className="p-3 text-left">Gamification Source</th>
                <th className="p-3 text-left">Reward Type</th>
                <th className="p-3 text-left">Reward</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : rewards.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    No rewards
                  </td>
                </tr>
              ) : (
                rewards.map((r) => (
                  <tr key={r.id} className="border-t border-slate-700/60">
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${rewardStatusBadge[r.status]}`}
                      >
                        {titleCase(r.status)}
                      </span>
                    </td>
                    <td className="p-3">{fmt(r.granted_date)}</td>
                    <td className="p-3">{r.gamification_source || '-'}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-amber-500/20 text-amber-300">
                        {r.reward_type || '-'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300">
                        {r.reward || '-'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-4 mt-3 text-sm text-slate-300">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          <span>
            <span className="font-semibold">Total:</span> {total}
          </span>
        </div>
      </div>
      {/* Missions & Mission Bundles — separate features. Per-player progress,
          computed in GAMRU. */}
      {missionTable('Missions', standaloneMissions, 'This player has not joined any missions.')}

      {/* Mission Bundles — grouped per bundle: overall completed/total + each
          member mission's per-bundle progress. */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-5">
        <h3 className="font-semibold mb-4">Mission Bundles</h3>
        {bundlesLoading ? (
          <div className="p-6 text-center text-slate-400">Loading…</div>
        ) : bundles.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            This player has not joined any mission bundles.
          </div>
        ) : (
          <div className="space-y-4">{bundles.map((b) => bundleCard(b))}</div>
        )}
      </div>

      {/* Tournaments — per-player standings + prizes, computed in GAMRU */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-5">
        <h3 className="font-semibold mb-4">Tournaments</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-400 text-xs">
              <tr>
                <th className="p-3 text-left">Tournament</th>
                <th className="p-3 text-left">Industry</th>
                <th className="p-3 text-left">Rank</th>
                <th className="p-3 text-left">Score</th>
                <th className="p-3 text-left">Plays</th>
                <th className="p-3 text-left">Prize</th>
                <th className="p-3 text-left">Last Played</th>
              </tr>
            </thead>
            <tbody>
              {tournamentsLoading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : tournaments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    This player has not taken part in any tournaments.
                  </td>
                </tr>
              ) : (
                tournaments.map((t) => (
                  <tr key={t.tournament_id} className="border-t border-slate-700/60">
                    <td className="p-3 font-medium text-slate-200">{t.name}</td>
                    <td className="p-3">{t.industry}</td>
                    <td className="p-3">{t.rank ? `#${t.rank}` : '-'}</td>
                    <td className="p-3">{t.xp}</td>
                    <td className="p-3">{t.plays}</td>
                    <td className="p-3">
                      {t.prize > 0 ? (
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            t.claimed
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {t.prize} {t.claimed ? '(claimed)' : '(unclaimed)'}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3">{fmt(t.last_played_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ManualRewardModal
          playerId={playerId}
          onClose={() => setShowModal(false)}
          onSuccess={fetchRewards}
        />
      )}
    </div>
  );
};

export default GamificationTab;
