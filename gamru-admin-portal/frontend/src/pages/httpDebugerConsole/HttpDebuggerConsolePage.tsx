import { useState, useRef, useCallback, type FC } from 'react';
import DashboardLayout from '@/layout/DashboardLayout';
import PageHeaderBreadcrumb from '@/components/PageHeaderBreadcrumb';

// ─── Types ────────────────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
type BodyFormat = 'json' | 'form' | 'raw' | 'none';
type ActiveTab = 'params' | 'headers' | 'body' | 'auth';
type ResponseTab = 'body' | 'headers' | 'cookies' | 'timeline';

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface AuthConfig {
  type: 'none' | 'bearer' | 'basic' | 'api-key';
  token: string;
  username: string;
  password: string;
  apiKeyName: string;
  apiKeyValue: string;
  apiKeyIn: 'header' | 'query';
}

interface RequestHistoryItem {
  id: string;
  method: HttpMethod;
  url: string;
  status: number | null;
  duration: number | null;
  timestamp: Date;
  response: ResponseData | null;
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
  size: number;
  ok: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  POST: 'text-blue-600 bg-blue-50 border-blue-200',
  PUT: 'text-amber-600 bg-amber-50 border-amber-200',
  PATCH: 'text-violet-600 bg-violet-50 border-violet-200',
  DELETE: 'text-red-600 bg-red-50 border-red-200',
  HEAD: 'text-slate-600 bg-slate-50 border-slate-200',
  OPTIONS: 'text-pink-600 bg-pink-50 border-pink-200',
};

const STATUS_COLOR = (status: number) => {
  if (status < 200) return 'text-slate-600 bg-slate-100';
  if (status < 300) return 'text-emerald-700 bg-emerald-100';
  if (status < 400) return 'text-amber-700 bg-amber-100';
  if (status < 500) return 'text-orange-700 bg-orange-100';
  return 'text-red-700 bg-red-100';
};

function prettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function buildUrl(base: string, params: KeyValuePair[]): string {
  const enabled = params.filter((p) => p.enabled && p.key);
  if (!enabled.length) return base;
  const qs = enabled
    .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
    .join('&');
  return base.includes('?') ? `${base}&${qs}` : `${base}?${qs}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const KVEditor: FC<{
  rows: KeyValuePair[];
  onChange: (rows: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}> = ({ rows, onChange, keyPlaceholder = 'Key', valuePlaceholder = 'Value' }) => {
  const update = (id: string, field: keyof KeyValuePair, value: string | boolean) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  const remove = (id: string) => onChange(rows.filter((r) => r.id !== id));
  const add = () => onChange([...rows, { id: uid(), key: '', value: '', enabled: true }]);

  return (
    <div className="space-y-1.5">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(e) => update(row.id, 'enabled', e.target.checked)}
            className="accent-blue-600 w-3.5 h-3.5 shrink-0"
          />
          <input
            value={row.key}
            onChange={(e) => update(row.id, 'key', e.target.value)}
            placeholder={keyPlaceholder}
            className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded  bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 min-w-0"
          />
          <input
            value={row.value}
            onChange={(e) => update(row.id, 'value', e.target.value)}
            placeholder={valuePlaceholder}
            className="flex-1 px-2.5 py-1.5 text-xs font-mono rounded  bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 min-w-0"
          />
          <button
            onClick={() => remove(row.id)}
            className="text-slate-300 hover:text-red-400 transition-colors shrink-0 text-base leading-none"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 transition-colors"
      >
        <span className="text-lg leading-none">+</span> Add
      </button>
    </div>
  );
};

const CodeBlock: FC<{ content: string; lang?: string; maxH?: string }> = ({
  content,
  maxH = 'max-h-96',
}) => (
  <pre
    className={`${maxH} overflow-auto text-xs font-mono leading-5 text-white whitespace-pre-wrap break-all`}
  >
    {content || <span className="text-slate-400 italic">Empty</span>}
  </pre>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const HttpDebuggerConsolePage: FC = () => {
  // Request state
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [activeTab, setActiveTab] = useState<ActiveTab>('params');
  const [params, setParams] = useState<KeyValuePair[]>([
    { id: uid(), key: '', value: '', enabled: true },
  ]);
  const [reqHeaders, setReqHeaders] = useState<KeyValuePair[]>([
    { id: uid(), key: 'Content-Type', value: 'application/json', enabled: true },
    { id: uid(), key: '', value: '', enabled: true },
  ]);
  const [bodyFormat, setBodyFormat] = useState<BodyFormat>('none');
  const [bodyRaw, setBodyRaw] = useState('{\n  \n}');
  const [formBody, setFormBody] = useState<KeyValuePair[]>([
    { id: uid(), key: '', value: '', enabled: true },
  ]);
  const [auth, setAuth] = useState<AuthConfig>({
    type: 'none',
    token: '',
    username: '',
    password: '',
    apiKeyName: 'X-API-Key',
    apiKeyValue: '',
    apiKeyIn: 'header',
  });

  // Response state
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [respTab, setRespTab] = useState<ResponseTab>('body');
  const [prettyMode, setPrettyMode] = useState(true);

  // History
  const [history, setHistory] = useState<RequestHistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(true);

  const abortRef = useRef<AbortController | null>(null);

  // ── Send Request ────────────────────────────────────────────────────────────
  const sendRequest = useCallback(async () => {
    if (!url.trim()) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);
    setResponse(null);

    const finalUrl = buildUrl(url.trim(), params);
    const headers: Record<string, string> = {};

    reqHeaders
      .filter((h) => h.enabled && h.key)
      .forEach((h) => {
        headers[h.key] = h.value;
      });

    // Auth
    if (auth.type === 'bearer' && auth.token) headers['Authorization'] = `Bearer ${auth.token}`;
    if (auth.type === 'basic' && auth.username)
      headers['Authorization'] = `Basic ${btoa(`${auth.username}:${auth.password}`)}`;
    if (
      auth.type === 'api-key' &&
      auth.apiKeyName &&
      auth.apiKeyValue &&
      auth.apiKeyIn === 'header'
    ) {
      headers[auth.apiKeyName] = auth.apiKeyValue;
    }

    let body: string | URLSearchParams | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      if (bodyFormat === 'json') body = bodyRaw;
      if (bodyFormat === 'raw') body = bodyRaw;
      if (bodyFormat === 'form') {
        const fd = new URLSearchParams();
        formBody.filter((f) => f.enabled && f.key).forEach((f) => fd.append(f.key, f.value));
        body = fd;
      }
    }

    const t0 = performance.now();
    const histId = uid();

    try {
      const res = await fetch(finalUrl, { method, headers, body, signal: ctrl.signal });
      const duration = Math.round(performance.now() - t0);
      const text = await res.text();
      const respHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        respHeaders[k] = v;
      });

      const data: ResponseData = {
        status: res.status,
        statusText: res.statusText,
        headers: respHeaders,
        body: text,
        duration,
        size: new Blob([text]).size,
        ok: res.ok,
      };

      setResponse(data);
      setRespTab('body');
      setHistory((prev) => [
        {
          id: histId,
          method,
          url: finalUrl,
          status: res.status,
          duration,
          timestamp: new Date(),
          response: data,
        },
        ...prev.slice(0, 49),
      ]);
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      const msg = (err as Error).message || 'Request failed';
      setError(msg);
      setHistory((prev) => [
        {
          id: histId,
          method,
          url: finalUrl,
          status: null,
          duration: null,
          timestamp: new Date(),
          response: null,
        },
        ...prev.slice(0, 49),
      ]);
    } finally {
      setLoading(false);
    }
  }, [url, method, params, reqHeaders, auth, bodyFormat, bodyRaw, formBody]);

  const cancelRequest = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  const loadHistory = (item: RequestHistoryItem) => {
    setUrl(item.url);
    setMethod(item.method);
    if (item.response) {
      setResponse(item.response);
      setError(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="p-4 w-full min-h-screen bg-[#0c1631]">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <PageHeaderBreadcrumb
            title="HTTP Debugger"
            items={[
              { label: 'Home', clickable: true },
              { label: 'Developer Tools', clickable: true },
              { label: 'HTTP Debugger Console' },
            ]}
          />
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full tracking-wide">
              LIVE
            </span>
            <span className="text-xs text-slate-500">{history.length} requests</span>
          </div>
        </div>

        <div className="flex gap-4 h-[calc(100vh-140px)]">
          {/* ── History Sidebar ── */}
          <aside
            className={`transition-all duration-200 shrink-0 overflow-hidden bg-[#101b3d] ${historyOpen ? 'w-56' : 'w-9'}`}
          >
            <div className="rounded-xl bg-[#101b3d]  h-full flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100">
                {historyOpen && (
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    History
                  </span>
                )}
                <button
                  onClick={() => setHistoryOpen((o) => !o)}
                  className="text-slate-400 hover:text-slate-600 transition-colors ml-auto text-sm"
                  title={historyOpen ? 'Collapse' : 'Expand'}
                >
                  {historyOpen ? '◀' : '▶'}
                </button>
              </div>

              {historyOpen && (
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {history.length === 0 && (
                    <p className="text-xs text-slate-400 text-center pt-6 px-2">No requests yet</p>
                  )}
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadHistory(item)}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`text-[10px] font-bold px-1 py-0.5 rounded border ${METHOD_COLORS[item.method]}`}
                        >
                          {item.method}
                        </span>
                        {item.status && (
                          <span
                            className={`text-[10px] font-semibold px-1 rounded ${STATUS_COLOR(item.status)}`}
                          >
                            {item.status}
                          </span>
                        )}
                        {!item.status && (
                          <span className="text-[10px] font-semibold px-1 rounded text-red-600 bg-red-50">
                            ERR
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-mono text-slate-500 truncate w-full">
                        {item.url.replace(/^https?:\/\//, '')}
                      </p>
                      {item.duration != null && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{item.duration}ms</p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {historyOpen && history.length > 0 && (
                <div className="border-t border-slate-100 p-2">
                  <button
                    onClick={() => setHistory([])}
                    className="w-full text-xs text-slate-400 hover:text-red-500 transition-colors py-1"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* ── Main Panel ── */}
          <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
            {/* URL Bar */}
            <div className="bg-[#101b3d] rounded-xl  p-3">
              <div className="flex gap-2 items-center">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as HttpMethod)}
                  className={`shrink-0 text-xs font-bold px-2.5 py-2 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100 ${METHOD_COLORS[method]}`}
                >
                  {(
                    ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as HttpMethod[]
                  ).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
                  placeholder="https://api.example.com/endpoint"
                  className="flex-1 px-3 py-2 text-sm font-mono rounded-lg  bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all min-w-0"
                />

                {loading ? (
                  <button
                    onClick={cancelRequest}
                    className="shrink-0 px-5 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-sm font-semibold rounded-lg  hover:border-red-200 transition-all"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={sendRequest}
                    className="shrink-0 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-100 transition-all active:scale-95"
                  >
                    Send
                  </button>
                )}
              </div>
            </div>

            {/* Request Config + Response side by side */}
            <div className="flex-1 flex gap-4 min-h-0">
              {/* Request Config */}
              <div className="flex-1 bg-[#101b3d] rounded-xl  flex flex-col min-h-0 min-w-0">
                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-4 pt-3 gap-1 shrink-0">
                  {(['params', 'headers', 'body', 'auth'] as ActiveTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 pb-2.5 text-xs font-semibold capitalize transition-all border-b-2 -mb-px ${
                        activeTab === tab
                          ? 'text-blue-600 border-blue-600'
                          : 'text-slate-400 border-transparent hover:text-slate-600'
                      }`}
                    >
                      {tab}
                      {tab === 'params' && params.filter((p) => p.enabled && p.key).length > 0 && (
                        <span className="ml-1.5 bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full">
                          {params.filter((p) => p.enabled && p.key).length}
                        </span>
                      )}
                      {tab === 'headers' &&
                        reqHeaders.filter((h) => h.enabled && h.key).length > 0 && (
                          <span className="ml-1.5 bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full">
                            {reqHeaders.filter((h) => h.enabled && h.key).length}
                          </span>
                        )}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Params */}
                  {activeTab === 'params' && (
                    <div>
                      <p className="text-xs text-slate-400 mb-3 font-medium">
                        Query parameters appended to the URL
                      </p>
                      <KVEditor
                        rows={params}
                        onChange={setParams}
                        keyPlaceholder="param"
                        valuePlaceholder="value"
                      />
                      {params.filter((p) => p.enabled && p.key).length > 0 && (
                        <div className="mt-4 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-medium mb-1">Preview</p>
                          <p className="text-[10px] font-mono text-slate-600 break-all">
                            {buildUrl(url || 'https://...', params)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Headers */}
                  {activeTab === 'headers' && (
                    <div>
                      <p className="text-xs text-slate-400 mb-3 font-medium">
                        Custom request headers
                      </p>
                      <KVEditor
                        rows={reqHeaders}
                        onChange={setReqHeaders}
                        keyPlaceholder="Header-Name"
                        valuePlaceholder="value"
                      />
                    </div>
                  )}

                  {/* Body */}
                  {activeTab === 'body' && (
                    <div>
                      <div className="flex gap-2 mb-3">
                        {(['none', 'json', 'form', 'raw'] as BodyFormat[]).map((fmt) => (
                          <label key={fmt} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              checked={bodyFormat === fmt}
                              onChange={() => setBodyFormat(fmt)}
                              className="accent-blue-600"
                            />
                            <span className="text-xs font-medium capitalize text-slate-600">
                              {fmt}
                            </span>
                          </label>
                        ))}
                      </div>

                      {bodyFormat === 'none' && (
                        <p className="text-xs text-slate-400 italic">No request body</p>
                      )}

                      {(bodyFormat === 'json' || bodyFormat === 'raw') && (
                        <textarea
                          value={bodyRaw}
                          onChange={(e) => setBodyRaw(e.target.value)}
                          rows={12}
                          spellCheck={false}
                          placeholder={
                            bodyFormat === 'json' ? '{\n  "key": "value"\n}' : 'Raw body content...'
                          }
                          className="w-full text-xs font-mono p-3 rounded-lg  bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 resize-none transition-all"
                        />
                      )}

                      {bodyFormat === 'form' && (
                        <KVEditor
                          rows={formBody}
                          onChange={setFormBody}
                          keyPlaceholder="field"
                          valuePlaceholder="value"
                        />
                      )}
                    </div>
                  )}

                  {/* Auth */}
                  {activeTab === 'auth' && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-500 block mb-1.5">
                          Auth type
                        </label>
                        <select
                          value={auth.type}
                          onChange={(e) =>
                            setAuth((a) => ({ ...a, type: e.target.value as AuthConfig['type'] }))
                          }
                          className="text-xs px-2.5 py-2 rounded-lg  bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                        >
                          <option value="none">No Auth</option>
                          <option value="bearer">Bearer Token</option>
                          <option value="basic">Basic Auth</option>
                          <option value="api-key">API Key</option>
                        </select>
                      </div>

                      {auth.type === 'bearer' && (
                        <div>
                          <label className="text-xs font-medium text-slate-500 block mb-1.5">
                            Token
                          </label>
                          <input
                            type="text"
                            value={auth.token}
                            onChange={(e) => setAuth((a) => ({ ...a, token: e.target.value }))}
                            placeholder="eyJ..."
                            className="w-full px-2.5 py-2 text-xs font-mono rounded-lg  bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                          />
                        </div>
                      )}

                      {auth.type === 'basic' && (
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium text-slate-500 block mb-1.5">
                              Username
                            </label>
                            <input
                              type="text"
                              value={auth.username}
                              onChange={(e) => setAuth((a) => ({ ...a, username: e.target.value }))}
                              className="w-full px-2.5 py-2 text-xs font-mono rounded-lg  bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 block mb-1.5">
                              Password
                            </label>
                            <input
                              type="password"
                              value={auth.password}
                              onChange={(e) => setAuth((a) => ({ ...a, password: e.target.value }))}
                              className="w-full px-2.5 py-2 text-xs font-mono rounded-lg  bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                            />
                          </div>
                        </div>
                      )}

                      {auth.type === 'api-key' && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="text-xs font-medium text-slate-500 block mb-1.5">
                                Key name
                              </label>
                              <input
                                type="text"
                                value={auth.apiKeyName}
                                onChange={(e) =>
                                  setAuth((a) => ({ ...a, apiKeyName: e.target.value }))
                                }
                                className="w-full px-2.5 py-2 text-xs font-mono rounded-lg  bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-slate-500 block mb-1.5">
                                Add to
                              </label>
                              <select
                                value={auth.apiKeyIn}
                                onChange={(e) =>
                                  setAuth((a) => ({
                                    ...a,
                                    apiKeyIn: e.target.value as 'header' | 'query',
                                  }))
                                }
                                className="px-2.5 py-2 text-xs rounded-lg  bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                              >
                                <option value="header">Header</option>
                                <option value="query">Query</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 block mb-1.5">
                              Value
                            </label>
                            <input
                              type="text"
                              value={auth.apiKeyValue}
                              onChange={(e) =>
                                setAuth((a) => ({ ...a, apiKeyValue: e.target.value }))
                              }
                              className="w-full px-2.5 py-2 text-xs font-mono rounded-lg  bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Response Panel ── */}
              <div className="flex-1 bg-[#101b3d] rounded-xl  flex flex-col min-h-0 min-w-0">
                {/* Response header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Response
                    </span>
                    {response && (
                      <>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${STATUS_COLOR(response.status)}`}
                        >
                          {response.status} {response.statusText}
                        </span>
                        <span className="text-xs text-slate-400">{response.duration}ms</span>
                        <span className="text-xs text-slate-400">
                          {response.size < 1024
                            ? `${response.size} B`
                            : `${(response.size / 1024).toFixed(1)} KB`}
                        </span>
                      </>
                    )}
                  </div>

                  {response && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPrettyMode((m) => !m)}
                        className={`text-[10px] px-2 py-1 rounded border transition-all ${prettyMode ? 'bg-blue-50 border-blue-200 text-blue-600 font-semibold' : 'border-slate-200 text-slate-400 hover:text-slate-600'}`}
                      >
                        Pretty
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(response.body)}
                        className="text-[10px] px-2 py-1 rounded  text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>

                {/* Response tabs */}
                {response && (
                  <div className="flex border-b border-slate-100 px-4 gap-1 shrink-0">
                    {(['body', 'headers', 'cookies', 'timeline'] as ResponseTab[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setRespTab(tab)}
                        className={`px-3 pb-2.5 pt-2 text-xs font-semibold capitalize transition-all border-b-2 -mb-px ${
                          respTab === tab
                            ? 'text-blue-600 border-blue-600'
                            : 'text-slate-400 border-transparent hover:text-slate-600'
                        }`}
                      >
                        {tab}
                        {tab === 'headers' && (
                          <span className="ml-1 text-[10px] text-slate-400">
                            ({Object.keys(response.headers).length})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Response body */}
                <div className="flex-1 overflow-y-auto p-4 min-h-0">
                  {/* Loading */}
                  {loading && (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                      <p className="text-xs text-slate-400">Sending request…</p>
                    </div>
                  )}

                  {/* Error */}
                  {!loading && error && (
                    <div className="h-full flex flex-col items-center justify-center gap-2">
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl max-w-xs text-center">
                        <p className="text-xs font-semibold text-red-700 mb-1">Request failed</p>
                        <p className="text-xs text-red-500 font-mono break-all">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!loading && !error && !response && (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50  flex items-center justify-center text-2xl mb-1">
                        ↑
                      </div>
                      <p className="text-sm font-medium text-slate-600">Ready to send</p>
                      <p className="text-xs text-slate-400 max-w-[180px]">
                        Configure your request and press Send
                      </p>
                    </div>
                  )}

                  {/* Response data */}
                  {!loading && response && (
                    <>
                      {respTab === 'body' && (
                        <div className="bg-[#101b3d]  rounded-xl border border-slate-100 p-3">
                          <CodeBlock
                            content={prettyMode ? prettyJson(response.body) : response.body}
                            maxH="max-h-full"
                          />
                        </div>
                      )}

                      {respTab === 'headers' && (
                        <div className="space-y-1">
                          {Object.entries(response.headers).map(([k, v]) => (
                            <div
                              key={k}
                              className="flex gap-3 items-start py-1.5 border-b border-slate-50"
                            >
                              <span className="text-xs font-semibold text-slate-600 min-w-[160px] shrink-0">
                                {k}
                              </span>
                              <span className="text-xs font-mono text-slate-500 break-all">
                                {v}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {respTab === 'cookies' && (
                        <div>
                          {response.headers['set-cookie'] ? (
                            <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                              <CodeBlock content={response.headers['set-cookie']} />
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No cookies in response</p>
                          )}
                        </div>
                      )}

                      {respTab === 'timeline' && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-right text-xs text-slate-500">DNS Lookup</div>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-purple-400 rounded-full"
                                style={{ width: '8%' }}
                              />
                            </div>
                            <div className="text-xs font-mono text-slate-500 w-12">~5ms</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-right text-xs text-slate-500">Connect</div>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-400 rounded-full"
                                style={{ width: '15%' }}
                              />
                            </div>
                            <div className="text-xs font-mono text-slate-500 w-12">~12ms</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-right text-xs text-slate-500">TLS</div>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-cyan-400 rounded-full"
                                style={{ width: '20%' }}
                              />
                            </div>
                            <div className="text-xs font-mono text-slate-500 w-12">~18ms</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-right text-xs text-slate-500">Send</div>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full"
                                style={{ width: '5%' }}
                              />
                            </div>
                            <div className="text-xs font-mono text-slate-500 w-12">~2ms</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-right text-xs text-slate-500">
                              Wait (TTFB)
                            </div>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-orange-400 rounded-full"
                                style={{ width: '40%' }}
                              />
                            </div>
                            <div className="text-xs font-mono text-slate-500 w-12">~35ms</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 text-right text-xs text-slate-500">Download</div>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 rounded-full"
                                style={{ width: '12%' }}
                              />
                            </div>
                            <div className="text-xs font-mono text-slate-500 w-12">~8ms</div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between">
                            <span className="text-xs text-slate-500">Total</span>
                            <span className="text-xs font-bold font-mono text-slate-700">
                              {response.duration}ms
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HttpDebuggerConsolePage;
