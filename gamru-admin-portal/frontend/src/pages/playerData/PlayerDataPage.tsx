import { useEffect, useState, type FC, type ChangeEvent } from 'react';
import { toast } from 'react-toastify';
import { Search, Pencil, X, Upload, ChevronUp } from 'lucide-react';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import Pagination from '@/components/Pagination';
import ModalInput from '@/components/inputs/ModalInput';
import ModalTextarea from '@/components/inputs/ModalTextarea';
import ModalSelect from '@/components/dropdowns/ModalSelect';
import AdminOnly from '@/components/AdminOnly';
import apiService from '@/services/api';
import type { ApiError, PaginatedData } from '@/types';
import {
  type PlayerData,
  type PlayerDataForm,
  type PlayerDataErrors,
  type PlayerDataType,
  PLAYER_DATA_TYPE_OPTIONS,
  dataTypeBadgeClass,
  dataTypeLabel,
} from '@/types/playerData.types';

const emptyForm: PlayerDataForm = { name: '', description: '', data_type: '' };

interface CsvRow {
  name: string;
  data_type: PlayerDataType;
  description?: string;
}

const parseCsv = (text: string): CsvRow[] => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const ni = headers.indexOf('name');
  const ti = headers.indexOf('data_type');
  const di = headers.indexOf('description');
  if (ni === -1 || ti === -1) return [];

  const valid: PlayerDataType[] = ['STRING', 'BOOLEAN', 'NUMBER', 'DATE'];
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    const name = cols[ni];
    const dt = (cols[ti] || '').toUpperCase() as PlayerDataType;
    if (!name || !valid.includes(dt)) continue;
    rows.push({
      name,
      data_type: dt,
      description: di !== -1 ? cols[di] : undefined,
    });
  }
  return rows;
};

const DataTable: FC<{
  title: string;
  rows: PlayerData[];
  loading: boolean;
  onEdit?: (row: PlayerData) => void;
  footer?: React.ReactNode;
}> = ({ title, rows, loading, onEdit, footer }) => (
  <div className="border border-slate-700 rounded-md mb-6 bg-slate-800/30">
    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
      <ChevronUp size={16} className="text-slate-400" />
      <h3 className="font-semibold text-sm">{title}</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-800">
          <tr>
            <th className="p-3 text-left w-40">Data Type</th>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Data Option</th>
            <th className="p-3 text-left w-16" />
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4} className="p-6 text-center text-slate-400">
                Loading...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="p-6 text-center text-slate-400">
                No data
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-700 hover:bg-slate-800/40">
                <td className="p-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${dataTypeBadgeClass(
                      r.data_type
                    )}`}
                  >
                    {dataTypeLabel(r.data_type)}
                  </span>
                </td>
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.data_option || '-'}</td>
                <td className="p-3">
                  {onEdit && (
                    <AdminOnly
                      fallback={
                        <span className="block text-right text-xs text-slate-500">View only</span>
                      }
                    >
                      <button
                        onClick={() => onEdit(r)}
                        className="p-2 rounded-full bg-slate-700 hover:bg-slate-600"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                    </AdminOnly>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    {footer}
  </div>
);

const PlayerDataPage: FC = () => {
  const [search, setSearch] = useState('');
  const [dataType, setDataType] = useState('');

  const [custom, setCustom] = useState<PlayerData[]>([]);
  const [customPage, setCustomPage] = useState(1);
  const [customTotalPages, setCustomTotalPages] = useState(1);
  const [customTotal, setCustomTotal] = useState(0);
  const [loadingCustom, setLoadingCustom] = useState(false);

  const [system, setSystem] = useState<PlayerData[]>([]);
  const [systemPage, setSystemPage] = useState(1);
  const [systemTotalPages, setSystemTotalPages] = useState(1);
  const [loadingSystem, setLoadingSystem] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PlayerDataForm>(emptyForm);
  const [errors, setErrors] = useState<PlayerDataErrors>({});
  const [saving, setSaving] = useState(false);

  const [csvOpen, setCsvOpen] = useState(false);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [importing, setImporting] = useState(false);

  const fetchCustom = async () => {
    try {
      setLoadingCustom(true);
      const res = await apiService.get<PaginatedData<PlayerData>>('/player-data/paginate', {
        page: customPage,
        limit: 25,
        is_custom: true,
        search: search || undefined,
        data_type: dataType || undefined,
      });
      if (res?.success && res?.data) {
        setCustom(res.data.data);
        setCustomTotalPages(res.data.pagination?.totalPages || 1);
        setCustomTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Get custom data error:', err as ApiError);
    } finally {
      setLoadingCustom(false);
    }
  };

  const fetchSystem = async () => {
    try {
      setLoadingSystem(true);
      const res = await apiService.get<PaginatedData<PlayerData>>('/player-data/paginate', {
        page: systemPage,
        limit: 25,
        is_custom: false,
        search: search || undefined,
        data_type: dataType || undefined,
      });
      if (res?.success && res?.data) {
        setSystem(res.data.data);
        setSystemTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Get player data error:', err as ApiError);
    } finally {
      setLoadingSystem(false);
    }
  };

  useEffect(() => {
    fetchCustom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customPage]);

  useEffect(() => {
    fetchSystem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemPage]);

  const applyFilters = () => {
    setCustomPage(1);
    setSystemPage(1);
    setTimeout(() => {
      fetchCustom();
      fetchSystem();
    }, 0);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (row: PlayerData) => {
    setEditId(row.id);
    setForm({
      name: row.name,
      description: row.description ?? '',
      data_type: row.data_type,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const err: PlayerDataErrors = {};
    if (!form.name.trim()) err.name = 'Name is required';
    if (!form.data_type) err.data_type = 'Data type is required';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const payload = {
      name: form.name,
      description: form.description || null,
      data_type: form.data_type,
    };
    try {
      setSaving(true);
      const res = editId
        ? await apiService.post(`/player-data/update-by/${editId}`, payload)
        : await apiService.post('/player-data/add', payload);
      if (res?.success) {
        toast.success(res.message || (editId ? 'Custom data updated' : 'Custom data created'));
        setModalOpen(false);
        fetchCustom();
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to save custom data');
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) {
      toast.error('No valid rows found. Expected headers: name, data_type, description');
    }
    setCsvRows(rows);
  };

  const handleImport = async () => {
    if (csvRows.length === 0) {
      toast.error('Please upload a CSV with valid rows first');
      return;
    }
    try {
      setImporting(true);
      const res = await apiService.post('/player-data/bulk', { rows: csvRows });
      if (res?.success) {
        toast.success(res.message || `${csvRows.length} rows imported`);
        setCsvOpen(false);
        setCsvRows([]);
        setCsvFileName('');
        fetchCustom();
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to import custom data');
    } finally {
      setImporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 w-full">
        <div className="flex justify-between items-center mb-6">
          <PageHeaderBreadcrumb
            title="Player Data"
            items={[{ label: 'Home', clickable: true }, { label: 'CRM' }, { label: 'Player Data' }]}
          />
          <AdminOnly>
            <div className="flex gap-3 items-center">
              <button
                onClick={() => setCsvOpen(true)}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"
              >
                <Upload size={15} /> Assign Data Via CSV
              </button>
              <button
                onClick={openCreate}
                className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Create Custom Data
              </button>
            </div>
          </AdminOnly>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-6">
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
            <label className="text-xs text-slate-400 block mb-1">Data Type</label>
            <select
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
            >
              <option value="">All Types</option>
              {PLAYER_DATA_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={applyFilters}
            className="bg-blue-600 px-4 py-2 rounded text-white text-sm h-[38px] w-fit"
          >
            Apply
          </button>
        </div>

        <DataTable
          title="Custom Data"
          rows={custom}
          loading={loadingCustom}
          onEdit={openEdit}
          footer={
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700 text-sm text-slate-400">
              <span>Total: {customTotal}</span>
              <Pagination
                page={customPage}
                totalPages={customTotalPages}
                onPageChange={setCustomPage}
              />
            </div>
          }
        />

        <DataTable
          title="Player Data"
          rows={system}
          loading={loadingSystem}
          footer={
            <div className="px-4 py-3 border-t border-slate-700">
              <Pagination
                page={systemPage}
                totalPages={systemTotalPages}
                onPageChange={setSystemPage}
              />
            </div>
          }
        />
      </div>

      {/* Create / Edit Custom Data modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-slate-900 p-6 rounded-lg w-full max-w-md border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">
                {editId ? 'Edit Custom Data' : 'Create Custom Data'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <ModalInput
                label="Name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                error={errors.name}
              />
              <ModalTextarea
                label="Description"
                value={form.description}
                onChange={(v) => setForm({ ...form, description: v })}
              />
              <ModalSelect
                label="Data Type"
                value={form.data_type}
                options={PLAYER_DATA_TYPE_OPTIONS}
                onChange={(v) => setForm({ ...form, data_type: v as PlayerDataType })}
                error={errors.data_type}
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

      {/* Assign Data Via CSV modal */}
      {csvOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
          onClick={() => setCsvOpen(false)}
        >
          <div
            className="bg-slate-900 p-6 rounded-lg w-full max-w-lg border border-blue-500/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-1">
              <h2 className="font-bold text-lg">Assign Data Via CSV</h2>
              <button onClick={() => setCsvOpen(false)} className="text-slate-400">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Please upload a CSV file with the appropriate format. Headers:{' '}
              <code className="text-slate-300">name, data_type, description</code>
            </p>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-lg py-10 cursor-pointer hover:border-blue-500">
              <Upload size={28} className="text-blue-400 mb-2" />
              <span className="text-sm text-blue-400 font-medium">Browse Files</span>
              <span className="text-xs text-slate-500 mt-2">
                Maximum file size is 10 MB &middot; .csv file
              </span>
              {csvFileName && (
                <span className="text-xs text-slate-300 mt-2">
                  {csvFileName} — {csvRows.length} valid rows
                </span>
              )}
              <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </label>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setCsvOpen(false)} className="text-red-400 text-sm">
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || csvRows.length === 0}
                className="bg-blue-600 px-5 py-2 rounded-full text-white text-sm disabled:opacity-60"
              >
                {importing ? 'Importing...' : 'Review CSV Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default PlayerDataPage;
