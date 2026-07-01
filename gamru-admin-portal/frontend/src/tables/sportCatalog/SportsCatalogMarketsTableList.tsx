import { useCallback, useEffect, useState, useRef, type FC } from 'react';
import { toast } from 'react-toastify';
import Pagination from '@/components/Pagination';
import { DeleteRecord } from '@/components/DeleteRecord';
import {
  SportsCatalogMarket,
  SportsCatalogMarketsFormData,
  SportsCatalogMarketsFormErrors,
} from '@/types/sportsCatalog.types';
import CreateSportsCatalogMarket from '@/components/modals/sportsCatalog/CreateSportsCatalogMarket';
import type { ApiError } from '@/types';
import { sportMarketsApi } from '@/services/sportCatalog.api';
import AdminOnly from '@/components/AdminOnly';

const BLANK_FORM: SportsCatalogMarketsFormData = { id: '', name: '' };
const LIMIT = 10;

interface SportCatalogMarketsTableListProps {
  isCreateModalOpen: boolean;
  onCreateModalClose: () => void;
}

const SportsCatalogMarketsTableList: FC<SportCatalogMarketsTableListProps> = ({
  isCreateModalOpen,
  onCreateModalClose,
}) => {
  const [markets, setMarkets] = useState<SportsCatalogMarket[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetching, setFetching] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SportsCatalogMarketsFormData>(BLANK_FORM);
  const [formErrors, setFormErrors] = useState<SportsCatalogMarketsFormErrors>({});
  const [saveLoading, setSaveLoading] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLTableDataCellElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchMarkets = useCallback(async () => {
    try {
      setFetching(true);
      const res = await sportMarketsApi.paginate({
        page,
        limit: LIMIT,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      if (res?.success && res?.data) {
        setMarkets(res.data.data);
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load markets');
    } finally {
      setFetching(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  useEffect(() => {
    if (isCreateModalOpen) {
      setEditId(null);
      setForm(BLANK_FORM);
      setFormErrors({});
    }
  }, [isCreateModalOpen]);

  const isModalOpen = isCreateModalOpen || editId !== null;

  const handleCloseModal = () => {
    setEditId(null);
    setForm(BLANK_FORM);
    setFormErrors({});
    onCreateModalClose();
  };

  const validate = (): boolean => {
    const errs: SportsCatalogMarketsFormErrors = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaveLoading(true);
    try {
      if (editId) {
        await sportMarketsApi.update(editId, { name: form.name.trim() });
        toast.success('Market updated successfully');
      } else {
        await sportMarketsApi.create({ name: form.name.trim() });
        toast.success('Market created successfully');
      }
      handleCloseModal();
      if (!editId && page !== 1) setPage(1);
      else fetchMarkets();
    } catch (e) {
      toast.error((e as ApiError).message || 'Failed to save market');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (item: SportsCatalogMarket) => {
    setOpenMenuId(null);
    setEditId(item.id);
    setForm({ id: item.id, name: item.name });
    setFormErrors({});
  };

  const handleDeleteConfirm = (id: string) => {
    setOpenMenuId(null);
    DeleteRecord({
      endpoint: `/sport-catalog/markets/${id}`,
      successMessage: 'Market deleted',
      onSuccess: fetchMarkets,
    });
  };

  return (
    <>
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="relative">
          <input
            className="w-full px-3 py-2 pl-9 bg-slate-800 border border-slate-700 rounded text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 text-slate-200"
            placeholder="Name"
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
      </div>
      <div className="overflow-x-auto border border-slate-700 rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-slate-800">
            <tr>
              <th className="p-3 text-left text-slate-300 font-medium">Name</th>
              <th className="p-3 text-left text-slate-300 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {markets.length === 0 ? (
              <tr>
                <td colSpan={2} className="p-6 text-center text-slate-400">
                  {fetching ? 'Loading…' : 'No markets found'}
                </td>
              </tr>
            ) : (
              markets.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-slate-700 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="p-3 font-medium text-blue-400">{item.name}</td>
                  <td className="p-3 relative" ref={openMenuId === item.id ? menuRef : undefined}>
                    <AdminOnly
                      fallback={
                        <span className="block text-right text-xs text-slate-500">View only</span>
                      }
                    >
                      <button
                        className="p-1.5 rounded hover:bg-slate-700 transition-colors text-slate-400"
                        onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </button>
                      {openMenuId === item.id && (
                        <div className="absolute right-8 top-1 z-20 bg-slate-800 border border-slate-700 rounded shadow-lg min-w-[110px]">
                          <button
                            className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                            onClick={() => handleEdit(item)}
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
                            onClick={() => handleDeleteConfirm(item.id)}
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

      <CreateSportsCatalogMarket
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

export default SportsCatalogMarketsTableList;
