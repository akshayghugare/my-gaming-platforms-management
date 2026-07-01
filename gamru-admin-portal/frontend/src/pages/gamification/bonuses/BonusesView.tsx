import { useCallback, useEffect, useState, type FC } from 'react';
import apiService from '@/services/api';
import DashboardLayout from '@/layout/DashboardLayout';
import Pagination from '@/components/Pagination';

interface Paginated<T> {
  data: T[];
  pagination?: { total: number; page: number; limit: number; totalPages: number };
}

interface BonusRow {
  id: string;
  external_bonus_id: string;
  bonus_name: string;
  bonus_type: string;
  amount: number;
  amount_type: string;
  status: string;
  source: string;
  synced_at?: string | null;
}

interface UserBonusRow {
  id: string;
  user_id: string;
  email?: string | null;
  external_bonus_id: string;
  bonus_name: string;
  source_type: string;
  source_id: string;
  amount: number;
  amount_type: string;
  status: string;
  source: string;
  claimed_at?: string | null;
}

type Tab = 'bonuses' | 'userBonuses';

const th = 'px-3 py-2 text-left font-medium text-xs uppercase tracking-wide text-gray-500';
const td = 'px-3 py-2 text-sm text-white dark:text-gray-200';
const PAGE_SIZE = 10;

const BonusesView: FC = () => {
  const [tab, setTab] = useState<Tab>('bonuses');

  const [bonuses, setBonuses] = useState<BonusRow[]>([]);
  const [bonusPage, setBonusPage] = useState(1);
  const [bonusTotalPages, setBonusTotalPages] = useState(1);
  const [bonusTotal, setBonusTotal] = useState(0);
  const [bonusLoading, setBonusLoading] = useState(true);
  const [bonusSearch, setBonusSearch] = useState('');

  const [userBonuses, setUserBonuses] = useState<UserBonusRow[]>([]);
  const [ubPage, setUbPage] = useState(1);
  const [ubTotalPages, setUbTotalPages] = useState(1);
  const [ubTotal, setUbTotal] = useState(0);
  const [ubLoading, setUbLoading] = useState(true);
  const [ubSearch, setUbSearch] = useState('');

  const loadBonuses = useCallback(async (page: number, search: string) => {
    setBonusLoading(true);
    try {
      const res = await apiService.get<Paginated<BonusRow>>('/bonuses', {
        page,
        limit: PAGE_SIZE,
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      if (res?.success) {
        setBonuses(res.data?.data ?? []);
        setBonusTotalPages(res.data?.pagination?.totalPages ?? 1);
        setBonusTotal(res.data?.pagination?.total ?? 0);
      }
    } finally {
      setBonusLoading(false);
    }
  }, []);

  const loadUserBonuses = useCallback(async (page: number, search: string) => {
    setUbLoading(true);
    try {
      const res = await apiService.get<Paginated<UserBonusRow>>('/user-bonuses', {
        page,
        limit: PAGE_SIZE,
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      if (res?.success) {
        setUserBonuses(res.data?.data ?? []);
        setUbTotalPages(res.data?.pagination?.totalPages ?? 1);
        setUbTotal(res.data?.pagination?.total ?? 0);
      }
    } finally {
      setUbLoading(false);
    }
  }, []);

  // Debounced fetch of the active tab whenever its page / search changes.
  useEffect(() => {
    if (tab !== 'bonuses') return;
    const t = setTimeout(() => loadBonuses(bonusPage, bonusSearch), 300);
    return () => clearTimeout(t);
  }, [tab, bonusPage, bonusSearch, loadBonuses]);

  useEffect(() => {
    if (tab !== 'userBonuses') return;
    const t = setTimeout(() => loadUserBonuses(ubPage, ubSearch), 300);
    return () => clearTimeout(t);
  }, [tab, ubPage, ubSearch, loadUserBonuses]);

  const onBonusSearch = (v: string) => {
    setBonusSearch(v);
    setBonusPage(1); // a new query starts at page 1
  };
  const onUbSearch = (v: string) => {
    setUbSearch(v);
    setUbPage(1);
  };

  const refresh = () => {
    if (tab === 'bonuses') loadBonuses(bonusPage, bonusSearch);
    else loadUserBonuses(ubPage, ubSearch);
  };

  const tabBtn = (key: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
      tab === key
        ? 'border-blue-500 text-white'
        : 'border-transparent text-gray-400 hover:text-white'
    }`;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bonuses</h1>
            <p className="text-sm">
              SDLCGames bonus definitions synced into GAMRU, and the bonuses players have claimed.
              Synced automatically when a rank pins a Bonus ID.
            </p>
          </div>
          <button
            onClick={refresh}
            className="px-3 py-1.5 rounded bg-blue-600 text-sm hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-700">
          <button type="button" className={tabBtn('bonuses')} onClick={() => setTab('bonuses')}>
            Synced Bonuses ({bonusTotal})
          </button>
          <button
            type="button"
            className={tabBtn('userBonuses')}
            onClick={() => setTab('userBonuses')}
          >
            User Bonuses ({ubTotal})
          </button>
        </div>

        {/* Synced bonus definitions */}
        {tab === 'bonuses' && (
          <section className="space-y-3">
            <input
              type="text"
              value={bonusSearch}
              onChange={(e) => onBonusSearch(e.target.value)}
              placeholder="Search by name, type, source or bonus ID…"
              className="w-full max-w-sm px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <div className="overflow-x-auto border border-slate-700 rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-slate-800">
                  <tr>
                    <th className={th}>Name</th>
                    <th className={th}>Type</th>
                    <th className={th}>Amount</th>
                    <th className={th}>Status</th>
                    <th className={th}>Source</th>
                    <th className={th}>Bonus ID</th>
                  </tr>
                </thead>
                <tbody>
                  {bonuses.map((b) => (
                    <tr key={b.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                      <td className={td}>{b.bonus_name}</td>
                      <td className={td}>{b.bonus_type}</td>
                      <td className={td}>
                        {b.amount} <span>{b.amount_type}</span>
                      </td>
                      <td className={td}>{b.status}</td>
                      <td className={td}>{b.source}</td>
                      <td className={`${td} font-mono text-xs`}>{b.external_bonus_id}</td>
                    </tr>
                  ))}
                  {!bonusLoading && bonuses.length === 0 && (
                    <tr>
                      <td className={`${td} text-center`} colSpan={6}>
                        {bonusSearch.trim()
                          ? 'No bonuses match your search.'
                          : 'No synced bonuses yet — pin a Bonus ID on a rank/level to sync it.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {bonusTotalPages > 1 && (
              <Pagination
                page={bonusPage}
                totalPages={bonusTotalPages}
                onPageChange={setBonusPage}
              />
            )}
          </section>
        )}

        {/* Claimed user bonuses */}
        {tab === 'userBonuses' && (
          <section className="space-y-3">
            <input
              type="text"
              value={ubSearch}
              onChange={(e) => onUbSearch(e.target.value)}
              placeholder="Search by user, bonus, source or platform…"
              className="w-full max-w-sm px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <div className="overflow-x-auto border border-slate-700 rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-slate-800">
                  <tr>
                    <th className={th}>User</th>
                    <th className={th}>Bonus</th>
                    <th className={th}>Source</th>
                    <th className={th}>Platform Source</th>
                    <th className={th}>Amount</th>
                    <th className={th}>Status</th>
                    <th className={th}>Claimed</th>
                  </tr>
                </thead>
                <tbody>
                  {userBonuses.map((u) => (
                    <tr key={u.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                      <td className={td}>{u.email || u.user_id}</td>
                      <td className={td}>{u.bonus_name}</td>
                      <td className={td}>
                        {u.source_type}
                        {u.source_id ? ` #${u.source_id}` : ''}
                      </td>
                      <td className={td}>{u.source}</td>
                      <td className={td}>
                        {u.amount} <span>{u.amount_type}</span>
                      </td>
                      <td className={td}>{u.status}</td>
                      <td className={td}>
                        {u.claimed_at ? new Date(u.claimed_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                  {!ubLoading && userBonuses.length === 0 && (
                    <tr>
                      <td className={`${td} text-center`} colSpan={7}>
                        {ubSearch.trim()
                          ? 'No user bonuses match your search.'
                          : 'No claimed bonuses yet.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {ubTotalPages > 1 && (
              <Pagination page={ubPage} totalPages={ubTotalPages} onPageChange={setUbPage} />
            )}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BonusesView;
