import { useEffect, useMemo, useState, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Copy, ExternalLink, Plus, Pencil, Trash2 } from 'lucide-react';
import DashboardLayout from '@/layout/DashboardLayout';
import { clientsApi, type Client } from '@/services/clients.api';
import {
  widgetConfigApi,
  WIDGET_TYPE_OPTIONS,
  type WidgetConfig,
} from '@/services/widgetConfig.api';

/**
 * Settings → Widget / iFrame Setup.
 *
 * Admin CRUD for embeddable iframe widgets. Create a widget for a client +
 * feature type, then copy its ready-made `<iframe>` snippet or preview it. The
 * widgets are served at `/widget/<type>` and gated by `GET /api/widget/validate`,
 * which enforces the status / expiry / allowed-domains configured here.
 */

const typeLabel = (type: string) =>
  WIDGET_TYPE_OPTIONS.find((t) => t.value === type)?.label ?? type;

const buildUrl = (base: string, type: string, clientId: string, authKey: string) => {
  const params = new URLSearchParams();
  if (clientId) params.set('clientId', clientId);
  if (authKey) params.set('authKey', authKey);
  return `${base.replace(/\/$/, '')}/widget/${type}?${params.toString()}`;
};

const snippet = (url: string) =>
  `<iframe\n  src="${url}"\n  width="100%"\n  height="800"\n  frameborder="0">\n</iframe>`;

const scriptEmbed = (base: string, type: string, clientId: string, authKey: string) =>
  `<div class="gamification_widget" data-type="${type}"></div>\n\n` +
  `<script\n  src="${base.replace(/\/$/, '')}/embed.js"\n` +
  `  data-client-id="${clientId}"\n  data-auth-key="${authKey}"\n` +
  `  data-email="PLAYER_EMAIL">\n</script>`;

const copy = async (value: string, what: string) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${what} copied`);
  } catch {
    toast.error('Copy failed');
  }
};

const WidgetSetupPage: FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const clientById = useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach((c) => map.set(c.id, c));
    return map;
  }, [clients]);

  const loadWidgets = async () => {
    try {
      const res = await widgetConfigApi.list();
      setWidgets(res.data?.data ?? []);
    } catch {
      toast.error('Failed to load widgets');
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [clientsRes] = await Promise.all([clientsApi.list({ page: 1, limit: 100 })]);
        setClients(clientsRes.data?.data ?? []);
        await loadWidgets();
      } catch {
        toast.error('Failed to load setup data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openCreate = () => navigate('/settings/widget-setup/create');
  const openEdit = (w: WidgetConfig) =>
    navigate(`/settings/widget-setup/${w.id}/edit`, { state: { widget: w } });

  const toggle = async (w: WidgetConfig) => {
    try {
      await widgetConfigApi.toggleStatus(w.id);
      await loadWidgets();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const remove = async (w: WidgetConfig) => {
    if (!window.confirm(`Delete widget "${w.name}"?`)) return;
    try {
      await widgetConfigApi.remove(w.id);
      if (selectedId === w.id) setSelectedId(null);
      await loadWidgets();
      toast.success('Widget deleted');
    } catch {
      toast.error('Failed to delete widget');
    }
  };

  const urlForWidget = (w: WidgetConfig): string | null => {
    const c = clientById.get(w.client_id);
    if (!c) return null;
    return buildUrl(baseUrl, w.type, c.slug, c.auth_key);
  };

  const selected = widgets.find((w) => w.id === selectedId) ?? null;
  const previewUrl = selected ? urlForWidget(selected) : null;

  return (
    <DashboardLayout>
      <div className="w-full min-h-screen text-slate-200 p-4">
        <div className="mx-auto max-w-5xl">
          <header className="mb-6 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-slate-100">Widget / iFrame Setup</h1>
              <p className="mt-1 text-sm text-slate-400">
                Create embeddable iframe widgets per client and feature. Each is validated by client
                id, auth key, allowed domain, status and expiry before it renders.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              <Plus size={16} /> Create Widget
            </button>
          </header>

          {/* Base URL */}
          <div className="mb-5 flex flex-col gap-1.5 sm:max-w-md">
            <label className="text-xs font-medium text-slate-300">Widget Base URL</label>
            <input
              className="w-full rounded-lg border border-slate-700/60 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 outline-none transition-all hover:border-slate-600 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://gamru.com"
            />
          </div>

          {/* Widgets table */}
          <section className="overflow-hidden rounded-xl border border-slate-700/60">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      Loading…
                    </td>
                  </tr>
                ) : widgets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                      No widgets yet. Click “Create Widget” to add one.
                    </td>
                  </tr>
                ) : (
                  widgets.map((w) => {
                    const c = clientById.get(w.client_id);
                    const url = urlForWidget(w);
                    return (
                      <tr key={w.id} className="bg-slate-900/40 hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-medium text-slate-100">{w.name}</td>
                        <td className="px-4 py-3 text-slate-300">
                          {c ? `${c.name}` : <span className="text-slate-500">unknown</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-300">{typeLabel(w.type)}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggle(w)}
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                              w.status === 'ACTIVE'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-slate-600/30 text-slate-400'
                            }`}
                          >
                            {w.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {w.expiry_date ? new Date(w.expiry_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              title="Copy embed code"
                              disabled={!url}
                              onClick={() => url && copy(snippet(url), 'Embed code')}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100 disabled:opacity-40"
                            >
                              <Copy size={15} />
                            </button>
                            <button
                              type="button"
                              title="Preview"
                              disabled={!url}
                              onClick={() => setSelectedId(w.id)}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100 disabled:opacity-40"
                            >
                              <ExternalLink size={15} />
                            </button>
                            <button
                              type="button"
                              title="Edit"
                              onClick={() => openEdit(w)}
                              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              onClick={() => remove(w)}
                              className="rounded-md p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </section>

          {/* Preview */}
          {selected && previewUrl && (
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-100">
                  Preview — {selected.name} ({typeLabel(selected.type)})
                </h2>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Open in new tab <ExternalLink size={13} />
                </a>
              </div>
              {(() => {
                const c = clientById.get(selected.client_id);
                const code = c ? scriptEmbed(baseUrl, selected.type, c.slug, c.auth_key) : '';
                return (
                  <div className="mb-3 space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">
                          Script embed (drop-in, recommended)
                        </span>
                        {code && (
                          <button
                            type="button"
                            onClick={() => copy(code, 'Script embed')}
                            className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-blue-200"
                          >
                            <Copy size={13} /> Copy
                          </button>
                        )}
                      </div>
                      <pre className="max-h-40 overflow-auto rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 text-[11px] leading-relaxed text-slate-300">
                        {code || 'Client not found for this widget.'}
                      </pre>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Include the script once per page; add a{' '}
                        <code>&lt;div class="gamification_widget" data-type="…"&gt;</code> wherever
                        a widget should appear.
                      </p>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs font-semibold text-slate-300">
                        iFrame embed
                      </span>
                      <pre className="max-h-32 overflow-auto rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 text-[11px] leading-relaxed text-slate-300">
                        {snippet(previewUrl)}
                      </pre>
                    </div>
                  </div>
                );
              })()}
              <iframe
                key={previewUrl}
                title="Widget preview"
                src={previewUrl}
                className="h-[600px] w-full rounded-xl border border-slate-800 bg-slate-900"
                frameBorder={0}
              />
            </section>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WidgetSetupPage;
