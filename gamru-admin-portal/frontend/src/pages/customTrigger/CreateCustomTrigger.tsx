import { useEffect, useState, type FC, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Check } from 'lucide-react';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import ModalInput from '@/components/inputs/ModalInput';
import ModalTextarea from '@/components/inputs/ModalTextarea';
import MultiSelectDropdown from '@/components/inputs/MultiSelectDropdown';
import { useCrmTags } from '@/hooks/useCrmTags';
import apiService from '@/services/api';
import type { ApiError, ApiResponse } from '@/types';
import {
  type CustomTrigger,
  type CustomTriggerErrors,
  type CustomTriggerForm,
  type CustomTriggerStatus,
  CUSTOM_TRIGGER_EVENT_OPTIONS,
} from '@/types/customTrigger.types';

const defaultForm: CustomTriggerForm = {
  name: '',
  trigger: '',
  status: 'INACTIVE',
  description: '',
  tags: [],
  builder: '',
};

const STEPS = [
  { id: 1, title: 'Details' },
  { id: 2, title: 'Builder' },
  { id: 3, title: 'Status' },
];

const StepShell: FC<{
  step: number;
  current: number;
  title: string;
  onHeaderClick: () => void;
  children?: ReactNode;
}> = ({ step, current, title, onHeaderClick, children }) => {
  const active = current === step;
  const done = current > step;
  return (
    <div className="relative pl-10 pb-6">
      <button
        type="button"
        onClick={onHeaderClick}
        className={`absolute left-0 top-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
          active || done ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
        }`}
      >
        {done ? <Check size={14} /> : step}
      </button>
      {step !== STEPS.length && (
        <span className="absolute left-[13px] top-7 bottom-0 w-px bg-slate-700" />
      )}
      <h3
        className={`font-semibold cursor-pointer ${active ? 'text-white' : 'text-slate-400'}`}
        onClick={onHeaderClick}
      >
        {title}
      </h3>
      {active && <div className="mt-3">{children}</div>}
    </div>
  );
};

const CreateCustomTrigger: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [form, setForm] = useState<CustomTriggerForm>(defaultForm);
  const [errors, setErrors] = useState<CustomTriggerErrors>({});
  const [current, setCurrent] = useState(1);
  const [loading, setLoading] = useState(false);
  const customTriggerTagOptions = useCrmTags('custom-trigger');

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const response = await apiService.get<CustomTrigger>(`/custom-triggers/${editId}`);
        if (response?.success && response?.data) {
          const c = response.data;
          setForm({
            name: c.name ?? '',
            trigger: c.trigger ?? '',
            status: c.status ?? 'INACTIVE',
            description: c.description ?? '',
            tags: c.tags ?? [],
            builder:
              typeof c.builder === 'object' && c.builder
                ? ((c.builder as { rules?: string }).rules ?? '')
                : '',
          });
        }
      } catch (err) {
        toast.error((err as ApiError).message || 'Failed to load custom trigger');
      }
    })();
  }, [editId]);

  const update = (patch: Partial<CustomTriggerForm>) => setForm((f) => ({ ...f, ...patch }));

  const validateDetails = (): boolean => {
    const err: CustomTriggerErrors = {};
    if (!form.name.trim()) err.name = 'Trigger name is required';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const next = () => {
    if (current === 1 && !validateDetails()) return;
    setCurrent((c) => Math.min(c + 1, STEPS.length));
  };

  const handleSubmit = async () => {
    if (!validateDetails()) {
      setCurrent(1);
      return;
    }
    const payload = {
      name: form.name,
      trigger: form.trigger || null,
      status: form.status,
      description: form.description || null,
      tags: form.tags,
      builder: form.builder ? { rules: form.builder } : null,
    };

    try {
      setLoading(true);
      const response: ApiResponse = editId
        ? await apiService.post(`/custom-triggers/update-by/${editId}`, payload)
        : await apiService.post('/custom-triggers/add', payload);

      if (response?.success) {
        toast.success(
          response.message ||
            (editId ? 'Custom trigger updated' : 'Custom trigger created successfully')
        );
        navigate('/crm/custom-triggers');
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to save custom trigger');
    } finally {
      setLoading(false);
    }
  };

  const SummaryRow: FC<{ label: string; value?: string }> = ({ label, value }) =>
    value ? (
      <div className="flex justify-between gap-4 py-2 border-b border-slate-700/60 text-sm">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-100 text-right">{value}</span>
      </div>
    ) : null;

  const hasSummary =
    form.name || form.trigger || form.description || form.tags.length > 0 || form.builder;

  const statusBadge =
    form.status === 'ACTIVE'
      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
      : 'bg-red-500/20 text-red-300 border border-red-500/40';

  return (
    <DashboardLayout>
      <div className="px-4 w-full">
        <div className="mb-6">
          <PageHeaderBreadcrumb
            title="Create Triggers"
            items={[
              { label: 'Home', clickable: true },
              { label: 'CRM' },
              { label: 'Custom Triggers', clickable: true },
              { label: editId ? 'Edit Triggers' : 'Create Triggers' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings / Steps */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700 rounded-md p-6">
            <h2 className="font-semibold mb-6">Settings</h2>

            <StepShell
              step={1}
              current={current}
              title="Details"
              onHeaderClick={() => setCurrent(1)}
            >
              <p className="text-xs text-slate-400 mb-3">
                Please add the details with which you want to save this Trigger.
              </p>
              <ModalInput
                label="Name"
                value={form.name}
                onChange={(v) => update({ name: v })}
                error={errors.name}
              />
              <div className="mt-3">
                <label className="text-sm block mb-1">Tags (Optional)</label>
                <MultiSelectDropdown
                  options={customTriggerTagOptions}
                  selected={form.tags}
                  onChange={(tags) => update({ tags })}
                  placeholder="Select tags…"
                />
              </div>
              <div className="mt-3">
                <ModalTextarea
                  label="Description"
                  value={form.description}
                  onChange={(v) => update({ description: v })}
                />
              </div>
              <div className="flex justify-between items-center mt-5">
                <button
                  type="button"
                  onClick={() => navigate('/crm/custom-triggers')}
                  className="text-red-400 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="bg-blue-600 px-4 py-2 rounded-full text-white text-sm"
                >
                  Next Step ›
                </button>
              </div>
            </StepShell>

            <StepShell
              step={2}
              current={current}
              title="Builder"
              onHeaderClick={() => setCurrent(2)}
            >
              <label className="text-sm block mb-1">Trigger Event</label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                value={form.trigger}
                onChange={(e) => update({ trigger: e.target.value })}
              >
                <option value="">Select a trigger event</option>
                {CUSTOM_TRIGGER_EVENT_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <div className="mt-3">
                <ModalTextarea
                  label="Builder Rules"
                  value={form.builder}
                  onChange={(v) => update({ builder: v })}
                  rows={6}
                  placeholder="Define the conditions / actions for this trigger"
                />
              </div>
              <div className="flex justify-between items-center mt-5">
                <button
                  type="button"
                  onClick={() => setCurrent(1)}
                  className="text-slate-400 text-sm"
                >
                  ‹ Back
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="bg-blue-600 px-4 py-2 rounded-full text-white text-sm"
                >
                  Next Step ›
                </button>
              </div>
            </StepShell>

            <StepShell
              step={3}
              current={current}
              title="Status"
              onHeaderClick={() => setCurrent(3)}
            >
              <label className="text-sm block mb-2">Status</label>
              <div className="flex gap-3">
                {(['ACTIVE', 'INACTIVE'] as CustomTriggerStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update({ status: s })}
                    className={`px-4 py-2 rounded-full text-sm border capitalize ${
                      form.status === s
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-600 text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {s.toLowerCase()}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-center mt-5">
                <button
                  type="button"
                  onClick={() => setCurrent(2)}
                  className="text-slate-400 text-sm"
                >
                  ‹ Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-blue-600 px-5 py-2 rounded-full text-white text-sm disabled:opacity-60"
                >
                  {loading ? 'Saving...' : editId ? 'Update Trigger' : 'Create Trigger'}
                </button>
              </div>
            </StepShell>
          </div>

          {/* Summary */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Summary</h2>
              <span className={`text-xs px-3 py-1 rounded-full capitalize ${statusBadge}`}>
                {form.status.toLowerCase()}
              </span>
            </div>

            {hasSummary ? (
              <div>
                <SummaryRow label="Name" value={form.name} />
                <SummaryRow label="Trigger" value={form.trigger} />
                <SummaryRow label="Status" value={form.status} />
                <SummaryRow label="Tags" value={form.tags.join(', ')} />
                <SummaryRow label="Description" value={form.description} />
                <SummaryRow label="Builder Rules" value={form.builder} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 text-slate-400">
                <p className="font-semibold text-slate-300">No Data</p>
                <p className="text-xs mt-1">
                  There is no information, please start by adding the information in the first step.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateCustomTrigger;
