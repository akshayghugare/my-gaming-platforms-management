import { useEffect, useState, useRef, type FC } from 'react';
import { toast } from 'react-toastify';
import { MoreVertical, Search, Trash2, X } from 'lucide-react';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import Pagination from '@/components/Pagination';
import AdminOnly from '@/components/AdminOnly';
import ModalSelect from '@/components/dropdowns/ModalSelect';
import ModalInput from '@/components/inputs/ModalInput';
import apiService from '@/services/api';
import type { ApiError, PaginatedData } from '@/types';
import {
  type FrequencyCap,
  type FrequencyCapForm,
  type FrequencyCapErrors,
  FREQUENCY_CAP_CHANNEL_OPTIONS,
  FREQUENCY_CAP_PERIOD_OPTIONS,
  channelLabel,
  periodLabel,
} from '@/types/frequencyCap.types';

const emptyForm: FrequencyCapForm = { channel: '', period: '', limit: '' };

const FrequencyCapTableList: FC = () => {
  const [items, setItems] = useState<FrequencyCap[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('');
  const [period, setPeriod] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FrequencyCapForm>(emptyForm);
  const [errors, setErrors] = useState<FrequencyCapErrors>({});
  const [saving, setSaving] = useState(false);

  const getItems = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<PaginatedData<FrequencyCap>>(
        '/frequency-caps/paginate',
        {
          page,
          limit,
          search: search || undefined,
          channel: channel || undefined,
          period: period || undefined,
        }
      );
      if (response?.success && response?.data) {
        setItems(response.data.data);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Get frequency caps error:', err as ApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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
    getItems();
  };

  const clearFilters = () => {
    setSearch('');
    setChannel('');
    setPeriod('');
    setPage(1);
    setTimeout(() => getItems(), 0);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (c: FrequencyCap) => {
    setOpenMenu(null);
    setEditId(c.id);
    setForm({ channel: c.channel, period: c.period, limit: String(c.limit) });
    setErrors({});
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const err: FrequencyCapErrors = {};
    if (!form.channel) err.channel = 'Channel is required';
    if (!form.period) err.period = 'Period is required';
    if (!form.limit || Number(form.limit) < 1) err.limit = 'Enter a valid limit';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const payload = {
      channel: form.channel,
      period: form.period,
      limit: Number(form.limit),
    };
    try {
      setSaving(true);
      const response = editId
        ? await apiService.post(`/frequency-caps/update-by/${editId}`, payload)
        : await apiService.post('/frequency-caps/add', payload);
      if (response?.success) {
        toast.success(
          response.message || (editId ? 'Frequency cap updated' : 'Frequency cap created')
        );
        setModalOpen(false);
        getItems();
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to save frequency cap');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await apiService.delete(`/frequency-caps/${id}`);
      if (response?.success) {
        toast.success(response.message || 'Frequency cap deleted');
        getItems();
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to delete frequency cap');
    } finally {
      setOpenMenu(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 w-full">
        <div className="flex justify-between items-center mb-6">
          <PageHeaderBreadcrumb
            title="Frequency Cap"
            items={[
              { label: 'Home', clickable: true },
              { label: 'CRM' },
              { label: 'Frequency Cap' },
            ]}
          />
          <AdminOnly>
            <button
              onClick={openCreate}
              className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-700"
            >
              Add Frequency Cap
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
                  className="w-full pl-3 pr-9 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                />
                <Search
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Channel</label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                <option value="">All Channels</option>
                {FREQUENCY_CAP_CHANNEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Period</label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="">All Periods</option>
                {FREQUENCY_CAP_PERIOD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
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
                className="flex items-center gap-1 px-4 py-2 rounded text-red-400 text-sm hover:bg-red-500/10"
              >
                <Trash2 size={14} /> Clear
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-700 rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="p-3 text-left">Channel</th>
                <th className="p-3 text-left">Limit</th>
                <th className="p-3 text-left">Period</th>
                <th className="p-3 text-left" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">
                    Loading frequency caps...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400">
                    <p className="font-semibold text-slate-300">No results found.</p>
                    <p className="text-xs mt-1">
                      What you searched for was unfortunately not found. Please try another
                      combination.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((c) => (
                  <tr key={c.id} className="border-t border-slate-700 hover:bg-slate-800/40">
                    <td className="p-3 font-medium text-blue-300 underline">
                      <button onClick={() => openEdit(c)}>{channelLabel(c.channel)}</button>
                    </td>
                    <td className="p-3">{c.limit}</td>
                    <td className="p-3">{periodLabel(c.period)}</td>
                    <td className="p-3 relative">
                      <AdminOnly
                        fallback={
                          <span className="block text-right text-xs text-slate-500">View only</span>
                        }
                      >
                        <button
                          onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)}
                          className="p-1 rounded hover:bg-slate-700"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenu === c.id && (
                          <div
                            ref={menuRef}
                            className="absolute right-6 top-8 z-10 w-32 bg-slate-800 border border-slate-700 rounded shadow-lg text-sm"
                          >
                            <button
                              className="block w-full text-left px-3 py-2 hover:bg-slate-700"
                              onClick={() => openEdit(c)}
                            >
                              Edit
                            </button>
                            <button
                              className="block w-full text-left px-3 py-2 text-red-400 hover:bg-slate-700"
                              onClick={() => handleDelete(c.id)}
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

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Create / Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-slate-900 p-6 rounded-lg w-full max-w-md border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-bold text-lg">
                {editId ? 'Edit Frequency Cap' : 'Create Frequency Cap'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              With the following settings, you can limit the amount of messages that a player can
              receive per communication channel, in a specific timeframe.
            </p>

            <div className="flex flex-col gap-4">
              <ModalSelect
                label="Channel"
                value={form.channel}
                options={FREQUENCY_CAP_CHANNEL_OPTIONS}
                onChange={(v) => setForm({ ...form, channel: v as FrequencyCapForm['channel'] })}
                error={errors.channel}
              />
              <ModalSelect
                label="Period"
                value={form.period}
                options={FREQUENCY_CAP_PERIOD_OPTIONS}
                onChange={(v) => setForm({ ...form, period: v as FrequencyCapForm['period'] })}
                error={errors.period}
              />
              <ModalInput
                label="Limit"
                type="number"
                value={form.limit}
                onChange={(v) => setForm({ ...form, limit: v })}
                error={errors.limit}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModalOpen(false)} className="text-red-400 text-sm">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 px-5 py-2 rounded-full text-white text-sm disabled:opacity-60"
              >
                {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default FrequencyCapTableList;
