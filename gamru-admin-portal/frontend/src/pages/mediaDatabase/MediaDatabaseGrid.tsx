import { useCallback, useEffect, useState } from 'react';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import apiService from '@/services/api';
import Pagination from '@/components/Pagination';
import { toast } from 'react-toastify';
import { ApiError, PaginatedData } from '@/types';
import { DeleteRecord } from '@/components/DeleteRecord';
import AdminOnly from '@/components/AdminOnly';

import {
  categoryOptions,
  MediaDatabase,
  MediaDatabaseErrors,
  MediaDatabaseForm,
} from '@/types/medaiDatabase.types';

import CreateMediaDatabase from '@/components/modals/mediaDatabase/CreateMediaDatabase';
import MediaCard from '@/components/mediaDatabase/MediaCard';

interface Props {
  title: string;
  /** Fixed folder/category for a specific tab. Omit for the "All" tab. */
  category?: string;
}

const folderOptions = categoryOptions.filter((x) => x.value !== 'all');

const buildDefaultForm = (category?: string): MediaDatabaseForm => ({
  name: '',
  description: '',
  imageUrl: '',
  category: category ?? '',
  createdAt: '',
  createdBy: '',
});

const MediaDatabaseGrid = ({ title, category }: Props) => {
  const [allMedia, setAllMedia] = useState<MediaDatabase[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(25);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [form, setForm] = useState<MediaDatabaseForm>(buildDefaultForm(category));
  const [errors, setErrors] = useState<MediaDatabaseErrors>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const openCreateModal = () => setShowCreateModal(true);

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setForm(buildDefaultForm(category));
    setErrors({});
  };

  const validate = (): MediaDatabaseErrors => {
    const err: MediaDatabaseErrors = {};
    if (!form.name.trim()) err.name = 'File name is required';
    if (!form.category) err.category = 'Folder is required';
    if (!form.file) err.imageUrl = 'Please select image';
    return err;
  };

  // Debounce search; reset to first page on change.
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [categoryFilter]);

  const effectiveCategory = category ?? categoryFilter;

  const fetchMedia = useCallback(async () => {
    try {
      setFetching(true);
      const response = await apiService.get<PaginatedData<MediaDatabase>>(
        '/media-database/paginate',
        {
          page,
          limit,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          category: effectiveCategory || 'all',
        }
      );
      if (response?.success && response?.data) {
        setAllMedia(response.data.data);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotal(response.data.pagination?.total || 0);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load media');
    } finally {
      setFetching(false);
    }
  }, [page, limit, debouncedSearch, effectiveCategory]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleCreate = async () => {
    const err = validate();
    if (Object.keys(err).length) {
      setErrors(err);
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('description', form.description || '');
      formData.append('category', form.category || '');
      if (form.file) formData.append('image', form.file);

      const response = await apiService.post('/media-database/add', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response?.success) {
        toast.success(response.message || 'File uploaded successfully');
        closeCreateModal();
        if (page === 1) {
          fetchMedia();
        } else {
          setPage(1);
        }
        return;
      }
      closeCreateModal();
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string): void => {
    DeleteRecord({
      endpoint: `/media-database/${id}`,
      successMessage: 'File deleted',
      onSuccess: fetchMedia,
    });
  };

  return (
    <div className="px-4 w-full">
      <div className="flex justify-between items-center mb-6">
        <PageHeaderBreadcrumb
          title={title}
          items={[{ label: 'Home', clickable: true }, { label: title }]}
        />

        <AdminOnly>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white text-sm"
          >
            + Create Media
          </button>
        </AdminOnly>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          placeholder="Search media..."
          className="w-72 px-4 py-2 rounded bg-slate-800 border border-slate-700 text-sm text-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {!category && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 rounded bg-slate-800 border border-slate-700 text-sm text-slate-200"
          >
            <option value="">All Folders</option>
            {folderOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        <span className="text-xs text-slate-400 ml-auto">
          {fetching ? 'Loading…' : `${total} file${total === 1 ? '' : 's'}`}
        </span>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          {allMedia.length === 0 ? (
            <div className="text-center text-slate-400 py-16">
              {fetching ? 'Loading…' : 'No media found'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
              {allMedia.map((item) => (
                <MediaCard key={item.id} item={item} onDelete={handleDelete} />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {showCreateModal && (
        <CreateMediaDatabase
          form={form}
          setForm={setForm}
          errors={errors}
          onSave={handleCreate}
          loading={loading}
          closeCreateModal={closeCreateModal}
          categoryOptions={folderOptions}
          lockCategory={Boolean(category)}
        />
      )}
    </div>
  );
};

export default MediaDatabaseGrid;
