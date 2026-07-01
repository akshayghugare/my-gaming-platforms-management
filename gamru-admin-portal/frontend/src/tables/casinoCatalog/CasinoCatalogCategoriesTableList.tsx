import { useCallback, useEffect, useState, useRef, type FC } from 'react';
import { toast } from 'react-toastify';
import Pagination from '@/components/Pagination';
import CreateCatalogCasinoCategory from '@/components/modals/casinoCatalog/CreateCatalogCasinoCategory';
import {
  CasinoCatalogCategory,
  CasinoCatalogCategoryFormData,
  CasinoCatalogCategoryFormErrors,
} from '@/types/casinoCatalog.types';
import { DeleteRecord } from '@/components/DeleteRecord';
import type { ApiError } from '@/types';
import { casinoCategoriesApi } from '@/services/casinoCatalog.api';
import AdminOnly from '@/components/AdminOnly';

const BLANK_FORM: CasinoCatalogCategoryFormData = { id: '', name: '' };
const LIMIT = 10;

interface CasinoCatalogCategoriesTableListProps {
  isCreateModalOpen: boolean;
  onCreateModalClose: () => void;
}

const CasinoCatalogCategoriesTableList: FC<CasinoCatalogCategoriesTableListProps> = ({
  isCreateModalOpen,
  onCreateModalClose,
}) => {
  const [categories, setCategories] = useState<CasinoCatalogCategory[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetching, setFetching] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CasinoCatalogCategoryFormData>(BLANK_FORM);
  const [formErrors, setFormErrors] = useState<CasinoCatalogCategoryFormErrors>({});
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

  const fetchCategories = useCallback(async () => {
    try {
      setFetching(true);
      const res = await casinoCategoriesApi.paginate({
        page,
        limit: LIMIT,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      if (res?.success && res?.data) {
        setCategories(res.data.data);
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load categories');
    } finally {
      setFetching(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
    const errs: CasinoCatalogCategoryFormErrors = {};
    if (!form.id.trim()) errs.id = 'ID is required';
    if (!form.name.trim()) errs.name = 'Name is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaveLoading(true);
    try {
      if (editId) {
        await casinoCategoriesApi.update(editId, { name: form.name.trim() });
        toast.success('Category updated successfully');
      } else {
        await casinoCategoriesApi.create({ id: form.id.trim(), name: form.name.trim() });
        toast.success('Category created successfully');
      }
      handleCloseModal();
      if (!editId && page !== 1) setPage(1);
      else fetchCategories();
    } catch (e) {
      toast.error((e as ApiError).message || 'Failed to save category');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEdit = (cat: CasinoCatalogCategory) => {
    setOpenMenuId(null);
    setEditId(cat.id);
    setForm({ id: cat.id, name: cat.name });
    setFormErrors({});
  };

  const handleDeleteConfirm = (id: string) => {
    setOpenMenuId(null);
    DeleteRecord({
      endpoint: `/casino-catalog/categories/${id}`,
      successMessage: 'Category deleted',
      onSuccess: fetchCategories,
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
      </div>

      <div className="overflow-x-auto border border-slate-700 rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-slate-800">
            <tr>
              <th className="p-3 text-left text-slate-300 font-medium">ID</th>
              <th className="p-3 text-left text-slate-300 font-medium">Name</th>
              <th className="p-3 text-left text-slate-300 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-slate-400">
                  {fetching ? 'Loading…' : 'No categories found'}
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-t border-slate-700 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="p-3 text-slate-400 font-mono text-xs">{cat.id}</td>
                  <td className="p-3 font-medium text-blue-400">{cat.name}</td>
                  <td className="p-3 relative" ref={openMenuId === cat.id ? menuRef : undefined}>
                    <AdminOnly
                      fallback={
                        <span className="block text-right text-xs text-slate-500">View only</span>
                      }
                    >
                      <button
                        className="p-1.5 rounded hover:bg-slate-700 transition-colors text-slate-400"
                        onClick={() => setOpenMenuId(openMenuId === cat.id ? null : cat.id)}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </button>
                      {openMenuId === cat.id && (
                        <div className="absolute right-8 top-1 z-20 bg-slate-800 border border-slate-700 rounded shadow-lg min-w-[110px]">
                          <button
                            className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                            onClick={() => handleEdit(cat)}
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
                            onClick={() => handleDeleteConfirm(cat.id)}
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

      <CreateCatalogCasinoCategory
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

export default CasinoCatalogCategoriesTableList;
