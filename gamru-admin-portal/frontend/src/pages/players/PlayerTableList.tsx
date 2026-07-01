import { useEffect, useState, useRef, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MoreVertical, Search } from 'lucide-react';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import Pagination from '@/components/Pagination';
import CreatePlayerModal from '@/components/modals/players/CreatePlayerModal';
import AdminOnly from '@/components/AdminOnly';
import apiService from '@/services/api';
import type { ApiError, PaginatedData } from '@/types';
import { type Player, type PlayerFilters, PLAYER_STATUS_OPTIONS } from '@/types/player.types';

const formatDate = (value?: string | null): string => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const StatusBadge: FC<{ status: Player['status'] }> = ({ status }) => {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-500/20 text-green-300 border border-green-500/40',
    INACTIVE: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    BLOCKED: 'bg-red-500/20 text-red-300 border border-red-500/40',
    'N/A': 'bg-slate-500/20 text-slate-300 border border-slate-500/40',
  };
  return (
    <span
      className={`inline-flex min-w-[70px] justify-center items-center px-3 py-1.5 rounded-full text-xs ${
        map[status] ?? map['N/A']
      }`}
    >
      {status === 'N/A' ? 'N/A' : status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
};

const defaultFilters: PlayerFilters = { search: '', status: '', country: '' };

const PlayerTableList: FC = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<PlayerFilters>(defaultFilters);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getPlayers = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<PaginatedData<Player>>('/players/paginate', {
        page,
        limit,
        search: filters.search || undefined,
        status: filters.status || undefined,
        country: filters.country || undefined,
      });
      if (response?.success && response?.data) {
        setPlayers(response.data.data);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotal(response.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Get players error:', err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applyFilters = () => {
    setPage(1);
    setTimeout(() => getPlayers(), 0);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
    setTimeout(() => getPlayers(), 0);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiService.delete(`/players/${id}`);
      if (response?.success) {
        toast.success(response.message || 'Player deleted');
        getPlayers();
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to delete player');
    } finally {
      setOpenMenu(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 w-full">
        <div className="flex justify-between items-center mb-6">
          <PageHeaderBreadcrumb
            title="Players"
            items={[{ label: 'Home', clickable: true }, { label: 'Players' }]}
          />
          <AdminOnly>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
              + Create New Player
            </button>
          </AdminOnly>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-md p-4 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Search</label>
              <div className="relative">
                <input
                  placeholder="Player ID, username, name, email…"
                  className="w-full pl-3 pr-9 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
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
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                {PLAYER_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Country</label>
              <input
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                value={filters.country}
                onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
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
                className="px-4 py-2 rounded text-red-400 text-sm hover:bg-red-500/10"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-700 rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Player ID</th>
                <th className="p-3 text-left">Username</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Registration Date</th>
                <th className="p-3 text-left">Country</th>
                <th className="p-3 text-left">City</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    Loading players...
                  </td>
                </tr>
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    No players found
                  </td>
                </tr>
              ) : (
                players.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-slate-700 hover:bg-slate-800/40 cursor-pointer"
                    onClick={() => navigate(`/players/${p.id}`)}
                  >
                    <td className="p-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="p-3 relative">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-300">{p.player_id}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === p.id ? null : p.id);
                          }}
                          className="p-1 rounded hover:bg-slate-700"
                        >
                          <MoreVertical size={15} />
                        </button>
                      </div>
                      {openMenu === p.id && (
                        <div
                          ref={menuRef}
                          className="absolute left-6 top-9 z-10 w-36 bg-slate-800 border border-slate-700 rounded shadow-lg text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="block w-full text-left px-3 py-2 hover:bg-slate-700"
                            onClick={() => navigate(`/players/${p.id}`)}
                          >
                            View Profile
                          </button>
                          <AdminOnly>
                            <button
                              className="block w-full text-left px-3 py-2 text-red-400 hover:bg-slate-700"
                              onClick={() => handleDelete(p.id)}
                            >
                              Delete
                            </button>
                          </AdminOnly>
                        </div>
                      )}
                    </td>
                    <td className="p-3">{p.username}</td>
                    <td className="p-3">{p.name || '-'}</td>
                    <td className="p-3">{p.email || '-'}</td>
                    <td className="p-3">{formatDate(p.registration_date)}</td>
                    <td className="p-3">{p.country || '-'}</td>
                    <td className="p-3">{p.city || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-4 mt-4 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Rows per page</span>
            <select
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          <span>
            <span className="font-semibold">Total:</span> {total}
          </span>
        </div>

        {showCreate && (
          <CreatePlayerModal onClose={() => setShowCreate(false)} onSuccess={getPlayers} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default PlayerTableList;
