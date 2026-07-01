import { useEffect, useState, type FC, type ReactNode } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Monitor, Smartphone } from 'lucide-react';
import DashboardLayout from '@/layout/DashboardLayout';
import { clientsApi, type Client } from '@/services/clients.api';
import { gamificationApi } from '@/services/gamification.api';
import type { GamificationEntity } from '@/types/gamification.types';
import {
  widgetConfigApi,
  WIDGET_TYPE_OPTIONS,
  type WidgetAppearance,
  type WidgetConfig,
  type WidgetConfigStatus,
} from '@/services/widgetConfig.api';

/** Active, non-archived catalog rows — mirrors the live by-email feed. */
const activeRows = (rows: GamificationEntity[]) =>
  rows.filter((r) => r.status === 'ACTIVE' && !r.archived);

/** Flatten the ranks catalog into the {level, rank_name} ladder the rankings
 *  widget expects (same shape the backend builds from each rank's levels). */
const buildLevels = (ranks: GamificationEntity[]) => {
  const out: { level: number; rank_name: string }[] = [];
  for (const r of activeRows(ranks)) {
    const levels = Array.isArray((r.data as { levels?: unknown[] })?.levels)
      ? (r.data as { levels: Record<string, unknown>[] }).levels
      : [];
    if (levels.length) {
      for (const lv of levels)
        out.push({ level: Number(lv.level ?? out.length + 1), rank_name: r.name });
    } else {
      out.push({ level: out.length + 1, rank_name: r.name });
    }
  }
  return out.sort((a, b) => a.level - b.level);
};

/** Build the live-preview catalog override for the data-backed widget types. */
const fetchPreviewSample = async (type: string): Promise<Record<string, unknown> | null> => {
  if (type === 'mission') {
    const res = await gamificationApi('missions').paginate({ page: 1, limit: 12 });
    const missions = activeRows(res.data?.data ?? []);
    return missions.length ? { missions } : null;
  }
  if (type === 'reward-shop') {
    const res = await gamificationApi('reward-shop').paginate({ page: 1, limit: 12 });
    const reward_shop = activeRows(res.data?.data ?? []);
    return reward_shop.length ? { reward_shop } : null;
  }
  if (type === 'rankings') {
    const res = await gamificationApi('ranks').paginate({ page: 1, limit: 50 });
    const levels = buildLevels(res.data?.data ?? []);
    return levels.length ? { levels } : null;
  }
  return null;
};

const inputCls =
  'w-full px-3 py-2.5 rounded-lg text-sm bg-slate-800 border border-slate-700/60 text-slate-100 placeholder-slate-500 outline-none transition-all hover:border-slate-600 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60';

const num = (v: string, fallback?: number): number | undefined => {
  if (v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const toDateInput = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

const Card: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
  <section className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-5">
    <h2 className="mb-4 text-sm font-semibold text-slate-100">{title}</h2>
    <div className="space-y-4">{children}</div>
  </section>
);
const Field: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-medium text-slate-300">{label}</label>
    {children}
  </div>
);
const ColorField: FC<{ label: string; value: string; onChange: (v: string) => void }> = ({
  label,
  value,
  onChange,
}) => (
  <Field label={label}>
    <div className="flex items-center gap-2">
      <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
      <label
        className="h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-700/60"
        style={{ background: value }}
      >
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-full w-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  </Field>
);

/* ---------- the form ------------------------------------------------- */

const EditorForm: FC<{ clients: Client[]; editing: WidgetConfig | null }> = ({
  clients,
  editing,
}) => {
  const navigate = useNavigate();
  const a = editing?.appearance ?? {};

  const [clientId, setClientId] = useState(editing?.client_id ?? '');
  const [name, setName] = useState(editing?.name ?? '');
  const [type, setType] = useState(editing?.type ?? WIDGET_TYPE_OPTIONS[0].value);
  const [domains, setDomains] = useState((editing?.allowed_domains ?? []).join(', '));
  const [status, setStatus] = useState<WidgetConfigStatus>(editing?.status ?? 'ACTIVE');
  const [expiry, setExpiry] = useState(toDateInput(editing?.expiry_date ?? null));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // appearance
  const [theme, setTheme] = useState<'dark' | 'light'>(a.theme ?? 'dark');
  const [accent, setAccent] = useState(a.accent_color ?? '#6366f1');
  const [bg, setBg] = useState(a.bg_color ?? '#0f172a');
  const [bgImage, setBgImage] = useState(a.bg_image ?? '');
  const [surface, setSurface] = useState(a.surface_color ?? '#1e293b');
  const [text, setText] = useState(a.text_color ?? '#e2e8f0');
  const [muted, setMuted] = useState(a.muted_color ?? '#94a3b8');
  const [border, setBorder] = useState(a.border_color ?? '#334155');
  const [radius, setRadius] = useState(String(a.radius ?? 12));
  const [fontSize, setFontSize] = useState(String(a.font_size ?? 14));
  const [spacing, setSpacing] = useState(String(a.spacing ?? 16));
  const [layout, setLayout] = useState<'comfortable' | 'compact'>(a.layout ?? 'comfortable');
  const [align, setAlign] = useState<'left' | 'center' | 'right'>(a.align ?? 'center');
  const [maxWidth, setMaxWidth] = useState(a.max_width != null ? String(a.max_width) : '');
  const [padding, setPadding] = useState(a.padding != null ? String(a.padding) : '');
  const [margin, setMargin] = useState(a.margin != null ? String(a.margin) : '');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>(a.size ?? 'medium');
  const [fullWidth, setFullWidth] = useState(!!a.full_width);
  const [width, setWidth] = useState(a.width != null ? String(a.width) : '');
  const [minHeight, setMinHeight] = useState(a.min_height != null ? String(a.min_height) : '');
  const [mFont, setMFont] = useState(a.mobile?.font_size != null ? String(a.mobile.font_size) : '');
  const [mSpace, setMSpace] = useState(a.mobile?.spacing != null ? String(a.mobile.spacing) : '');

  // preview
  const [previewEmail, setPreviewEmail] = useState('');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewSrc, setPreviewSrc] = useState('');
  // Real catalog (missions / reward-shop / ranks) for the no-email preview.
  const [sample, setSample] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let active = true;
    setSample(null);
    fetchPreviewSample(type)
      .then((s) => active && setSample(s))
      .catch(() => active && setSample(null));
    return () => {
      active = false;
    };
  }, [type]);

  const buildAppearance = (): WidgetAppearance => ({
    theme,
    accent_color: accent,
    bg_color: bg,
    bg_image: bgImage,
    surface_color: surface,
    text_color: text,
    muted_color: muted,
    border_color: border,
    radius: num(radius, 12),
    font_size: num(fontSize, 14),
    spacing: num(spacing, 16),
    layout,
    align,
    max_width: num(maxWidth),
    padding: num(padding),
    margin: num(margin),
    size,
    full_width: fullWidth,
    width: num(width),
    min_height: num(minHeight),
    mobile: { font_size: num(mFont), spacing: num(mSpace) },
  });

  const selectedClient = clients.find((c) => c.id === clientId);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!selectedClient) return setPreviewSrc('');
      const p = new URLSearchParams();
      p.set('clientId', selectedClient.slug);
      p.set('authKey', selectedClient.auth_key);
      if (previewEmail) p.set('email', previewEmail);
      p.set('preview', '1');
      p.set('appearance', JSON.stringify(buildAppearance()));
      if (sample) p.set('sample', JSON.stringify(sample));
      setPreviewSrc(`${window.location.origin}/widget/${type}?${p.toString()}`);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    clientId,
    type,
    previewEmail,
    theme,
    accent,
    bg,
    bgImage,
    surface,
    text,
    muted,
    border,
    radius,
    fontSize,
    spacing,
    layout,
    align,
    maxWidth,
    padding,
    margin,
    size,
    fullWidth,
    width,
    minHeight,
    mFont,
    mSpace,
    sample,
  ]);

  const save = async () => {
    if (!clientId) return setError('Please select a client');
    if (name.trim().length < 2) return setError('Widget name is required');
    setError('');
    setSaving(true);
    const allowed = domains
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    const payload = {
      client_id: clientId,
      name: name.trim(),
      type,
      allowed_domains: allowed.length ? allowed : null,
      status,
      expiry_date: expiry ? new Date(expiry).toISOString() : null,
      appearance: buildAppearance(),
    };
    try {
      if (editing) {
        await widgetConfigApi.update(editing.id, payload);
        toast.success('Widget updated');
      } else {
        await widgetConfigApi.create(payload);
        toast.success('Widget created');
      }
      navigate('/settings/widget-setup');
    } catch (e) {
      toast.error((e as { message?: string })?.message ?? 'Failed to save widget');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => navigate('/settings/widget-setup')}
              className="mb-1 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft size={14} /> Back to widgets
            </button>
            <h1 className="text-xl font-semibold text-slate-100">
              {editing ? 'Edit Widget' : 'Create Widget'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/settings/widget-setup')}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}
            </button>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* ── Form ──────────────────────────────────────────────── */}
          <div className="space-y-5">
            <Card title="Basics">
              <Field label="Client">
                <select
                  className={inputCls}
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                >
                  <option value="">— Select a client —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.slug})
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Widget Name">
                  <input
                    className={inputCls}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mission widget"
                  />
                </Field>
                <Field label="Widget Type">
                  <select
                    className={inputCls}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    {WIDGET_TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Allowed Domains (comma separated, optional)">
                <input
                  className={inputCls}
                  value={domains}
                  onChange={(e) => setDomains(e.target.value)}
                  placeholder="example.com, app.example.com"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Status">
                  <select
                    className={inputCls}
                    value={status}
                    onChange={(e) => setStatus(e.target.value as WidgetConfigStatus)}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </Field>
                <Field label="Expiry Date (optional)">
                  <input
                    type="date"
                    className={inputCls}
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                  />
                </Field>
              </div>
            </Card>

            <Card title="Theme & colors">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Theme preset">
                  <select
                    className={inputCls}
                    value={theme}
                    onChange={(e) => {
                      const v = e.target.value as 'dark' | 'light';
                      setTheme(v);
                      if (v === 'light') {
                        setBg('#ffffff');
                        setSurface('#f8fafc');
                        setText('#0f172a');
                        setMuted('#64748b');
                        setBorder('#e2e8f0');
                      } else {
                        setBg('#0f172a');
                        setSurface('#1e293b');
                        setText('#e2e8f0');
                        setMuted('#94a3b8');
                        setBorder('#334155');
                      }
                    }}
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </Field>
                <Field label="Layout density">
                  <select
                    className={inputCls}
                    value={layout}
                    onChange={(e) => setLayout(e.target.value as 'comfortable' | 'compact')}
                  >
                    <option value="comfortable">Comfortable</option>
                    <option value="compact">Compact</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ColorField label="Accent" value={accent} onChange={setAccent} />
                <ColorField label="Background" value={bg} onChange={setBg} />
                <ColorField label="Surface (cards)" value={surface} onChange={setSurface} />
                <ColorField label="Border" value={border} onChange={setBorder} />
                <ColorField label="Text" value={text} onChange={setText} />
                <ColorField label="Muted text" value={muted} onChange={setMuted} />
              </div>
              <Field label="Background image URL (optional)">
                <input
                  className={inputCls}
                  value={bgImage}
                  onChange={(e) => setBgImage(e.target.value)}
                  placeholder="https://…  (covers the widget background)"
                />
              </Field>
            </Card>

            <Card title="Layout & size">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Radius (px)">
                  <input
                    className={inputCls}
                    type="number"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                  />
                </Field>
                <Field label="Font (px)">
                  <input
                    className={inputCls}
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                  />
                </Field>
                <Field label="Spacing (px)">
                  <input
                    className={inputCls}
                    type="number"
                    value={spacing}
                    onChange={(e) => setSpacing(e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Alignment">
                  <select
                    className={inputCls}
                    value={align}
                    onChange={(e) => setAlign(e.target.value as 'left' | 'center' | 'right')}
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </Field>
                <Field label="Size (avatar / badge)">
                  <select
                    className={inputCls}
                    value={size}
                    onChange={(e) => setSize(e.target.value as 'small' | 'medium' | 'large')}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Max width (px)">
                  <input
                    className={inputCls}
                    type="number"
                    value={maxWidth}
                    onChange={(e) => setMaxWidth(e.target.value)}
                    placeholder="default"
                    disabled={fullWidth}
                  />
                </Field>
                <Field label="Fixed width (px)">
                  <input
                    className={inputCls}
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="auto"
                    disabled={fullWidth}
                  />
                </Field>
                <Field label="Min height (px)">
                  <input
                    className={inputCls}
                    type="number"
                    value={minHeight}
                    onChange={(e) => setMinHeight(e.target.value)}
                    placeholder="auto"
                  />
                </Field>
                <Field label="Full width">
                  <label className="flex h-[42px] items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800 px-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={fullWidth}
                      onChange={(e) => setFullWidth(e.target.checked)}
                    />
                    Stretch to full width
                  </label>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Padding (px)">
                  <input
                    className={inputCls}
                    type="number"
                    value={padding}
                    onChange={(e) => setPadding(e.target.value)}
                    placeholder="auto"
                  />
                </Field>
                <Field label="Margin (px)">
                  <input
                    className={inputCls}
                    type="number"
                    value={margin}
                    onChange={(e) => setMargin(e.target.value)}
                    placeholder="0"
                  />
                </Field>
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Mobile overrides (optional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Font (px)">
                    <input
                      className={inputCls}
                      type="number"
                      value={mFont}
                      onChange={(e) => setMFont(e.target.value)}
                      placeholder="inherit"
                    />
                  </Field>
                  <Field label="Spacing (px)">
                    <input
                      className={inputCls}
                      type="number"
                      value={mSpace}
                      onChange={(e) => setMSpace(e.target.value)}
                      placeholder="inherit"
                    />
                  </Field>
                </div>
              </div>
            </Card>
          </div>

          {/* ── Live preview ──────────────────────────────────────── */}
          <div className="lg:sticky lg:top-4 lg:h-fit">
            <section className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-100">Live preview</h2>
                <div className="flex gap-1 rounded-lg bg-slate-800 p-0.5">
                  <button
                    type="button"
                    onClick={() => setDevice('desktop')}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium ${device === 'desktop' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
                  >
                    <Monitor size={13} /> Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setDevice('mobile')}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium ${device === 'mobile' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
                  >
                    <Smartphone size={13} /> Mobile
                  </button>
                </div>
              </div>
              <input
                className={inputCls}
                value={previewEmail}
                onChange={(e) => setPreviewEmail(e.target.value)}
                placeholder="Preview player email (optional)"
              />
              <div
                className="mt-3 flex justify-center overflow-auto rounded-lg border border-slate-700/60"
                style={{ background: bg, minHeight: 520 }}
              >
                {selectedClient && previewSrc ? (
                  <iframe
                    key={previewSrc + device}
                    title="Widget live preview"
                    src={previewSrc}
                    style={{ width: device === 'mobile' ? 360 : '100%', height: 520, border: 0 }}
                  />
                ) : (
                  <div className="flex w-full items-center justify-center py-20 text-xs text-slate-500">
                    Select a client to preview
                  </div>
                )}
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Mobile width triggers the widget's responsive (mobile) styles.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- page wrapper (loads clients + the widget for edit) -------- */

const WidgetEditorPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const stateWidget = (location.state as { widget?: WidgetConfig } | null)?.widget ?? null;

  const [clients, setClients] = useState<Client[]>([]);
  const [editing, setEditing] = useState<WidgetConfig | null>(stateWidget);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await clientsApi.list({ page: 1, limit: 100 });
        setClients(res.data?.data ?? []);
        if (id && !stateWidget) {
          const list = await widgetConfigApi.list();
          setEditing((list.data?.data ?? []).find((w) => w.id === id) ?? null);
        }
      } catch {
        toast.error('Failed to load editor data');
      } finally {
        setReady(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <DashboardLayout>
      {ready ? (
        <EditorForm clients={clients} editing={editing} />
      ) : (
        <div className="p-10 text-center text-sm text-slate-400">Loading…</div>
      )}
    </DashboardLayout>
  );
};

export default WidgetEditorPage;
