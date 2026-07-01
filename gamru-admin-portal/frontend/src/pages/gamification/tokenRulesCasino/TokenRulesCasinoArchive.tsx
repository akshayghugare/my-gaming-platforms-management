import { useCallback, useEffect, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import Pagination from '@/components/Pagination';
import { DeleteRecord } from '@/components/DeleteRecord';
import AdminOnly from '@/components/AdminOnly';
import { gamificationApi } from '@/services/gamification.api';
import type { GamificationEntity } from '@/types/gamification.types';
import { tokenRulesCasinoColumns } from './columns';

const api = gamificationApi('token-rules-casino');

// Archive view drops the Status column (matches the live designs).
const columns = tokenRulesCasinoColumns.filter((c) => c.header !== 'Status');

const TokenRulesCasinoArchive: FC = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState<GamificationEntity[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setDebounced(search.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRows = useCallback(async () => {
    try {
      setFetching(true);
      const res = await api.paginate({
        page,
        limit,
        archived: true,
        ...(debounced ? { search: debounced } : {}),
      });
      if (res?.success && res?.data) {
        setRows(res.data.data);
        setTotal(res.data.pagination.total || 0);
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load archived Token Rules (Casino)');
    } finally {
      setFetching(false);
    }
  }, [page, limit, debounced]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleUnarchive = async (row: GamificationEntity) => {
    setMenuId(null);
    try {
      await api.archive(row.id, false);
      toast.success('Unarchived');
      fetchRows();
    } catch {
      toast.error('Action failed');
    }
  };

  const handleDelete = (id: string) => {
    setMenuId(null);
    DeleteRecord({
      endpoint: `/gamification/token-rules-casino/${id}`,
      successMessage: 'Token Rule Casino deleted',
      onSuccess: fetchRows,
    });
  };

  return (
    <DashboardLayout>
      <div className="p-4 w-full">
        <div className="flex items-center justify-between mb-6">
          <PageHeaderBreadcrumb
            title="Token Rules (Casino) Archive"
            items={[
              { label: 'Home', clickable: true },
              { label: 'Gamification' },
              { label: 'Token Rules (Casino)' },
              { label: 'Archive' },
            ]}
          />
          <button
            onClick={() => navigate('/gamification/token-rules-casino')}
            className="px-4 py-2 rounded-full border border-slate-600 text-slate-300 text-sm hover:bg-slate-700"
          >
            Back to Token Rules (Casino)
          </button>
        </div>

        {/* Filters */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Search</label>
              <input
                className="w-60 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-700 rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-amber-700/40">
              <tr>
                {columns.map((c) => (
                  <th key={c.header} className="p-3 text-left text-slate-200 font-medium">
                    {c.header}
                  </th>
                ))}
                <th className="p-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-10 text-center text-slate-400">
                    {fetching ? 'Loading…' : 'No archived Token Rules (Casino).'}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                    {columns.map((c) => (
                      <td key={c.header} className="p-3 text-slate-300">
                        {c.render(row)}
                      </td>
                    ))}
                    <td className="p-3 relative">
                      <AdminOnly
                        fallback={
                          <span className="block text-right text-xs text-slate-500">View only</span>
                        }
                      >
                        <button
                          className="p-1.5 rounded hover:bg-slate-700 text-slate-400"
                          onClick={() => setMenuId(menuId === row.id ? null : row.id)}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="19" r="1.5" />
                          </svg>
                        </button>
                        {menuId === row.id && (
                          <div className="absolute right-8 top-1 z-20 bg-slate-800 border border-slate-700 rounded shadow-lg min-w-[130px]">
                            <button
                              className="w-full text-left px-3 py-2 text-sm text-emerald-400 hover:bg-slate-700"
                              onClick={() => handleUnarchive(row)}
                            >
                              Unarchive
                            </button>
                            <button
                              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-700"
                              onClick={() => handleDelete(row.id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </AdminOnly>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            Rows per page
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="ml-3">Total: {total}</span>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TokenRulesCasinoArchive;
