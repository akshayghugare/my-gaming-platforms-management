import { useCallback, useEffect, useState } from 'react';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import apiService from '@/services/api';
import Pagination from '@/components/Pagination';
import { toast } from 'react-toastify';

import { ApiError, PaginatedData } from '@/types';
import { DeleteRecord } from '@/components/DeleteRecord';
import {
  GamificationTag,
  GamificationTagCategory,
  GamificationTagErrors,
  GamificationTagForm,
  GAMIFICATION_CATEGORY_OPTIONS,
} from '@/types/gamificationTags.types';
import CreateGamificationTag from '@/components/modals/tagsGamification/CreateGamificationTag';
import AdminOnly from '@/components/AdminOnly';

interface Props {
  title: string;
  /** Fixed category for a specific tab. Omit for the "All" tab. */
  category?: GamificationTagCategory;
}

const buildDefaultForm = (category?: GamificationTagCategory): GamificationTagForm => ({
  id: '',
  name: '',
  description: '',
  category: category ?? '',
});

const GamificationTagsTableList = ({ title, category }: Props) => {
  const [tags, setTags] = useState<GamificationTag[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // Category filter is only used on the "All" tab.
  const [categoryFilter, setCategoryFilter] = useState<GamificationTagCategory | ''>('');

  const [form, setForm] = useState<GamificationTagForm>(buildDefaultForm(category));
  const [errors, setErrors] = useState<GamificationTagErrors>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const openCreateModal = () => setShowCreateModal(true);

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setForm(buildDefaultForm(category));
    setErrors({});
  };

  const validate = (): GamificationTagErrors => {
    const err: GamificationTagErrors = {};
    if (!form.name.trim()) err.name = 'Required';
    if (!form.category) err.category = 'Required';
    return err;
  };

  // Debounce the search box (resets to first page on change).
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset paging when the category filter changes ("All" tab only).
  useEffect(() => {
    setPage(1);
  }, [categoryFilter]);

  const effectiveCategory = category ?? categoryFilter;

  const fetchTags = useCallback(async () => {
    try {
      setFetching(true);
      const response = await apiService.get<PaginatedData<GamificationTag>>(
        '/tags-gamification/paginate',
        {
          page,
          limit,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          ...(effectiveCategory ? { category: effectiveCategory } : {}),
        }
      );
      if (response?.success && response?.data) {
        setTags(response.data.data);
        setTotalPages(response.data.pagination.totalPages || 1);
        setTotal(response.data.pagination.total || 0);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load tags');
    } finally {
      setFetching(false);
    }
  }, [page, limit, debouncedSearch, effectiveCategory]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleCreate = async () => {
    const err = validate();
    if (Object.keys(err).length) return setErrors(err);

    try {
      setLoading(true);
      const response = await apiService.post('/tags-gamification/add', {
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        category: form.category,
      });
      if (response?.success) {
        toast.success(response?.message || 'Tag created successfully');
        closeCreateModal();
        if (page === 1) {
          fetchTags();
        } else {
          setPage(1);
        }
        return;
      }
      closeCreateModal();
    } catch (e) {
      const apiErr = e as ApiError;
      toast.error(apiErr.message || 'Failed to create tag');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string): void => {
    DeleteRecord({
      endpoint: `/tags-gamification/${id}`,
      successMessage: 'Tag deleted',
      onSuccess: fetchTags,
    });
  };

  return (
    <div className="px-4 w-full">
      <div className="flex justify-between items-center mb-6">
        <PageHeaderBreadcrumb
          title={title}
          items={[{ label: 'Home', clickable: true }, { label: 'Tags' }]}
        />

        <AdminOnly>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white"
          >
            + Create New Tag
          </button>
        </AdminOnly>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          placeholder="Search tag..."
          className="w-72 px-4 py-2 rounded bg-slate-800 border border-slate-700"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {!category && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as GamificationTagCategory | '')}
            className="px-4 py-2 rounded bg-slate-800 border border-slate-700 text-slate-200"
          >
            <option value="">All Categories</option>
            {GAMIFICATION_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        <span className="text-xs text-slate-400 ml-auto">
          {fetching ? 'Loading…' : `${total} record${total === 1 ? '' : 's'}`}
        </span>
      </div>

      <div className="overflow-x-auto border border-slate-700 rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-slate-800">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-left">Created Date</th>
              <th className="p-3 text-left">Created By</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {tags.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">
                  {fetching ? 'Loading…' : 'No data found'}
                </td>
              </tr>
            ) : (
              tags.map((tag) => (
                <tr key={tag.id} className="border-t border-slate-700">
                  <td className="p-3">{tag.name}</td>
                  <td className="p-3">{tag.description}</td>
                  <td className="p-3 capitalize">{tag.category?.replace('-', ' ')}</td>
                  <td className="p-3">
                    {tag.created_at ? new Date(tag.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-3">{tag.created_by ?? '-'}</td>
                  <td className="p-3">
                    <AdminOnly
                      fallback={
                        <span className="block text-right text-xs text-slate-500">View only</span>
                      }
                    >
                      <button
                        className="bg-red-600 hover:bg-red-500 px-2 py-1 rounded text-xs"
                        onClick={() => handleDelete(tag.id)}
                      >
                        Delete
                      </button>
                    </AdminOnly>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {showCreateModal && (
        <CreateGamificationTag
          form={form}
          setForm={setForm}
          errors={errors}
          onSave={handleCreate}
          loading={loading}
          closeCreateModal={closeCreateModal}
          categoryOptions={GAMIFICATION_CATEGORY_OPTIONS}
          lockCategory={Boolean(category)}
        />
      )}
    </div>
  );
};

export default GamificationTagsTableList;
