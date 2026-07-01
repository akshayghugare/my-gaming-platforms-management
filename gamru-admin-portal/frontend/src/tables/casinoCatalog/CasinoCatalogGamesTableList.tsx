import { useCallback, useEffect, useState, useRef, type FC } from 'react';
import { toast } from 'react-toastify';
import Pagination from '@/components/Pagination';
import CreateCatalogCasinoGame from '@/components/modals/casinoCatalog/CreateCatalogCasinoGame';
import {
  CasinoCatalogGame,
  CasinoCatalogGameFormData,
  CasinoCatalogGameFormErrors,
} from '@/types/casinoCatalog.types';
import { DeleteRecord } from '@/components/DeleteRecord';
import type { ApiError } from '@/types';
import { casinoGamesApi, type CasinoGameRecord } from '@/services/casinoCatalog.api';
import AdminOnly from '@/components/AdminOnly';

// ─── Badge styles ─────────────────────────────────────────────────────────────
const DEVICE_BADGE: Record<string, string> = {
  mobile: 'bg-green-500/20 text-green-400',
  desktop: 'bg-blue-500/20 text-blue-400',
};

const LIMIT = 10;

// ─── Default blank form ───────────────────────────────────────────────────────
const BLANK_GAME_FORM: CasinoCatalogGameFormData = {
  id: '',
  name: '',
  provider: '',
  category: '',
  gameThumbnail: '',
  tournamentWidgetThumbnail: '',
  bonusBuyAllow: false,
  deviceSupport: { mobile: false, desktop: false },
};

// API record → UI model
const toGame = (r: CasinoGameRecord): CasinoCatalogGame => ({
  id: r.id,
  name: r.name,
  provider: r.provider,
  category: r.category,
  image: r.game_thumbnail ?? undefined,
  gameThumbnail: r.game_thumbnail ?? undefined,
  tournamentWidgetThumbnail: r.tournament_widget_thumbnail ?? undefined,
  bonusBuyAllow: r.bonus_buy_allow,
  deviceSupport: r.device_support ?? { mobile: false, desktop: false },
});

interface CasinoCatalogGamesTableListProps {
  isCreateModalOpen: boolean;
  onCreateModalClose: () => void;
}

const CasinoCatalogGamesTableList: FC<CasinoCatalogGamesTableListProps> = ({
  isCreateModalOpen,
  onCreateModalClose,
}) => {
  const [games, setGames] = useState<CasinoCatalogGame[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetching, setFetching] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterProvider, setFilterProvider] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CasinoCatalogGameFormData>(BLANK_GAME_FORM);
  const [formErrors, setFormErrors] = useState<CasinoCatalogGameFormErrors>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLTableDataCellElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounce search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchGames = useCallback(async () => {
    try {
      setFetching(true);
      const res = await casinoGamesApi.paginate({
        page,
        limit: LIMIT,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(filterProvider ? { provider: filterProvider } : {}),
        ...(filterCategory ? { category: filterCategory } : {}),
      });
      if (res?.success && res?.data) {
        setGames(res.data.data.map(toGame));
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load games');
    } finally {
      setFetching(false);
    }
  }, [page, debouncedSearch, filterProvider, filterCategory]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  useEffect(() => {
    if (isCreateModalOpen) {
      setEditId(null);
      setForm(BLANK_GAME_FORM);
      setFormErrors({});
    }
  }, [isCreateModalOpen]);

  const isModalOpen = isCreateModalOpen || editId !== null;

  const handleCloseModal = () => {
    setEditId(null);
    setForm(BLANK_GAME_FORM);
    setFormErrors({});
    onCreateModalClose();
  };

  const validate = (): boolean => {
    const errs: CasinoCatalogGameFormErrors = {};
    if (!form.id.trim()) errs.id = 'ID is required';
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.provider.trim()) errs.provider = 'Provider is required';
    if (!form.category.trim()) errs.category = 'Category is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaveLoading(true);
    const payloadBody = {
      name: form.name.trim(),
      provider: form.provider.trim(),
      category: form.category.trim(),
      game_thumbnail: form.gameThumbnail?.trim() || null,
      tournament_widget_thumbnail: form.tournamentWidgetThumbnail?.trim() || null,
      bonus_buy_allow: form.bonusBuyAllow,
      device_support: form.deviceSupport,
    };
    try {
      if (editId) {
        await casinoGamesApi.update(editId, payloadBody);
        toast.success('Game updated successfully');
      } else {
        await casinoGamesApi.create({ id: form.id.trim(), ...payloadBody });
        toast.success('Game created successfully');
      }
      handleCloseModal();
      if (!editId && page !== 1) setPage(1);
      else fetchGames();
    } catch (e) {
      toast.error((e as ApiError).message || 'Failed to save game');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (game: CasinoCatalogGame) => {
    setOpenMenuId(null);
    setEditId(game.id);
    setForm({
      id: game.id,
      name: game.name,
      provider: game.provider,
      category: game.category,
      gameThumbnail: game.gameThumbnail ?? '',
      tournamentWidgetThumbnail: game.tournamentWidgetThumbnail ?? '',
      bonusBuyAllow: game.bonusBuyAllow,
      deviceSupport: { ...game.deviceSupport },
    });
    setFormErrors({});
  };

  const handleDeleteConfirm = (id: string) => {
    setOpenMenuId(null);
    DeleteRecord({
      endpoint: `/casino-catalog/games/${id}`,
      successMessage: 'Game deleted',
      onSuccess: fetchGames,
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="relative">
          <input
            className="w-full px-3 py-2 pl-9 bg-slate-800 border border-slate-700 rounded text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 text-slate-200"
            placeholder="Name or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="relative">
          <select
            className="w-full appearance-none px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            value={filterProvider}
            onChange={(e) => {
              setFilterProvider(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Providers</option>
            <option value="PragmaticPlay">PragmaticPlay</option>
            <option value="RedTiger">Red Tiger</option>
            <option value="KAGaming">KAGaming</option>
          </select>
          <svg
            className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <div className="relative">
          <select
            className="w-full appearance-none px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            <option value="slots">Slots</option>
            <option value="table_games">Table Games</option>
            <option value="live_casino">Live Casino</option>
          </select>
          <svg
            className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-700 rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-slate-800">
            <tr>
              <th className="p-3 text-left text-slate-300 font-medium">ID</th>
              <th className="p-3 text-left text-slate-300 font-medium">Image</th>
              <th className="p-3 text-left text-slate-300 font-medium">Name</th>
              <th className="p-3 text-left text-slate-300 font-medium">Provider</th>
              <th className="p-3 text-left text-slate-300 font-medium">Category</th>
              <th className="p-3 text-left text-slate-300 font-medium">Device Support</th>
              <th className="p-3 text-left text-slate-300 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {games.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-400">
                  {fetching ? 'Loading…' : 'No games found'}
                </td>
              </tr>
            ) : (
              games.map((game) => (
                <tr
                  key={game.id}
                  className="border-t border-slate-700 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="p-3 text-xs text-slate-400 font-mono">{game.id}</td>
                  <td className="p-3">
                    {game.image ? (
                      <img
                        src={game.image}
                        alt={game.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center text-slate-500 text-xs">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-medium text-blue-400">{game.name}</td>
                  <td className="p-3 text-slate-300">{game.provider}</td>
                  <td className="p-3 text-slate-300 capitalize">
                    {game.category.replace('_', ' ')}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {game.deviceSupport?.mobile && (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${DEVICE_BADGE.mobile}`}
                        >
                          Mobile
                        </span>
                      )}
                      {game.deviceSupport?.desktop && (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${DEVICE_BADGE.desktop}`}
                        >
                          Desktop
                        </span>
                      )}
                      {!game.deviceSupport?.mobile && !game.deviceSupport?.desktop && (
                        <span className="text-slate-500">—</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 relative" ref={openMenuId === game.id ? menuRef : undefined}>
                    <AdminOnly
                      fallback={
                        <span className="block text-right text-xs text-slate-500">View only</span>
                      }
                    >
                      <button
                        className="p-1.5 rounded hover:bg-slate-700 transition-colors text-slate-400"
                        onClick={() => setOpenMenuId(openMenuId === game.id ? null : game.id)}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </button>
                      {openMenuId === game.id && (
                        <div className="absolute right-8 top-1 z-20 bg-slate-800 border border-slate-700 rounded shadow-lg min-w-[110px]">
                          <button
                            className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                            onClick={() => handleEdit(game)}
                          >
                            <svg
                              className="w-4 h-4 text-blue-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </button>
                          <button
                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
                            onClick={() => handleDeleteConfirm(game.id)}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
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

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <CreateCatalogCasinoGame
        isOpen={isModalOpen}
        closeModal={handleCloseModal}
        form={form}
        setForm={setForm}
        errors={formErrors}
        onSave={handleSave}
        loading={saveLoading}
        editId={editId}
      />
    </>
  );
};

export default CasinoCatalogGamesTableList;
