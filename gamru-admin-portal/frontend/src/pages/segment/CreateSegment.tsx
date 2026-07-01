import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Trash2, Users } from 'lucide-react';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';
import ModalInput from '@/components/inputs/ModalInput';
import ModalTextarea from '@/components/inputs/ModalTextarea';
import MultiSelectDropdown from '@/components/inputs/MultiSelectDropdown';
import { useCrmTags } from '@/hooks/useCrmTags';
import apiService from '@/services/api';
import type { ApiError, ApiResponse } from '@/types';
import {
  type Segment,
  type SegmentErrors,
  type SegmentForm,
  type RuleCondition,
  type RuleGroup,
  type RuleNode,
  type SegmentFieldDef,
  SEGMENT_FIELD_CATALOG,
  SEGMENT_TYPE_OPTIONS,
  OPERATORS_BY_KIND,
  OPERATOR_LABELS,
  VALUELESS_OPS,
  KNOWN_PLAYER_TAGS,
} from '@/types/segment.types';

/** Distinct player tags (from the API, merged with defaults) for Tag rules. */
const TagOptionsContext = createContext<string[]>(KNOWN_PLAYER_TAGS);

const uid = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const fieldDef = (key: string): SegmentFieldDef | undefined =>
  SEGMENT_FIELD_CATALOG.find((f) => f.key === key);

const newCondition = (): RuleCondition => ({
  id: uid(),
  type: 'condition',
  field: SEGMENT_FIELD_CATALOG[0].key,
  op: OPERATORS_BY_KIND[SEGMENT_FIELD_CATALOG[0].kind][0],
  value: '',
  not: false,
});

const newGroup = (): RuleGroup => ({
  id: uid(),
  type: 'group',
  match: 'AND',
  rules: [newCondition()],
});

const emptyTree = (): RuleGroup => newGroup();

const defaultForm = (): SegmentForm => ({
  name: '',
  type: 'DYNAMIC',
  tags: [],
  description: '',
  refreshMode: 'Scheduled',
  refreshMinutes: 60,
  tree: emptyTree(),
});

/** Field picker grouped by category, matching the screenshot's grouped menu. */
const FieldSelect: FC<{ value: string; onChange: (key: string) => void }> = ({
  value,
  onChange,
}) => {
  const groups = useMemo(() => {
    const map = new Map<string, SegmentFieldDef[]>();
    for (const f of SEGMENT_FIELD_CATALOG) {
      if (!map.has(f.group)) map.set(f.group, []);
      map.get(f.group)!.push(f);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <select
      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {groups.map(([group, fields]) => (
        <optgroup key={group} label={group.toUpperCase()}>
          {fields.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
};

const TagSelect: FC<{
  value: string;
  onChange: (v: string) => void;
  className: string;
}> = ({ value, onChange, className }) => {
  const tags = useContext(TagOptionsContext);
  // Keep a previously-saved tag selectable even if no player currently has it.
  const options = value && !tags.includes(value) ? [value, ...tags] : tags;
  return (
    <select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select tag…</option>
      {options.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
};

const ValueInput: FC<{
  def: SegmentFieldDef;
  op: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ def, op, value, onChange }) => {
  if (VALUELESS_OPS.has(op)) {
    return <div className="w-full px-3 py-2 text-xs text-slate-500 italic">No value needed</div>;
  }

  const base = 'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm';

  if (def.kind === 'enum' && def.options) {
    return (
      <select className={base} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select…</option>
        {def.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (def.kind === 'number') {
    return (
      <input
        type="number"
        className={base}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
      />
    );
  }

  if (def.kind === 'date') {
    if (op === 'in_last_days') {
      return (
        <input
          type="number"
          className={base}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. 30"
        />
      );
    }
    return (
      <input
        type="date"
        className={base}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (def.kind === 'tags') {
    return <TagSelect value={value} onChange={onChange} className={base} />;
  }

  return (
    <input
      className={base}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Value"
    />
  );
};

const ConditionRow: FC<{
  cond: RuleCondition;
  onChange: (next: RuleCondition) => void;
  onRemove: () => void;
}> = ({ cond, onChange, onRemove }) => {
  const def = fieldDef(cond.field) ?? SEGMENT_FIELD_CATALOG[0];
  const ops = OPERATORS_BY_KIND[def.kind];

  const onFieldChange = (key: string) => {
    const nextDef = fieldDef(key)!;
    onChange({ ...cond, field: key, op: OPERATORS_BY_KIND[nextDef.kind][0], value: '' });
  };

  return (
    <div className="flex flex-wrap md:flex-nowrap items-center gap-3 py-2">
      <div className="w-full md:w-1/3">
        <FieldSelect value={cond.field} onChange={onFieldChange} />
      </div>
      <div className="w-full md:w-1/4">
        <select
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
          value={cond.op}
          onChange={(e) => onChange({ ...cond, op: e.target.value })}
        >
          {ops.map((o) => (
            <option key={o} value={o}>
              {OPERATOR_LABELS[o] ?? o}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-[140px]">
        <ValueInput
          def={def}
          op={cond.op}
          value={cond.value}
          onChange={(v) => onChange({ ...cond, value: v })}
        />
      </div>
      <label className="flex items-center gap-1 text-xs text-slate-400 select-none">
        NOT
        <input
          type="checkbox"
          checked={cond.not}
          onChange={(e) => onChange({ ...cond, not: e.target.checked })}
          className="accent-blue-600"
        />
      </label>
      <button
        type="button"
        onClick={onRemove}
        className="p-2 rounded hover:bg-slate-700 text-slate-400"
        title="Remove condition"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
};

const GroupEditor: FC<{
  group: RuleGroup;
  depth: number;
  onChange: (next: RuleGroup) => void;
  onRemove?: () => void;
}> = ({ group, depth, onChange, onRemove }) => {
  const setRules = (rules: RuleNode[]) => onChange({ ...group, rules });

  const updateChild = (id: string, next: RuleNode) =>
    setRules(group.rules.map((r) => (r.id === id ? next : r)));

  const removeChild = (id: string) => setRules(group.rules.filter((r) => r.id !== id));

  return (
    <div
      className={`rounded-md border border-slate-700 p-4 ${
        depth > 0 ? 'bg-slate-900/40 mt-2' : 'bg-slate-800/30'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="inline-flex rounded-md overflow-hidden border border-slate-700">
          {(['AND', 'OR'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChange({ ...group, match: m })}
              className={`px-3 py-1 text-xs font-semibold ${
                group.match === m ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-red-400 hover:underline flex items-center gap-1"
          >
            <Trash2 size={13} /> Remove group
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-700/60">
        {group.rules.map((node) =>
          node.type === 'group' ? (
            <div key={node.id} className="py-2">
              <GroupEditor
                group={node}
                depth={depth + 1}
                onChange={(next) => updateChild(node.id, next)}
                onRemove={() => removeChild(node.id)}
              />
            </div>
          ) : (
            <ConditionRow
              key={node.id}
              cond={node}
              onChange={(next) => updateChild(node.id, next)}
              onRemove={() => removeChild(node.id)}
            />
          )
        )}
      </div>

      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={() => setRules([...group.rules, newCondition()])}
          className="px-3 py-1.5 rounded border border-slate-600 text-xs text-slate-200 hover:bg-slate-700"
        >
          + Condition
        </button>
        {depth < 4 && (
          <button
            type="button"
            onClick={() => setRules([...group.rules, newGroup()])}
            className="px-3 py-1.5 rounded border border-slate-600 text-xs text-slate-200 hover:bg-slate-700"
          >
            + Group
          </button>
        )}
      </div>
    </div>
  );
};

const countConditions = (node: RuleNode): number =>
  node.type === 'group' ? node.rules.reduce((sum, r) => sum + countConditions(r), 0) : 1;

const CreateSegment: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [form, setForm] = useState<SegmentForm>(defaultForm);
  const [errors, setErrors] = useState<SegmentErrors>({});
  const [loading, setLoading] = useState(false);

  const [audience, setAudience] = useState<number | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [tagOptions, setTagOptions] = useState<string[]>(KNOWN_PLAYER_TAGS);
  const segmentTagOptions = useCrmTags('segment');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiService.get<string[]>('/segments/tags');
        if (res?.success && Array.isArray(res.data)) {
          // Merge live player tags with known defaults, de-duplicated.
          setTagOptions(Array.from(new Set([...KNOWN_PLAYER_TAGS, ...res.data])));
        }
      } catch {
        /* fall back to KNOWN_PLAYER_TAGS */
      }
    })();
  }, []);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const response = await apiService.get<Segment>(`/segments/${editId}`);
        if (response?.success && response?.data) {
          const s = response.data;
          const content = (s.content ?? {}) as Partial<RuleGroup> & {
            refresh?: { mode?: string; everyMinutes?: number };
          };
          setForm({
            name: s.name ?? '',
            type: s.type ?? 'DYNAMIC',
            tags: s.tags ?? [],
            description: s.description ?? '',
            refreshMode: content.refresh?.mode === 'Manual' ? 'Manual' : 'Scheduled',
            refreshMinutes: Number(content.refresh?.everyMinutes ?? 60),
            tree:
              content.type === 'group' && Array.isArray(content.rules)
                ? (content as RuleGroup)
                : emptyTree(),
          });
        }
      } catch (err) {
        toast.error((err as ApiError).message || 'Failed to load segment');
      }
    })();
  }, [editId]);

  const update = (patch: Partial<SegmentForm>) => setForm((f) => ({ ...f, ...patch }));

  // Live audience preview — debounced on every rule-tree change.
  const runPreview = useCallback(async (tree: RuleGroup) => {
    setPreviewing(true);
    setPreviewError(null);
    try {
      const res = await apiService.post<{ count: number }>('/segments/preview', {
        content: tree,
      });
      if (res?.success && res.data) setAudience(res.data.count);
    } catch (err) {
      setPreviewError((err as ApiError).message || 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  }, []);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runPreview(form.tree), 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form.tree, runPreview]);

  const buildPayload = () => ({
    name: form.name,
    type: form.type,
    tags: form.tags,
    description: form.description || null,
    content: {
      ...form.tree,
      refresh: { mode: form.refreshMode, everyMinutes: Number(form.refreshMinutes) || 60 },
    },
  });

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setErrors({ name: 'Segment name is required' });
      return;
    }
    setErrors({});
    try {
      setLoading(true);
      const response: ApiResponse = editId
        ? await apiService.post(`/segments/update-by/${editId}`, buildPayload())
        : await apiService.post('/segments/add', buildPayload());
      if (response?.success) {
        toast.success(
          response.message || (editId ? 'Segment updated' : 'Segment created successfully')
        );
        navigate('/crm/segments');
      }
    } catch (err) {
      toast.error((err as ApiError).message || 'Failed to save segment');
    } finally {
      setLoading(false);
    }
  };

  const conditionCount = countConditions(form.tree);

  return (
    <DashboardLayout>
      <div className="px-4 w-full">
        <div className="flex items-start justify-between mb-6">
          <PageHeaderBreadcrumb
            title={editId ? 'Edit Segment' : 'New Segment'}
            items={[
              { label: 'Home', clickable: true },
              { label: 'CRM' },
              { label: 'Segments', clickable: true },
              { label: editId ? 'Edit' : 'Create' },
            ]}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/crm/segments')}
              className="px-4 py-2 rounded-full border border-slate-600 text-slate-300 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 rounded-full bg-blue-600 text-white text-sm disabled:opacity-60"
            >
              {loading ? 'Saving…' : editId ? 'Update Segment' : 'Save Segment'}
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          Build a rule tree, preview the audience, then save.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Details */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ModalInput
                  label="Name"
                  value={form.name}
                  onChange={(v) => update({ name: v })}
                  error={errors.name}
                  placeholder="High-value reactivation candidates"
                />
                <div>
                  <label className="text-sm block mb-1">Tags</label>
                  <MultiSelectDropdown
                    options={segmentTagOptions}
                    selected={form.tags}
                    onChange={(tags) => update({ tags })}
                    placeholder="Select tags…"
                  />
                </div>
              </div>
              <div className="mt-4">
                <ModalTextarea
                  label="Description"
                  value={form.description}
                  onChange={(v) => update({ description: v })}
                  placeholder="What this audience represents and how it should be used."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="text-sm block mb-1">Type</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                    value={form.type}
                    onChange={(e) => update({ type: e.target.value as SegmentForm['type'] })}
                  >
                    {SEGMENT_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.value === 'DYNAMIC' ? 'Dynamic (re-evaluated)' : 'Static (snapshot)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm block mb-1">Refresh mode</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                    value={form.refreshMode}
                    onChange={(e) =>
                      update({ refreshMode: e.target.value as SegmentForm['refreshMode'] })
                    }
                    disabled={form.type === 'STATIC'}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm block mb-1">Refresh every (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
                    value={form.refreshMinutes}
                    onChange={(e) => update({ refreshMinutes: Number(e.target.value) })}
                    disabled={form.type === 'STATIC' || form.refreshMode !== 'Scheduled'}
                  />
                </div>
              </div>
            </div>

            {/* Rules */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Rules</h2>
                <span className="text-xs text-slate-400">
                  {conditionCount} condition{conditionCount === 1 ? '' : 's'} ·{' '}
                  {SEGMENT_FIELD_CATALOG.length} fields available
                </span>
              </div>
              <TagOptionsContext.Provider value={tagOptions}>
                <GroupEditor group={form.tree} depth={0} onChange={(tree) => update({ tree })} />
              </TagOptionsContext.Provider>
            </div>
          </div>

          {/* Audience preview */}
          <div className="bg-slate-800/40 border border-slate-700 rounded-md p-6 h-fit sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-blue-300" />
              <h2 className="font-semibold">Audience preview</h2>
            </div>

            {previewError ? (
              <p className="text-red-400 text-xs">Preview failed: {previewError}</p>
            ) : (
              <div>
                <div className="text-3xl font-bold text-white">
                  {previewing ? '…' : (audience ?? 0).toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">matching players</div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-700/60 text-xs text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Type</span>
                <span className="text-slate-200">{form.type}</span>
              </div>
              <div className="flex justify-between">
                <span>Refresh</span>
                <span className="text-slate-200">
                  {form.type === 'STATIC'
                    ? '—'
                    : form.refreshMode === 'Scheduled'
                      ? `every ${form.refreshMinutes}m`
                      : 'Manual'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateSegment;
