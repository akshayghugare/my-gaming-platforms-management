import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '@/services/api';
import type { PaginatedData, User } from '@/types';
import type { Player } from '@/types/player.types';

type Scope = 'all' | 'players' | 'users';
type FieldKey = 'all' | 'name' | 'email' | 'username' | 'player_id' | 'mobile';

interface FieldOption {
  key: FieldKey;
  label: string;
  scopes: Scope[];
}

const FIELD_OPTIONS: FieldOption[] = [
  { key: 'all', label: 'All Fields', scopes: ['all', 'players', 'users'] },
  { key: 'name', label: 'Name', scopes: ['all', 'players', 'users'] },
  { key: 'email', label: 'Email', scopes: ['all', 'players', 'users'] },
  { key: 'username', label: 'Username', scopes: ['all', 'players', 'users'] },
  { key: 'player_id', label: 'Player ID', scopes: ['all', 'players'] },
  { key: 'mobile', label: 'Mobile', scopes: ['all', 'users'] },
];

const SCOPE_OPTIONS: { key: Scope; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'players', label: 'Players' },
  { key: 'users', label: 'Users' },
];

const SearchIcon: FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const userDisplayName = (u: User): string =>
  [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || u.email || 'User';

const GlobalSearch: FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Scope>('all');
  const [field, setField] = useState<FieldKey>('all');
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // reset field if it doesn't apply to the chosen scope
  useEffect(() => {
    const opt = FIELD_OPTIONS.find((f) => f.key === field);
    if (opt && !opt.scopes.includes(scope)) setField('all');
  }, [scope, field]);

  const availableFields = useMemo(
    () => FIELD_OPTIONS.filter((f) => f.scopes.includes(scope)),
    [scope]
  );

  // fetch results
  useEffect(() => {
    if (!open || !debounced) {
      setPlayers([]);
      setUsers([]);
      return;
    }

    const controller = new AbortController();
    const params = {
      page: 1,
      limit: 6,
      search: debounced,
      field: field === 'all' ? undefined : field,
    };

    const fetchAll = async () => {
      setLoading(true);
      try {
        const calls: Promise<unknown>[] = [];
        if (scope === 'all' || scope === 'players') {
          calls.push(
            apiService
              .get<PaginatedData<Player>>('/players/paginate', params, {
                signal: controller.signal,
              })
              .then((res) => setPlayers(res?.data?.data ?? []))
              .catch(() => setPlayers([]))
          );
        } else {
          setPlayers([]);
        }
        if (scope === 'all' || scope === 'users') {
          calls.push(
            apiService
              .get<PaginatedData<User>>('/users/paginate', params, {
                signal: controller.signal,
              })
              .then((res) => setUsers(res?.data?.data ?? []))
              .catch(() => setUsers([]))
          );
        } else {
          setUsers([]);
        }
        await Promise.all(calls);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    return () => controller.abort();
  }, [debounced, scope, field, open]);

  const goToPlayer = (p: Player) => {
    setOpen(false);
    setQuery('');
    navigate(`/players/${p.id}`);
  };

  const goToUser = (u: User) => {
    setOpen(false);
    setQuery('');
    navigate(`/settings/users?highlight=${u.id}`);
  };

  const showResultsArea = open && debounced.length > 0;
  const totalResults = players.length + users.length;

  return (
    <div ref={wrapRef} className="relative">
      <label htmlFor="global-search" className="sr-only">
        Search players and users
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-slate-500 pointer-events-none">
          <SearchIcon />
        </span>
        <input
          id="global-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search players, users..."
          className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 w-56 sm:w-80 outline-none transition-all focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 focus:bg-white/10"
        />
      </div>

      {open && (
        <div className="absolute right-0 top-11 w-[22rem] sm:w-[28rem] bg-[#162040] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Scope tabs */}
          <div className="px-3 pt-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
              Search in
            </div>
            <div className="flex gap-1.5">
              {SCOPE_OPTIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setScope(s.key)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    scope === s.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Field chips */}
          <div className="px-3 pt-3 pb-3 border-b border-white/5">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
              By field
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableFields.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setField(f.key)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors border ${
                    field === f.key
                      ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                      : 'bg-transparent text-slate-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results area */}
          <div className="max-h-[22rem] overflow-y-auto">
            {!showResultsArea ? (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                Start typing to search across {scope === 'all' ? 'players and users' : scope}.
              </div>
            ) : loading ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400">Searching…</div>
            ) : totalResults === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                No results for &ldquo;{debounced}&rdquo;
              </div>
            ) : (
              <>
                {players.length > 0 && (
                  <div>
                    <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-slate-500">
                      Players ({players.length})
                    </div>
                    {players.map((p) => (
                      <button
                        key={`p-${p.id}`}
                        type="button"
                        onClick={() => goToPlayer(p)}
                        className="w-full px-3 py-2 flex items-center gap-3 hover:bg-white/5 text-left transition-colors"
                      >
                        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {(p.name || p.username || 'P').charAt(0).toUpperCase()}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm text-slate-200 truncate">
                            {p.name || p.username}
                          </span>
                          <span className="block text-[11px] text-slate-500 truncate">
                            {p.player_id ? `${p.player_id} · ` : ''}
                            {p.email || '—'}
                          </span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                          Player
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {users.length > 0 && (
                  <div>
                    <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-slate-500">
                      Users ({users.length})
                    </div>
                    {users.map((u) => (
                      <button
                        key={`u-${u.id}`}
                        type="button"
                        onClick={() => goToUser(u)}
                        className="w-full px-3 py-2 flex items-center gap-3 hover:bg-white/5 text-left transition-colors"
                      >
                        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {(u.first_name || u.username || 'U').charAt(0).toUpperCase()}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm text-slate-200 truncate">
                            {userDisplayName(u)}
                          </span>
                          <span className="block text-[11px] text-slate-500 truncate">
                            {u.username ? `@${u.username} · ` : ''}
                            {u.email || '—'}
                          </span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                          User
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
