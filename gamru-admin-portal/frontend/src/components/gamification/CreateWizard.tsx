import { useMemo, useState, type FC } from 'react';
import { FieldRenderer, isRootField, type LevelContinuation, type WizardStep } from './fields';
import type { GamificationStatus } from '@/types/gamification.types';

export interface WizardFormState {
  name: string;
  description: string;
  priority: number;
  status: GamificationStatus;
  tags: string[];
  data: Record<string, unknown>;
}

export const buildInitialForm = (): WizardFormState => ({
  name: '',
  description: '',
  priority: 0,
  status: 'INACTIVE',
  tags: [],
  data: {},
});

interface CreateWizardProps {
  title: string;
  breadcrumb: string[];
  steps: WizardStep[];
  form: WizardFormState;
  setForm: (f: WizardFormState) => void;
  onCancel: () => void;
  onSubmit: () => void;
  saving: boolean;
  editing: boolean;
  /** Passed to the `levels` editor so a rank continues the global ladder. */
  levelContinuation?: LevelContinuation;
}

const getValue = (form: WizardFormState, name: string) =>
  isRootField(name) ? (form as unknown as Record<string, unknown>)[name] : form.data[name];

const CreateWizard: FC<CreateWizardProps> = ({
  title,
  breadcrumb,
  steps,
  form,
  setForm,
  onCancel,
  onSubmit,
  saving,
  editing,
  levelContinuation,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-appended final status step.
  const allSteps = useMemo(
    () => [...steps, { key: '__status', title: 'Status', fields: [] }],
    [steps]
  );

  const setValue = (name: string, value: unknown) => {
    if (isRootField(name)) {
      setForm({ ...form, [name]: value } as WizardFormState);
    } else {
      setForm({ ...form, data: { ...form.data, [name]: value } });
    }
  };

  const validateStep = (index: number): boolean => {
    const step = allSteps[index];
    const errs: Record<string, string> = {};
    step.fields.forEach((f) => {
      if (f.required) {
        const v = getValue(form, f.name);
        const empty =
          v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
        if (empty) errs[f.name] = `${f.label} is required`;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    if (!validateStep(activeStep)) return;
    if (activeStep < allSteps.length - 1) setActiveStep(activeStep + 1);
  };

  const handleSubmit = () => {
    // validate every non-status step
    for (let i = 0; i < steps.length; i += 1) {
      if (!validateStep(i)) {
        setActiveStep(i);
        return;
      }
    }
    onSubmit();
  };

  const filledSummary = useMemo(() => {
    const entries: { label: string; value: string }[] = [];
    if (form.name) entries.push({ label: 'Name', value: form.name });
    steps.forEach((s) =>
      s.fields.forEach((f) => {
        const v = getValue(form, f.name);
        if (v === undefined || v === null || v === '' || f.name === 'name') return;
        if (Array.isArray(v) && v.length === 0) return;
        let display: string;
        if (Array.isArray(v)) {
          display =
            typeof v[0] === 'object' && v[0] !== null
              ? `${v.length} level${v.length === 1 ? '' : 's'} configured`
              : v.join(', ');
        } else {
          display = String(v);
        }
        entries.push({ label: f.label, value: display });
      })
    );
    return entries;
  }, [form, steps]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-5">
        <h1 className="text-xl font-bold text-white">
          {editing ? 'Edit' : 'Create'} {title}
        </h1>
        <span className="text-slate-500 text-sm">
          {breadcrumb.join('  ›  ')} › {editing ? 'Edit' : 'Create'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Settings / steps ─────────────────────────────── */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">Settings</h2>

          <div className="space-y-3">
            {allSteps.map((step, idx) => {
              const isActive = idx === activeStep;
              const isStatus = step.key === '__status';
              return (
                <div key={step.key}>
                  <button
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    className="flex items-center gap-3 w-full text-left"
                  >
                    <span
                      className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        isActive ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </button>

                  {isActive && (
                    <div className="ml-9 mt-3 space-y-4">
                      {step.subtitle && <p className="text-xs text-slate-500">{step.subtitle}</p>}

                      {isStatus ? (
                        <div>
                          <label className="text-xs text-slate-400 block mb-2">Status</label>
                          <div className="flex gap-2">
                            {(['ACTIVE', 'INACTIVE'] as GamificationStatus[]).map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setForm({ ...form, status: s })}
                                className={`px-4 py-1.5 rounded text-xs font-medium ${
                                  form.status === s
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {step.fields.map((f) => (
                            <div key={f.name} className={f.half ? 'col-span-1' : 'col-span-2'}>
                              <FieldRenderer
                                field={f}
                                value={getValue(form, f.name)}
                                error={errors[f.name]}
                                onChange={(v) => setValue(f.name, v)}
                                levelContinuation={levelContinuation}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={onCancel}
                          className="text-red-400 text-sm hover:text-red-300"
                        >
                          Cancel
                        </button>
                        {idx < allSteps.length - 1 ? (
                          <button
                            type="button"
                            onClick={goNext}
                            className="bg-blue-600/80 hover:bg-blue-600 px-4 py-1.5 rounded text-sm text-white"
                          >
                            Next Step ›
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 px-5 py-1.5 rounded text-sm text-white disabled:opacity-50"
                          >
                            {saving ? 'Saving…' : editing ? 'Update' : 'Save'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Summary ──────────────────────────────────────── */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">Summary</h2>
            <span
              className={`text-xs px-3 py-1 rounded-full ${
                form.status === 'ACTIVE'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {form.status === 'ACTIVE' ? 'Active' : 'Inactive'}
            </span>
          </div>

          {filledSummary.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-slate-300 font-medium">No Data</p>
              <p className="text-slate-500 text-xs mt-1">
                There is no information, please start by adding the information in the first step.
              </p>
            </div>
          ) : (
            <dl className="space-y-3">
              {filledSummary.map((e, i) => (
                <div
                  key={`${e.label}-${i}`}
                  className="flex justify-between gap-4 border-b border-slate-800 pb-2"
                >
                  <dt className="text-xs text-slate-500">{e.label}</dt>
                  <dd className="text-sm text-slate-200 text-right break-words">{e.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateWizard;
