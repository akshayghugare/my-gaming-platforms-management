import { useEffect, useMemo, useState, type FC, type ReactNode } from 'react';
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
  type Template,
  type TemplateChannel,
  type TemplateErrors,
  type TemplateForm,
  TEMPLATE_CHANNEL_LABELS,
  TEMPLATE_LANGUAGE_OPTIONS,
  TEMPLATE_STARTER_OPTIONS,
  TEMPLATE_STEPS,
} from '@/types/template.types';

const defaultForm: TemplateForm = {
  name: '',
  description: '',
  language: '',
  tags: [],
  subject: '',
  content: '',
  test_recipients: '',
};

const isChannel = (v: string | null): v is TemplateChannel =>
  v === 'EMAIL' || v === 'SMS' || v === 'ONSITE' || v === 'WEBPUSH' || v === 'INAPP';

const StepShell: FC<{
  index: number;
  total: number;
  current: number;
  title: string;
  onHeaderClick: () => void;
  children?: ReactNode;
}> = ({ index, total, current, title, onHeaderClick, children }) => {
  const active = current === index;
  const done = current > index;
  return (
    <div className="relative pl-10 pb-6">
      <button
        type="button"
        onClick={onHeaderClick}
        className={`absolute left-0 top-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
          active || done ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
        }`}
      >
        {done ? <Check size={14} /> : index}
      </button>
      {index !== total && (
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

const CreateTemplate: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const channelParam = searchParams.get('channel');

  const [channel, setChannel] = useState<TemplateChannel>(
    isChannel(channelParam) ? channelParam : 'EMAIL'
  );
  const [form, setForm] = useState<TemplateForm>(defaultForm);
  const [errors, setErrors] = useState<TemplateErrors>({});
  const [current, setCurrent] = useState(1);
  const [loading, setLoading] = useState(false);
  const templateTagOptions = useCrmTags('template');

  const steps = useMemo(() => TEMPLATE_STEPS[channel], [channel]);
  const channelLabel = TEMPLATE_CHANNEL_LABELS[channel];

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const response = await apiService.get<Template>(`/templates/${editId}`);
        if (response?.success && response?.data) {
          const t = response.data;
          setChannel(t.channel);
          setForm({
            name: t.name ?? '',
            description: t.description ?? '',
            language: t.language ?? '',
            tags: t.tags ?? [],
            subject: t.subject ?? '',
            content: t.content ?? '',
            test_recipients: (t.test_recipients ?? []).join(', '),
          });
        }
      } catch (err) {
        toast.error((err as ApiError).message || 'Failed to load template');
      }
    })();
  }, [editId]);

  const update = (patch: Partial<TemplateForm>) => setForm((f) => ({ ...f, ...patch }));

  /** Pre-fill the subject + body with a dummy starter message for a trigger. */
  const applyStarter = (value: string) => {
    const starter = TEMPLATE_STARTER_OPTIONS.find((s) => s.value === value);
    if (!starter) return;
    update({ subject: starter.subject, content: starter.body });
  };

  const validateDetails = (): boolean => {
    const err: TemplateErrors = {};
    if (!form.name.trim()) err.name = 'Template name is required';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const next = () => {
    if (current === 1 && !validateDetails()) return;
    setCurrent((c) => Math.min(c + 1, steps.length));
  };

  const handleSubmit = async () => {
    if (!validateDetails()) {
      setCurrent(1);
      return;
    }
    const payload = {
      name: form.name,
      channel,
      description: form.description || null,
      language: form.language || null,
      tags: form.tags,
      subject: channel === 'EMAIL' ? form.subject || null : null,
      content: form.content || null,
      test_recipients: form.test_recipients
        ? form.test_recipients
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : null,
    };

    try {
      setLoading(true);
      const response: ApiResponse = editId
        ? await apiService.post(`/templates/update-by/${editId}`, payload)
        : await apiService.post('/templates/add', payload);

      if (response?.success) {
        toast.success(
          response.message || (editId ? 'Template updated' : 'Template created successfully')
        );
        navigate('/crm/templates');
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const NavButtons: FC<{ isLast: boolean }> = ({ isLast }) => (
    <div className="flex justify-between items-center mt-5">
      {current === 1 ? (
        <button
          type="button"
          onClick={() => navigate('/crm/templates')}
          className="text-red-400 text-sm"
        >
          Cancel
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setCurrent((c) => c - 1)}
          className="text-slate-400 text-sm"
        >
          ‹ Back
        </button>
      )}
      {isLast ? (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 px-5 py-2 rounded-full text-white text-sm disabled:opacity-60"
        >
          {loading ? 'Saving...' : editId ? 'Update Template' : 'Create Template'}
        </button>
      ) : (
        <button
          type="button"
          onClick={next}
          className="bg-blue-600 px-4 py-2 rounded-full text-white text-sm"
        >
          Next Step ›
        </button>
      )}
    </div>
  );

  const renderStepBody = (title: string, isLast: boolean): ReactNode => {
    switch (title) {
      case 'Details':
        return (
          <>
            <p className="text-xs text-slate-400 mb-3">
              Please add the details with which you want to save this Template.
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
                options={templateTagOptions}
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
            <div className="mt-3">
              <label className="text-sm block mb-1">Starter message (Optional)</label>
              <select
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                defaultValue=""
                onChange={(e) => {
                  applyStarter(e.target.value);
                  e.target.value = '';
                }}
              >
                <option value="">Pick a trigger to pre-fill the body…</option>
                {TEMPLATE_STARTER_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Fills the subject &amp; message with a dummy body for that trigger event — edit it
                freely in the next step. Tokens like {'{{first_name}}'}, {'{{level}}'}, {'{{rank}}'}{' '}
                are replaced per player on delivery.
              </p>
            </div>
            <NavButtons isLast={isLast} />
          </>
        );

      case 'Email Details':
        return (
          <>
            <ModalInput
              label="Subject"
              value={form.subject}
              onChange={(v) => update({ subject: v })}
              placeholder="Email subject line"
            />
            <div className="mt-3">
              <ModalTextarea
                label="Email Body"
                value={form.content}
                onChange={(v) => update({ content: v })}
                rows={8}
                placeholder="Write the email content (HTML supported)"
              />
            </div>
            <NavButtons isLast={isLast} />
          </>
        );

      case 'Message language':
        return (
          <>
            <label className="text-sm block mb-1">Language</label>
            <select
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
              value={form.language}
              onChange={(e) => update({ language: e.target.value })}
            >
              <option value="">Select a language</option>
              {TEMPLATE_LANGUAGE_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            {channel !== 'EMAIL' && (
              <div className="mt-3">
                <ModalTextarea
                  label="Message"
                  value={form.content}
                  onChange={(v) => update({ content: v })}
                  rows={6}
                  placeholder={`Write the ${channelLabel} message`}
                />
              </div>
            )}
            <NavButtons isLast={isLast} />
          </>
        );

      case 'Send Test (Optional)':
        return (
          <>
            <ModalInput
              label="Test Recipients"
              value={form.test_recipients}
              onChange={(v) => update({ test_recipients: v })}
              placeholder="Comma-separated emails / phone numbers"
            />
            <p className="text-xs text-slate-400 mt-2">
              Send a test delivery before publishing this template. Optional.
            </p>
            <NavButtons isLast={isLast} />
          </>
        );

      default:
        return <NavButtons isLast={isLast} />;
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
    form.name ||
    form.description ||
    form.language ||
    form.tags.length > 0 ||
    form.subject ||
    form.content;

  return (
    <DashboardLayout>
      <div className="px-4 w-full">
        <div className="mb-6">
          <PageHeaderBreadcrumb
            title={`Create ${channelLabel} Template`}
            items={[
              { label: 'Home', clickable: true },
              { label: 'CRM' },
              { label: 'Templates', clickable: true },
              { label: editId ? 'Edit' : 'Create' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings / Steps */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700 rounded-md p-6">
            <h2 className="font-semibold mb-6">Settings</h2>

            {steps.map((title, i) => {
              const stepNumber = i + 1;
              const isLast = stepNumber === steps.length;
              return (
                <StepShell
                  key={title}
                  index={stepNumber}
                  total={steps.length}
                  current={current}
                  title={title}
                  onHeaderClick={() => setCurrent(stepNumber)}
                >
                  {renderStepBody(title, isLast)}
                </StepShell>
              );
            })}
          </div>

          {/* Summary */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-md p-6">
            <h2 className="font-semibold mb-4">Summary</h2>

            {hasSummary ? (
              <div>
                <SummaryRow label="Name" value={form.name} />
                <SummaryRow label="Channel" value={channelLabel} />
                <SummaryRow label="Language" value={form.language} />
                <SummaryRow label="Tags" value={form.tags.join(', ')} />
                <SummaryRow label="Description" value={form.description} />
                {channel === 'EMAIL' && <SummaryRow label="Subject" value={form.subject} />}
                <SummaryRow label="Content" value={form.content} />
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

export default CreateTemplate;
