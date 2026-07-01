import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FC,
  type ReactNode,
} from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  widgetApi,
  type WidgetAppearance,
  type WidgetPlayer,
  type WidgetMission,
  type WidgetTournament,
  type WidgetBundle,
} from '@/services/widget.api';

/* The full-page, interactive widgets (one screen each). */
const PAGE_TYPES = [
  'mission',
  'mission-bundle',
  'tournament',
  'reward-shop',
  'rewards',
  'campaign',
  'rankings',
  'profile',
  'status',
  'progress',
] as const;
type PageType = (typeof PAGE_TYPES)[number];

/* Small inline "data" widgets embedded via the loader script. */
const COMPACT_TYPES = ['tokens', 'gamification-data', 'avatar', 'badge-level'] as const;
const ALL_TYPES = [...PAGE_TYPES, 'points', ...COMPACT_TYPES] as const;
type WidgetType = (typeof ALL_TYPES)[number];

const TITLES: Record<PageType, string> = {
  mission: 'Missions',
  'mission-bundle': 'Mission Bundles',
  tournament: 'Tournaments',
  'reward-shop': 'Reward Shop',
  rewards: 'My Rewards',
  campaign: 'Campaigns',
  rankings: 'Rankings',
  profile: 'Profile',
  status: 'Account Status',
  progress: 'Progress',
};

/* ---------- theming (all UI driven by gamru-configured tokens) -------- */

const PRESETS = {
  dark: { bg: '#0f172a', surface: '#1e293b', text: '#e2e8f0', muted: '#94a3b8', border: '#334155' },
  light: {
    bg: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    muted: '#64748b',
    border: '#e2e8f0',
  },
};

interface Tokens {
  accent: string;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  radius: number;
  font: number;
  space: number;
  padding: number;
  margin: number;
  align: 'left' | 'center' | 'right';
  maxWidth: number;
  bgImage: string;
  size: 'small' | 'medium' | 'large';
  fullWidth: boolean;
  width: number;
  minHeight: number;
}

/** Inline-widget pixel sizes per `size` preset. */
const AVATAR_SIZE: Record<Tokens['size'], number> = { small: 64, medium: 110, large: 150 };
const BADGE_SIZE: Record<Tokens['size'], number> = { small: 26, medium: 38, large: 52 };

const resolveTokens = (a: WidgetAppearance | null, isMobile: boolean): Tokens => {
  const p = PRESETS[a?.theme === 'light' ? 'light' : 'dark'];
  const baseSpace = (isMobile ? a?.mobile?.spacing : undefined) ?? a?.spacing ?? 16;
  const font = (isMobile ? a?.mobile?.font_size : undefined) ?? a?.font_size ?? 14;
  const space = a?.layout === 'compact' ? Math.round(baseSpace * 0.6) : baseSpace;
  return {
    accent: a?.accent_color || '#6366f1',
    bg: a?.bg_color || p.bg,
    surface: a?.surface_color || p.surface,
    text: a?.text_color || p.text,
    muted: a?.muted_color || p.muted,
    border: a?.border_color || p.border,
    radius: a?.radius ?? 12,
    font,
    space,
    padding: a?.padding ?? space,
    margin: a?.margin ?? 0,
    align: a?.align ?? 'center',
    maxWidth: a?.max_width && a.max_width > 0 ? a.max_width : 672,
    bgImage: a?.bg_image || '',
    size: a?.size ?? 'medium',
    fullWidth: !!a?.full_width,
    width: a?.width ?? 0,
    minHeight: a?.min_height ?? 0,
  };
};

/** marginLeft/Right that positions the content block per the align token. */
const alignStyle = (align: Tokens['align']): CSSProperties => ({
  marginLeft: align === 'left' ? 0 : 'auto',
  marginRight: align === 'right' ? 0 : 'auto',
});

const cssVars = (t: Tokens): Record<string, string> => ({
  '--gw-accent': t.accent,
  '--gw-bg': t.bg,
  '--gw-surface': t.surface,
  '--gw-text': t.text,
  '--gw-muted': t.muted,
  '--gw-border': t.border,
  '--gw-radius': `${t.radius}px`,
  '--gw-font': `${t.font}px`,
  '--gw-space': `${t.space}px`,
});

const CARD: CSSProperties = {
  background: 'var(--gw-surface)',
  border: '1px solid var(--gw-border)',
  borderRadius: 'var(--gw-radius)',
  color: 'var(--gw-text)',
  padding: 'var(--gw-space)',
  boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 8px 20px rgba(0,0,0,0.10)',
};
const MUTED: CSSProperties = { color: 'var(--gw-muted)' };
const ACCENT_BG: CSSProperties = { background: 'var(--gw-accent)' };
/** Accent with a soft 3D gradient for buttons, badges, bars and icon chips. */
const ACCENT_GRAD: CSSProperties = {
  background:
    'linear-gradient(135deg, var(--gw-accent), color-mix(in srgb, var(--gw-accent) 55%, #000))',
};
/** Subtle accent-tinted surface for leading icon chips. */
const ACCENT_SOFT: CSSProperties = {
  background: 'color-mix(in srgb, var(--gw-accent) 16%, transparent)',
};
const colGap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'calc(var(--gw-space) * 0.6)',
};

/** Icon shown in each widget header / list row. */
const TYPE_ICON: Record<string, string> = {
  mission: '🎯',
  'mission-bundle': '🧩',
  tournament: '⚔️',
  'reward-shop': '🛍️',
  rewards: '🎁',
  campaign: '📣',
  rankings: '🏆',
  profile: '👤',
  status: '✅',
  progress: '📈',
};
/** Pretty labels for mission game keys (mirrors the mission wizard options). */
const GAME_LABELS: Record<string, string> = {
  slider: 'Slider',
  'lucky-spinner': 'Lucky Spinner',
  'dragon-run': 'Dragon Run',
  'memory-match': 'Memory Match',
  'click-storm': 'Click Storm',
  snake: 'Snake',
  'teen-patti': 'Teen Patti',
  aviator: 'Aviator',
};
const SUBTITLES: Record<string, string> = {
  mission: 'Complete missions to earn rewards',
  'mission-bundle': 'Grouped missions — play and claim each',
  tournament: 'Compete and climb the leaderboard',
  'reward-shop': 'Spend your tokens on rewards',
  rewards: 'Your earned rewards & history',
  campaign: 'Active campaigns & activity',
  rankings: 'The rank ladder and your position',
  profile: 'Your player profile',
  status: 'Your account status & achievements',
  progress: 'Your level, XP and progression',
};

/* ---------- helpers --------------------------------------------------- */

type Item = Record<string, unknown>;
const asArray = (v: unknown): Item[] => (Array.isArray(v) ? (v as Item[]) : []);
const str = (v: unknown, fallback = '—'): string =>
  v === null || v === undefined || v === '' ? fallback : String(v);
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const titleCase = (v: string) => v.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const extractMsg = (e: unknown): string => {
  const err = e as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || 'Something went wrong';
};
const gam = (p: WidgetPlayer | null): Record<string, unknown> =>
  (p?.gamification as Record<string, unknown>) ?? {};

/** Representative data so the gamru live preview shows a realistic layout
 *  even when no real player email is supplied. */
const SAMPLE_PLAYER: WidgetPlayer = {
  id: 'sample',
  first_name: 'Alex',
  last_name: 'Morgan',
  username: 'alexmorgan',
  email: 'alex@example.com',
  mobile: '+1 555 0142',
  status: 'ACTIVE',
  tokens: 1250,
  level: 7,
  rank_name: 'Gold',
  avatar_url: '',
  gamification: {
    progress: { level: 7, rank_name: 'Gold', xp_points: 620, xp_to_next: 380, max_level: 20 },
    next_rank: { rank_name: 'Platinum', level: 8, xp_required: 1000, xp_remaining: 380 },
    levels: [
      { level: 1, rank_name: 'Bronze' },
      { level: 4, rank_name: 'Silver' },
      { level: 7, rank_name: 'Gold' },
      { level: 10, rank_name: 'Platinum' },
      { level: 15, rank_name: 'Diamond' },
    ],
    ranks: [],
    missions: [
      {
        id: 'm1',
        name: 'High Flyer',
        status: 'active',
        description: 'Wager across our top slots and bank a bonus.',
        data: {
          large_image: 'https://picsum.photos/seed/highflyer/480/320',
          category: 'Casino',
          vip: true,
          duration_days: 7,
          reward_label: '50 Bonus Bets x $2',
          reward_amount: 100,
          reward_type: 'bonus_cash',
          objective_type: 'wager',
          condition_label: 'Wager $500',
          min_bet: 1,
          bet_currency: 'All Currencies',
          games: ['mines', 'dice', 'plinko'],
          bonus_wagering: 'Excluded',
          deposit_required: true,
          wagering_required: true,
          more_details:
            'Complete the wager requirement within the mission window to unlock your bonus.',
        },
      },
      {
        id: 'm2',
        name: 'Daily Spin',
        status: 'active',
        description: 'Log in today and grab your free spins.',
        data: {
          large_image: 'https://picsum.photos/seed/dailyspin/480/320',
          category: 'Casino',
          duration_days: 1,
          reward_label: '50 Free Spins',
          reward_amount: 50,
          reward_type: 'free_spins',
          objective_type: 'login',
          condition_label: 'Log in 1 day',
          bet_currency: 'All Currencies',
          bonus_wagering: 'Excluded',
        },
      },
      {
        id: 'm3',
        name: 'Weekend Warrior',
        status: 'completed',
        data: {
          category: 'Sport',
          duration_days: 3,
          reward_label: '1 Bonus Bet',
          reward_amount: 1,
          reward_type: 'bonus_bet',
          objective_type: 'bet_count',
          condition_label: 'Place 10 bets',
          min_bet: 5,
          bet_currency: 'USD',
          games: ['football'],
          bonus_wagering: 'Included',
          wagering_required: true,
          more_details: 'Place qualifying bets across the weekend to earn your reward.',
        },
      },
    ],
    tournaments: [
      {
        id: 't1',
        name: 'Mining Rush',
        status: 'scheduled',
        data: { category: 'Casino', prize_label: '$1,000' },
      },
      { id: 't2', name: 'Dog House Derby', status: 'active', data: { category: 'Casino' } },
    ],
    reward_shop: [
      {
        id: 'p1',
        name: 'Amazon Echo Dot',
        status: 'ACTIVE',
        data: {
          category: 'Product',
          token_price: 200,
          large_image: 'https://picsum.photos/seed/echodot/400/400',
          description: 'Play music, audiobooks and podcasts throughout your home.',
        },
      },
      {
        id: 'p2',
        name: 'Nintendo Switch',
        status: 'ACTIVE',
        data: {
          category: 'Product',
          token_price: 5000,
          large_image: 'https://picsum.photos/seed/switch/400/400',
          description: 'Play the games you want, wherever you are.',
          eligibility_type: 'Ranks',
          ranks: ['Gold'],
        },
      },
      {
        id: 'p3',
        name: 'Tokens Booster 2X',
        status: 'ACTIVE',
        data: {
          category: 'Booster',
          token_price: 50,
          large_image: 'https://picsum.photos/seed/booster/400/400',
          description: 'Double your token count for 5 minutes!',
        },
      },
    ],
    rewards: [
      {
        id: 'r1',
        label: 'Amazon Gift Card $20',
        reward_type: 'gift_card',
        status: 'granted',
        amount: 20,
      },
      { id: 'r2', label: 'Free Spins x50', reward_type: 'free_spins', status: 'claimed' },
      {
        id: 'r3',
        gamification_source: 'reward-shop',
        reward_type: 'reward_shop_purchase',
        reward: 'Amazon Echo Dot — tokens 200',
        status: 'granted',
        granted_date: '2026-06-10T12:00:00.000Z',
      },
      {
        id: 'r4',
        gamification_source: 'reward-shop',
        reward_type: 'reward_shop_purchase',
        reward: 'Tokens Booster 2X — tokens 50',
        status: 'granted',
        granted_date: '2026-06-12T12:00:00.000Z',
      },
    ],
    logs: [
      { id: 'l1', action: 'mission_completed', detail: 'Completed "Daily Spin"' },
      { id: 'l2', action: 'reward_granted', detail: 'Earned 50 tokens' },
    ],
  },
};

/* ---------- atoms (read tokens via cascading CSS vars) ---------------- */

const Card: FC<{ children: ReactNode; style?: CSSProperties; onClick?: () => void }> = ({
  children,
  style,
  onClick,
}) => {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{ ...CARD, ...style }}
        className="group block w-full cursor-pointer text-left transition hover:brightness-110"
      >
        {children}
      </button>
    );
  }
  return <div style={{ ...CARD, ...style }}>{children}</div>;
};

const Empty: FC<{ label: string }> = ({ label }) => (
  <div style={{ ...CARD, textAlign: 'center', padding: 'calc(var(--gw-space) * 2)', ...MUTED }}>
    {label}
  </div>
);

const IconChip: FC<{ icon: string; size?: number }> = ({ icon, size = 38 }) => (
  <span
    className="flex shrink-0 items-center justify-center rounded-xl"
    style={{ ...ACCENT_SOFT, width: size, height: size, fontSize: size * 0.5 }}
  >
    {icon}
  </span>
);

/** A soft accent-gradient placeholder shown when an image is missing/broken. */
const IMG_FALLBACK: CSSProperties = {
  background:
    'linear-gradient(135deg, color-mix(in srgb, var(--gw-accent) 70%, #000), var(--gw-bg))',
};

/** Image thumbnail/banner with a graceful gradient fallback (icon centered).
 *  `fit="contain"` (on a light surface) suits product shots that shouldn't be
 *  cropped; the default `cover` keeps mission/banner art edge-to-edge. */
const Thumb: FC<{
  src?: string;
  size?: number;
  icon?: string;
  banner?: boolean;
  fit?: 'cover' | 'contain';
  height?: number;
}> = ({ src, size = 64, icon = '🎯', banner, fit = 'cover', height }) => {
  const [broken, setBroken] = useState(false);
  const show = !!src && !broken;
  const box: CSSProperties = banner
    ? { width: '100%', height: height ?? 156, borderRadius: 'var(--gw-radius)' }
    : { width: size, height: size, borderRadius: 'calc(var(--gw-radius) * 0.8)' };
  const surface: CSSProperties = !show
    ? IMG_FALLBACK
    : fit === 'contain'
      ? { background: 'var(--gw-bg)' }
      : {};
  return (
    <div
      className="relative grid shrink-0 place-items-center overflow-hidden"
      style={{ ...box, ...surface }}
    >
      {show ? (
        <img
          src={src}
          alt=""
          onError={() => setBroken(true)}
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: fit }}
        />
      ) : (
        <span style={{ fontSize: (banner ? 130 : size) * 0.42 }}>{icon}</span>
      )}
    </div>
  );
};

/* ---------- reward-shop helpers (raw gamru rows: fields live in `data`) --- */

const rsPrice = (d: Item): number => num(d.token_price ?? d.price ?? d.cost ?? d.token_cost);
const rsImage = (d: Item): string | undefined =>
  str(d.large_image, '') || str(d.small_image, '') || undefined;
/** Stock left: null = untracked/unlimited, otherwise the remaining count. */
const rsStock = (d: Item): number | null => {
  const v = d.stock_available ?? d.stock_total;
  return v === undefined || v === null || v === '' ? null : num(v);
};
/** Rank-gating tier label (e.g. "Gold") when the item is restricted to ranks. */
const rsTier = (d: Item): string | null => {
  if (str(d.eligibility_type) !== 'Ranks') return null;
  const ranks = d.ranks;
  if (!Array.isArray(ranks) || !ranks.length) return null;
  const first = ranks[0];
  if (typeof first === 'string') return titleCase(first);
  if (first && typeof first === 'object') {
    const o = first as Item;
    return str(o.rank_name ?? o.name ?? o.label, '') || null;
  }
  return null;
};

/** A reward-shop purchase row (from `gamification.rewards`) → boosters/history. */
interface ShopPurchase {
  id: string;
  name: string;
  qty: number;
  tokens: number;
  date: string;
}
/** Reward-shop buys are recorded as `gamification_source: 'reward-shop'`. */
const isShopPurchase = (r: Item): boolean =>
  str(r.gamification_source) === 'reward-shop' || str(r.reward_type) === 'reward_shop_purchase';
/** Parse the buy label `"Name ×2 — tokens 400"` (written by the gamru backend). */
const parsePurchase = (r: Item): ShopPurchase => {
  const label = str(r.reward, '');
  const TOK = ' — tokens ';
  const sep = label.lastIndexOf(TOK);
  let name = sep >= 0 ? label.slice(0, sep) : label;
  const tokens = sep >= 0 ? num(label.slice(sep + TOK.length)) : 0;
  let qty = 1;
  const qm = name.match(/\s×(\d+)$/);
  if (qm) {
    qty = num(qm[1]);
    name = name.replace(/\s×\d+$/, '');
  }
  return {
    id: str(r.id),
    name: name.trim() || 'Purchase',
    qty,
    tokens,
    date: str(r.granted_date ?? r.created_at, ''),
  };
};
const fmtDate = (s: string): string => {
  if (!s) return '';
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

/** Label/value rows inside a bordered card (top divider between rows). */
const DetailRows: FC<{ rows: [string, ReactNode][] }> = ({ rows }) => (
  <div style={{ ...CARD, padding: 0 }}>
    {rows.map(([label, value], i) => (
      <div
        key={label}
        className="flex items-center justify-between gap-4 px-4 py-2.5"
        style={i ? { borderTop: '1px solid var(--gw-border)' } : undefined}
      >
        <span className="text-sm" style={MUTED}>
          {label}
        </span>
        <span className="text-right text-sm font-semibold">{value}</span>
      </div>
    ))}
  </div>
);

const Stat: FC<{ label: string; value: ReactNode; icon?: string }> = ({ label, value, icon }) => (
  <div style={CARD}>
    <div className="flex items-center gap-1.5">
      {icon ? <span style={{ fontSize: 'calc(var(--gw-font) + 2px)' }}>{icon}</span> : null}
      <p className="text-[11px] font-medium uppercase tracking-wide" style={MUTED}>
        {label}
      </p>
    </div>
    <p className="mt-1 font-bold" style={{ fontSize: 'calc(var(--gw-font) + 6px)' }}>
      {value}
    </p>
  </div>
);

const Badge: FC<{ children: ReactNode }> = ({ children }) => (
  <span
    className="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm"
    style={ACCENT_GRAD}
  >
    {children}
  </span>
);

/** Action button for the interactive mission/tournament controls. */
const ActBtn: FC<{
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  children: ReactNode;
}> = ({ onClick, disabled, primary, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50"
    style={
      primary
        ? { ...ACCENT_GRAD, color: '#fff' }
        : { background: 'var(--gw-bg)', color: 'var(--gw-text)' }
    }
  >
    {children}
  </button>
);

const ProgressBar: FC<{ value: number; max: number; showValue?: boolean }> = ({
  value,
  max,
  showValue,
}) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className="relative h-3 w-full overflow-hidden rounded-full"
      style={{ background: 'var(--gw-border)' }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, ...ACCENT_GRAD }}
      />
      {showValue ? (
        <span
          className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}
        >
          {value.toLocaleString()}
        </span>
      ) : null}
    </div>
  );
};

const ListRow: FC<{
  icon?: string;
  title: string;
  subtitle?: string | null;
  status?: string | null;
  onClick: () => void;
}> = ({ icon, title, subtitle, status, onClick }) => (
  <Card onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    {icon ? <IconChip icon={icon} /> : null}
    <div className="min-w-0 flex-1">
      <p className="truncate font-semibold" style={{ fontSize: 'var(--gw-font)' }}>
        {title}
      </p>
      {subtitle ? (
        <p className="mt-0.5 truncate text-xs" style={MUTED}>
          {subtitle}
        </p>
      ) : null}
    </div>
    <div className="flex shrink-0 items-center gap-2">
      {status ? <Badge>{titleCase(status)}</Badge> : null}
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full text-sm transition-transform group-hover:translate-x-0.5"
        style={{ ...ACCENT_SOFT, color: 'var(--gw-accent)' }}
      >
        ›
      </span>
    </div>
  </Card>
);

/* ====================================================================== */

const WidgetView: FC = () => {
  const { type = '' } = useParams<{ type: string }>();
  const [sp] = useSearchParams();
  const authKey = sp.get('authKey') ?? '';
  const clientId = sp.get('clientId') ?? undefined;
  const email = sp.get('email') ?? '';
  // The hostname of the page that embeds this widget. The browser can't tell
  // the backend this (the validate request's Origin is THIS iframe's own host,
  // i.e. the gamru frontend), so the SDK passes the parent host as ?domain=.
  // That's what the per-widget allowed_domains whitelist is matched against.
  const domain = sp.get('domain') ?? undefined;

  const fid = sp.get('fid');
  const embed = sp.get('embed') === '1';
  // Live-preview support (gamru setup page): an unsaved appearance can be
  // passed inline, and `preview=1` renders the look even if the validation
  // gate (status/expiry/domain) would otherwise block it.
  const preview = sp.get('preview') === '1';
  const overrideAppearance = useMemo<WidgetAppearance | null>(() => {
    const raw = sp.get('appearance');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as WidgetAppearance;
    } catch {
      return null;
    }
  }, [sp]);
  // Live-preview catalog override (gamru editor): real missions / reward-shop /
  // ranks fetched admin-side and passed in, so the no-email preview shows the
  // operator's actual data instead of the built-in dummy sample.
  const overrideSample = useMemo<Record<string, unknown> | null>(() => {
    const raw = sp.get('sample');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [sp]);
  const previewPlayer = useMemo<WidgetPlayer>(
    () =>
      overrideSample
        ? {
            ...SAMPLE_PLAYER,
            gamification: { ...(SAMPLE_PLAYER.gamification ?? {}), ...overrideSample },
          }
        : SAMPLE_PLAYER,
    [overrideSample]
  );
  const gType = sp.get('g') ?? 'rank';
  const size = num(sp.get('size')) || 110;
  const showLevel = sp.get('showLevel') === 'true';
  const progressType = sp.get('progressType') ?? 'rank';
  const textColor = sp.get('textColor') ?? undefined;
  const reverse = sp.get('reverse') === 'true';

  const widgetType = useMemo(
    () => (ALL_TYPES.includes(type as WidgetType) ? (type as WidgetType) : null),
    [type]
  );
  const isCompact = !!widgetType && (COMPACT_TYPES as readonly string[]).includes(widgetType);
  const isPage = !!widgetType && (PAGE_TYPES as readonly string[]).includes(widgetType);

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [player, setPlayer] = useState<WidgetPlayer | null>(null);
  const [appearance, setAppearance] = useState<WidgetAppearance | null>(overrideAppearance);

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 640
  );
  useEffect(() => {
    const on = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  const tokens = useMemo(() => resolveTokens(appearance, isMobile), [appearance, isMobile]);
  const vars = useMemo(() => cssVars(tokens), [tokens]);
  const accent = tokens.accent;

  const [detail, setDetail] = useState<Item | null>(null);
  const [qty, setQty] = useState(1);
  // Reward-shop sub-tabs (mirrors the games-platform Reward Shop page).
  const [shopTab, setShopTab] = useState<'shop' | 'boosters' | 'history'>('shop');
  const [action, setAction] = useState<{ busy: boolean; msg: string; ok: boolean }>({
    busy: false,
    msg: '',
    ok: false,
  });

  const playerId = str(player?.id, '');
  const rootRef = useRef<HTMLDivElement>(null);

  const loadPlayer = useCallback(async () => {
    if (!email) return;
    try {
      const res = await widgetApi.playerByEmail(email, authKey);
      setPlayer(res.data ?? null);
    } catch {
      setPlayer(null);
    }
  }, [email, authKey]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setStatus('loading');
        if (!widgetType) throw new Error('Unknown widget type');
        try {
          const v = await widgetApi.validate({ type: widgetType, clientId, authKey, domain });
          if (!v.success) throw new Error(v.message || 'Validation failed');
          if (active) setAppearance(overrideAppearance ?? v.data?.appearance ?? null);
        } catch (e) {
          // In preview, render the look even if the gate fails (data still
          // requires a valid auth key, so nothing sensitive is exposed).
          if (!preview) throw e;
          if (active) setAppearance(overrideAppearance ?? null);
        }
        if (email) {
          try {
            const res = await widgetApi.playerByEmail(email, authKey);
            if (active) setPlayer(res.data ?? (preview ? previewPlayer : null));
          } catch {
            if (active) setPlayer(preview ? previewPlayer : null);
          }
        } else if (active && preview) {
          // No email in the editor preview — show the operator's real catalog
          // (passed via `sample`) or representative dummy data as a fallback.
          setPlayer(previewPlayer);
        }
        if (active) setStatus('ready');
      } catch (e) {
        if (active) {
          setError(extractMsg(e));
          setStatus('error');
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [widgetType, authKey, clientId, email, domain, preview, overrideAppearance, previewPlayer]);

  useEffect(() => {
    if (!embed) return;
    const body = document.body;
    const prev = body.style.background;
    document.documentElement.style.background = 'transparent';
    body.style.background = 'transparent';
    return () => {
      body.style.background = prev;
    };
  }, [embed]);

  useEffect(() => {
    if (!fid) return;
    const post = () => {
      const el = rootRef.current;
      if (!el) return;
      window.parent?.postMessage(
        { source: 'gamru-widget', fid, height: el.scrollHeight, width: el.scrollWidth },
        '*'
      );
    };
    post();
    const ro = new ResizeObserver(post);
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, [fid, status, detail, player, vars]);

  /* ---------- actions ------------------------------------------------ */

  const openDetail = (item: Item) => {
    setAction({ busy: false, msg: '', ok: false });
    setQty(1);
    setDetail(item);
  };
  const closeDetail = () => {
    setAction({ busy: false, msg: '', ok: false });
    setDetail(null);
  };
  const runAction = async (fn: () => Promise<{ success: boolean; message: string }>) => {
    setAction({ busy: true, msg: '', ok: false });
    try {
      const res = await fn();
      if (!res.success) throw new Error(res.message || 'Action failed');
      setAction({ busy: false, msg: res.message || 'Done', ok: true });
      await loadPlayer();
    } catch (e) {
      setAction({ busy: false, msg: extractMsg(e), ok: false });
    }
  };

  /* ---------- interactive play (mission / tournament / bundle) -------- */

  // Where the real games live (games-platform frontend). The embedding SDK
  // passes it as ?gamesBase=; falls back to env / localhost.
  const gamesBase = (
    sp.get('gamesBase') ||
    (import.meta.env.VITE_GAMES_PLATFORM_BASE as string | undefined) ||
    'https://game-frontend-platform.netlify.app'
  ).replace(/\/$/, '');

  const isPlayable =
    widgetType === 'mission' || widgetType === 'tournament' || widgetType === 'mission-bundle';

  // Per-player interactive state (status / progress / games[]) from GAMRU's
  // integration progression API — the SAME data the games-platform Mission tab
  // uses, so in-iframe play behaves identically (only the API source differs).
  const [liveMissions, setLiveMissions] = useState<WidgetMission[]>([]);
  const [liveTournaments, setLiveTournaments] = useState<WidgetTournament[]>([]);
  const [liveBundles, setLiveBundles] = useState<WidgetBundle[]>([]);
  const [playGame, setPlayGame] = useState<{
    key: string;
    missionId?: string | null;
    bundleId?: string | null;
    tournamentId?: string | null;
  } | null>(null);
  const [tprog, setTprog] = useState<Awaited<
    ReturnType<typeof widgetApi.tournamentProgress>
  > | null>(null);

  const loadLive = useCallback(async () => {
    if (!email || !authKey || !isPlayable) return;
    try {
      if (widgetType === 'mission') setLiveMissions(await widgetApi.listMissions(email, authKey));
      else if (widgetType === 'tournament')
        setLiveTournaments(await widgetApi.listTournaments(email, authKey));
      else if (widgetType === 'mission-bundle')
        setLiveBundles(await widgetApi.listMissionBundles(email, authKey));
    } catch {
      /* GAMRU unreachable — keep what we had */
    }
  }, [email, authKey, widgetType, isPlayable]);

  useEffect(() => {
    void loadLive();
  }, [loadLive]);

  // Per-player tournament standing (registered / score / prize / claimed),
  // (re)fetched whenever a tournament detail is open or an action completes.
  useEffect(() => {
    if (widgetType !== 'tournament' || !detail || !email || !authKey) {
      setTprog(null);
      return;
    }
    let active = true;
    widgetApi
      .tournamentProgress(str(detail.id), email, authKey)
      .then((p) => active && setTprog(p))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [widgetType, detail, email, authKey, action.busy]);

  // Relay each play from the nested game iframe to GAMRU (advance + tournament
  // score), mirror XP, then refresh. Accept by `source` only — the game origin
  // (games platform) is operator-configurable.
  useEffect(() => {
    if (!email || !authKey) return;
    const onMsg = (e: MessageEvent) => {
      const d = e.data as Record<string, unknown> | null;
      if (!d || d.source !== 'gamru-game' || d.kind !== 'play') return;
      void (async () => {
        try {
          await widgetApi.activity(
            {
              email,
              kind: 'play',
              stake: num(d.stake),
              win: Boolean(d.win),
              winAmount: num(d.winAmount),
              gameKey: (d.gameKey as string) ?? null,
              missionId: (d.mission as string) ?? null,
              bundleId: (d.bundle as string) ?? null,
              tournamentId: (d.tournament as string) ?? null,
              points: num(d.points),
            },
            authKey
          );
          if (num(d.amount) > 0) {
            try {
              await widgetApi.addXp(
                email,
                num(d.amount),
                { name: (d.gameKey as string) ?? null, turnover: num(d.stake) },
                authKey
              );
            } catch {
              /* xp mirror is best-effort */
            }
          }
        } finally {
          await loadLive();
          await loadPlayer();
        }
      })();
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [email, authKey, loadLive, loadPlayer]);

  /** Run a clientAuth progression action, then refresh interactive state. */
  const runLive = async (fn: () => Promise<unknown>) => {
    setAction({ busy: true, msg: '', ok: false });
    try {
      await fn();
      setAction({ busy: false, msg: 'Done', ok: true });
    } catch (e) {
      setAction({ busy: false, msg: extractMsg(e), ok: false });
    }
    await loadLive();
    await loadPlayer();
  };

  /** Clickable "Mission Games" grid; tiles play in-iframe when `onPlay` set. */
  const gamesGrid = (games: string[], onPlay: ((key: string) => void) | null): ReactNode =>
    games.length ? (
      <div>
        <p className="mb-2 flex items-center gap-1.5 font-semibold">
          <span aria-hidden>🎮</span> {onPlay ? 'Play a game' : 'Games'}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {games.map((g, i) => {
            const key = str(g);
            const cls =
              'flex aspect-square flex-col items-center justify-center gap-1 rounded-xl p-2 text-center';
            const inner = (
              <>
                <span aria-hidden style={{ fontSize: 'calc(var(--gw-font) + 8px)' }}>
                  🎮
                </span>
                <span className="line-clamp-2 text-[10px] font-semibold leading-tight">
                  {GAME_LABELS[key] ?? titleCase(key)}
                </span>
              </>
            );
            return onPlay ? (
              <button
                key={`${key}-${i}`}
                type="button"
                onClick={() => onPlay(key)}
                className={`${cls} transition-transform hover:-translate-y-0.5`}
                style={{ ...ACCENT_SOFT, color: 'var(--gw-text)' }}
              >
                {inner}
              </button>
            ) : (
              <div
                key={`${key}-${i}`}
                className={cls}
                style={{ ...ACCENT_SOFT, color: 'var(--gw-text)', opacity: 0.55 }}
              >
                {inner}
              </div>
            );
          })}
        </div>
        {!onPlay ? (
          <p className="mt-1 text-[11px]" style={MUTED}>
            Join to play.
          </p>
        ) : null}
      </div>
    ) : null;

  /** Join / progress / play / claim controls for one mission (standalone or bundle track). */
  const missionControls = (
    m: WidgetMission | undefined,
    ctx: { missionId: string; bundleId?: string | null }
  ): ReactNode => {
    const statusU = str(m?.status, 'AVAILABLE').toUpperCase();
    const progress = num(m?.progress);
    const target = num(m?.target);
    const games = (m?.games as string[] | undefined) ?? [];
    const { missionId, bundleId } = ctx;
    const join = () =>
      runLive(() =>
        bundleId
          ? widgetApi.joinBundleMission(bundleId, missionId, email, authKey)
          : widgetApi.joinMission(missionId, email, authKey)
      );
    const cancel = () =>
      runLive(() =>
        bundleId
          ? widgetApi.cancelBundleMission(bundleId, missionId, email, authKey)
          : widgetApi.cancelMission(missionId, email, authKey)
      );
    const claim = () =>
      runLive(() =>
        bundleId
          ? widgetApi.claimBundleMission(bundleId, missionId, email, authKey)
          : widgetApi.claimMission(missionId, email, authKey)
      );
    const joined = statusU === 'IN_PROGRESS' || statusU === 'COMPLETED';
    const canPlay = joined && !!email;
    return (
      <div style={colGap}>
        {joined && target > 0 ? (
          <div>
            <div className="mb-1 flex justify-between text-[11px]" style={MUTED}>
              <span>Progress</span>
              <span>
                {progress} / {target}
              </span>
            </div>
            <ProgressBar value={progress} max={target} />
          </div>
        ) : null}

        {gamesGrid(
          games,
          canPlay ? (key) => setPlayGame({ key, missionId, bundleId: bundleId ?? null }) : null
        )}

        <div className="flex flex-wrap items-center gap-2">
          {statusU === 'AVAILABLE' || statusU === 'COMPLETED' || statusU === 'CLAIMED'
            ? null
            : null}
          {!m || statusU === 'AVAILABLE' ? (
            <ActBtn onClick={join} disabled={action.busy} primary>
              Join mission
            </ActBtn>
          ) : null}
          {statusU === 'IN_PROGRESS' ? (
            <ActBtn onClick={cancel} disabled={action.busy}>
              Cancel
            </ActBtn>
          ) : null}
          {statusU === 'COMPLETED' ? (
            <ActBtn onClick={claim} disabled={action.busy} primary>
              Claim reward
            </ActBtn>
          ) : null}
          {statusU === 'CLAIMED' ? <Badge>Claimed ✓</Badge> : null}
        </div>
        {action.msg ? (
          <p className="text-xs" style={{ color: action.ok ? 'var(--gw-accent)' : '#f87171' }}>
            {action.msg}
          </p>
        ) : null}
      </div>
    );
  };

  /* ---------- derived player values ---------------------------------- */

  const progress = (gam(player).progress as Item) ?? {};
  const nextRank = (gam(player).next_rank as Item) ?? {};
  const tokensVal = num(player?.tokens);
  const level = num(progress.level || player?.level);
  const rankName = str(progress.rank_name ?? player?.rank_name, 'Member');
  const xp = num(progress.xp_points);
  const toNext = num(progress.xp_to_next);

  const actionBtn: CSSProperties = {
    ...ACCENT_GRAD,
    color: '#fff',
    boxShadow: '0 8px 18px color-mix(in srgb, var(--gw-accent) 35%, transparent)',
  };

  /* ---------- compact / inline widgets ------------------------------- */

  const LevelBadge: FC<{ d: number }> = ({ d }) => (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold text-white ring-2 ring-white"
      style={{
        width: d,
        height: d,
        fontSize: d * 0.45,
        ...ACCENT_GRAD,
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      }}
    >
      {level}
    </span>
  );

  const renderCompact = (): ReactNode => {
    switch (widgetType) {
      case 'tokens': {
        const icon = <span aria-hidden>🪙</span>;
        return (
          <span
            className="inline-flex items-center gap-1.5 font-semibold"
            style={{ fontSize: 'var(--gw-font)' }}
          >
            {!reverse && icon}
            <span>{tokensVal.toLocaleString()}</span>
            {reverse && icon}
          </span>
        );
      }
      case 'gamification-data': {
        const map: Record<string, { icon: string; value: ReactNode }> = {
          rank: { icon: '⭐', value: rankName },
          level: { icon: '🔼', value: level },
          token: { icon: '🪙', value: tokensVal.toLocaleString() },
          xp: { icon: '✨', value: xp.toLocaleString() },
        };
        const m = map[gType] ?? map.rank;
        if (gType === 'xp') {
          return (
            <div className="w-56">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span>{m.icon} XP</span>
                <span>{xp.toLocaleString()}</span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full"
                style={{ background: 'var(--gw-border)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${xp + toNext > 0 ? Math.min(100, (xp / (xp + toNext)) * 100) : 0}%`,
                    ...ACCENT_BG,
                  }}
                />
              </div>
            </div>
          );
        }
        return (
          <span
            className="inline-flex items-center gap-1.5 font-semibold"
            style={{ fontSize: 'var(--gw-font)' }}
          >
            <span aria-hidden>{m.icon}</span>
            <span>{m.value}</span>
          </span>
        );
      }
      case 'badge-level': {
        const d = !appearance?.size && sp.get('size') === 'small' ? 26 : BADGE_SIZE[tokens.size];
        return <LevelBadge d={d} />;
      }
      case 'avatar': {
        const frac =
          progressType === 'level'
            ? xp + toNext > 0
              ? xp / (xp + toNext)
              : 0
            : num(nextRank.xp_required) > 0
              ? (num(nextRank.xp_required) - num(nextRank.xp_remaining)) / num(nextRank.xp_required)
              : xp + toNext > 0
                ? xp / (xp + toNext)
                : 0;
        const ring = Math.max(0, Math.min(1, frac)) * 360;
        const initials = `${str(player?.first_name, ' ')[0] ?? ''}${
          str(player?.last_name, ' ')[0] ?? ''
        }`
          .trim()
          .toUpperCase();
        const avatarUrl = str(player?.avatar_url, '');
        const avSize = appearance?.size ? AVATAR_SIZE[tokens.size] : size;
        const badge = Math.round(avSize * 0.28);
        return (
          <div className="relative" style={{ width: avSize, height: avSize + badge / 2 }}>
            <div
              className="rounded-full"
              style={{
                width: avSize,
                height: avSize,
                background: `conic-gradient(${accent} ${ring}deg, var(--gw-border) ${ring}deg)`,
                boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
              }}
            >
              <div
                className="absolute flex items-center justify-center overflow-hidden rounded-full"
                style={{
                  inset: Math.max(4, avSize * 0.05),
                  background: 'var(--gw-surface)',
                  color: 'var(--gw-text)',
                }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <span style={{ fontSize: avSize * 0.32, fontWeight: 700 }}>
                    {initials || '🙂'}
                  </span>
                )}
              </div>
            </div>
            {showLevel && (
              <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: 0 }}>
                <LevelBadge d={badge} />
              </div>
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };

  const renderPoints = (): ReactNode => (
    <div style={CARD}>
      <div className="grid grid-cols-3 gap-3">
        {[
          ['Level', String(level), '🔼'],
          ['Rank', rankName, '⭐'],
          ['Tokens', tokensVal.toLocaleString(), '🪙'],
        ].map(([l, v, ic]) => (
          <div
            key={l}
            className="text-center"
            style={{
              background: 'var(--gw-bg)',
              border: '1px solid var(--gw-border)',
              borderRadius: 'var(--gw-radius)',
              padding: 'calc(var(--gw-space) * 0.6)',
            }}
          >
            <div style={{ fontSize: 'calc(var(--gw-font) + 6px)' }}>{ic}</div>
            <p className="mt-0.5 text-[11px] uppercase tracking-wide" style={MUTED}>
              {l}
            </p>
            <p className="mt-0.5 font-bold" style={{ fontSize: 'calc(var(--gw-font) + 2px)' }}>
              {v}
            </p>
          </div>
        ))}
      </div>
      <div
        className="mt-3"
        style={{
          background: 'var(--gw-bg)',
          border: '1px solid var(--gw-border)',
          borderRadius: 'var(--gw-radius)',
          padding: 'calc(var(--gw-space) * 0.6)',
        }}
      >
        <div className="mb-2 flex items-center justify-center gap-1.5 font-semibold">
          <span>✨</span>
          <span>XP Points</span>
        </div>
        <ProgressBar value={xp} max={xp + toNext} showValue />
        <div className="mt-1.5 flex items-center justify-between text-[11px]" style={MUTED}>
          <span>
            <b style={{ color: 'var(--gw-text)' }}>{toNext.toLocaleString()}</b> for the next rank!!
          </span>
          <span className="font-semibold" style={{ color: 'var(--gw-text)' }}>
            {rankName}
          </span>
        </div>
      </div>
    </div>
  );

  /* ---------- page widgets ------------------------------------------- */

  const renderList = (): ReactNode => {
    if (!isPage) return null;
    switch (widgetType) {
      case 'mission': {
        const items = asArray(gam(player).missions);
        if (!items.length) return <Empty label="No missions available." />;
        return (
          <div style={colGap}>
            {items.map((it, i) => {
              const d = (it.data as Item) ?? {};
              const reward = d.reward_label ?? d.reward_amount;
              const duration = num(d.duration_days);
              return (
                <Card
                  key={str(it.id, String(i))}
                  onClick={() => openDetail(it)}
                  style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}
                >
                  <Thumb
                    src={str(d.large_image, '') || undefined}
                    size={68}
                    icon={TYPE_ICON.mission}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      {duration > 0 ? (
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                          style={{ background: 'var(--gw-bg)', ...MUTED }}
                        >
                          {duration} Days
                        </span>
                      ) : null}
                      {d.vip ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{ ...ACCENT_SOFT, color: 'var(--gw-accent)' }}
                        >
                          👑 VIP
                        </span>
                      ) : null}
                      {it.status ? (
                        <span className="ml-auto">
                          <Badge>{titleCase(str(it.status))}</Badge>
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate font-semibold" style={{ fontSize: 'var(--gw-font)' }}>
                      {str(it.name ?? d.name, 'Mission')}
                    </p>
                    {reward !== undefined && reward !== null && reward !== '' ? (
                      <div
                        className="mt-2 flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                        style={{ background: 'var(--gw-bg)' }}
                      >
                        <span aria-hidden>🎁</span>
                        <span className="text-[11px]" style={MUTED}>
                          Reward:
                        </span>
                        <span className="truncate text-xs font-semibold">{str(reward)}</span>
                        <span
                          className="ml-auto flex h-6 w-6 items-center justify-center rounded-full text-sm transition-transform group-hover:translate-x-0.5"
                          style={{ ...ACCENT_SOFT, color: 'var(--gw-accent)' }}
                        >
                          ›
                        </span>
                      </div>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        );
      }
      case 'mission-bundle': {
        // Bundles come from the integration list (per-player grouped progress).
        if (!liveBundles.length) return <Empty label="No mission bundles available." />;
        return (
          <div style={colGap}>
            {liveBundles.map((b, i) => (
              <ListRow
                key={str(b.id, String(i))}
                icon={TYPE_ICON['mission-bundle']}
                title={str(b.name, 'Bundle')}
                subtitle={`${num(b.completed)} / ${num(b.total) || asArray(b.missions).length} completed`}
                status={null}
                onClick={() => openDetail(b as Item)}
              />
            ))}
          </div>
        );
      }
      case 'tournament': {
        const items = asArray(gam(player).tournaments);
        if (!items.length) return <Empty label="No tournaments available." />;
        return (
          <div style={colGap}>
            {items.map((it, i) => {
              const d = (it.data as Item) ?? {};
              return (
                <ListRow
                  key={str(it.id, String(i))}
                  icon={TYPE_ICON.tournament}
                  title={str(it.name ?? d.name, 'Tournament')}
                  subtitle={str(d.category ?? d.prize_label, '')}
                  status={it.status ? str(it.status) : null}
                  onClick={() => openDetail(it)}
                />
              );
            })}
          </div>
        );
      }
      case 'reward-shop': {
        const items = asArray(gam(player).reward_shop);
        // Purchases (gamru reward rows) power the Boosters + History tabs; a
        // booster is a purchase whose product is in the Booster category.
        const purchases = asArray(gam(player).rewards).filter(isShopPurchase).map(parsePurchase);
        const boosterNames = new Set(
          items
            .filter((it) => /booster/i.test(str((it.data as Item)?.category)))
            .map((it) =>
              str(it.name ?? (it.data as Item)?.name)
                .trim()
                .toLowerCase()
            )
        );
        const boosters = purchases.filter((p) => boosterNames.has(p.name.toLowerCase()));

        const SHOP_TABS = [
          ['shop', '🛍️', 'Reward Shop'],
          ['boosters', '⚡', 'My Boosters'],
          ['history', '🕘', 'Shop History'],
        ] as const;
        const tabBar = (
          <div className="flex gap-1" style={{ borderBottom: '1px solid var(--gw-border)' }}>
            {SHOP_TABS.map(([key, icon, label]) => {
              const active = shopTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setShopTab(key)}
                  className="-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition"
                  style={{
                    borderColor: active ? 'var(--gw-accent)' : 'transparent',
                    color: active ? 'var(--gw-accent)' : 'var(--gw-muted)',
                  }}
                >
                  <span aria-hidden>{icon}</span>
                  {label}
                  {key === 'boosters' && boosters.length ? (
                    <span
                      className="rounded-full px-1.5 text-[10px] font-bold text-white"
                      style={ACCENT_GRAD}
                    >
                      {boosters.length}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        );

        const purchaseRow = (p: ShopPurchase, icon: string, i: number): ReactNode => (
          <Card key={`${p.id}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconChip icon={icon} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold" style={{ fontSize: 'var(--gw-font)' }}>
                {p.name}
                {p.qty > 1 ? ` ×${p.qty}` : ''}
              </p>
              <p className="mt-0.5 text-xs" style={MUTED}>
                {p.date ? fmtDate(p.date) : 'Purchased'}
              </p>
            </div>
            <span
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold"
              style={{ color: 'var(--gw-accent)' }}
            >
              🪙 {p.tokens.toLocaleString()}
            </span>
          </Card>
        );

        let body: ReactNode;
        if (shopTab === 'boosters') {
          body = boosters.length ? (
            <div style={colGap}>{boosters.map((b, i) => purchaseRow(b, '⚡', i))}</div>
          ) : (
            <Empty label="No boosters yet. Buy one from the shop to multiply your rewards." />
          );
        } else if (shopTab === 'history') {
          body = purchases.length ? (
            <div style={colGap}>{purchases.map((p, i) => purchaseRow(p, '🧾', i))}</div>
          ) : (
            <Empty label="No purchases yet." />
          );
        } else if (!items.length) {
          body = <Empty label="Reward shop is empty." />;
        } else {
          // Group by the admin-chosen category (Product / Booster / Voucher…),
          // preserving first-seen order so the catalog priority is honoured.
          const groups: [string, Item[]][] = [];
          const groupIdx = new Map<string, number>();
          items.forEach((it) => {
            const label = str((it.data as Item)?.category, 'Product');
            if (!groupIdx.has(label)) {
              groupIdx.set(label, groups.length);
              groups.push([label, []]);
            }
            groups[groupIdx.get(label)!][1].push(it);
          });
          body = (
            <div style={colGap}>
              {groups.map(([label, group]) => (
                <div key={label}>
                  <p
                    className="mb-2 text-[11px] font-semibold uppercase tracking-wide"
                    style={MUTED}
                  >
                    {label}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {group.map((it, i) => {
                      const d = (it.data as Item) ?? {};
                      const tier = rsTier(d);
                      const stock = rsStock(d);
                      const out = stock !== null && stock <= 0;
                      return (
                        <Card
                          key={str(it.id, String(i))}
                          onClick={() => openDetail(it)}
                          style={{
                            padding: 0,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch',
                          }}
                        >
                          <div className="relative">
                            <Thumb
                              src={rsImage(d)}
                              icon={TYPE_ICON['reward-shop']}
                              banner
                              fit="contain"
                              height={118}
                            />
                            {tier ? (
                              <span
                                className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
                                style={ACCENT_GRAD}
                              >
                                🔒 {tier}
                              </span>
                            ) : null}
                            {out ? (
                              <span className="absolute right-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                Out of stock
                              </span>
                            ) : null}
                          </div>
                          <div className="flex flex-1 flex-col gap-1 p-2.5">
                            <p
                              className="truncate font-semibold"
                              style={{ fontSize: 'var(--gw-font)' }}
                            >
                              {str(it.name ?? d.name, 'Product')}
                            </p>
                            {d.description ? (
                              <p className="line-clamp-2 text-xs" style={MUTED}>
                                {str(d.description)}
                              </p>
                            ) : null}
                            <div
                              className="mt-1 flex items-center gap-1.5 font-semibold"
                              style={{ color: 'var(--gw-accent)' }}
                            >
                              <span aria-hidden>🪙</span>
                              <span>{rsPrice(d).toLocaleString()}</span>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        }

        return (
          <div style={colGap}>
            {tabBar}
            {body}
          </div>
        );
      }
      case 'rewards': {
        const items = asArray(gam(player).rewards);
        if (!items.length) return <Empty label="No rewards earned yet." />;
        return (
          <div style={colGap}>
            {items.map((it, i) => (
              <ListRow
                key={str(it.id, String(i))}
                icon={TYPE_ICON.rewards}
                title={str(it.label ?? it.reward_label ?? it.reward_type, 'Reward')}
                subtitle={`${titleCase(str(it.reward_type, 'reward'))}${
                  it.amount ? ` • ${str(it.amount)}` : ''
                }`}
                status={str(it.status, 'granted')}
                onClick={() => openDetail(it)}
              />
            ))}
          </div>
        );
      }
      case 'campaign': {
        const items = asArray(gam(player).logs).slice(0, 12);
        if (!items.length) return <Empty label="No active campaigns or recent activity." />;
        return (
          <div style={colGap}>
            {items.map((it, i) => (
              <ListRow
                key={str(it.id, String(i))}
                icon={TYPE_ICON.campaign}
                title={titleCase(str(it.action, 'activity'))}
                subtitle={str(it.detail, '')}
                onClick={() => openDetail(it)}
              />
            ))}
          </div>
        );
      }
      case 'rankings': {
        const levels = asArray(gam(player).levels);
        const currentLevel = num(progress.level);
        if (!levels.length) return <Empty label="No ranking ladder configured." />;
        return (
          <div style={colGap}>
            {levels.map((lv, i) => {
              const isMe = num(lv.level) === currentLevel;
              return (
                <Card
                  key={str(lv.level, String(i))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    ...(isMe ? { borderColor: accent } : {}),
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold" style={MUTED}>
                      #{str(lv.level)}
                    </span>
                    <span className="font-medium">{str(lv.rank_name, 'Rank')}</span>
                  </div>
                  {isMe ? <Badge>You</Badge> : null}
                </Card>
              );
            })}
          </div>
        );
      }
      case 'profile': {
        if (!player) return <Empty label="No profile data." />;
        const fields: [string, unknown][] = [
          ['Name', `${str(player.first_name, '')} ${str(player.last_name, '')}`.trim() || '—'],
          ['Username', player.username],
          ['Email', player.email],
          ['Mobile', player.mobile],
          ['Level', level],
          ['Rank', rankName],
        ];
        return (
          <div className="grid grid-cols-2 gap-3">
            {fields.map(([label, value]) => (
              <Stat key={label} label={label} value={str(value)} />
            ))}
          </div>
        );
      }
      case 'status': {
        if (!player) return <Empty label="No status data." />;
        return (
          <div style={colGap}>
            <Card
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div>
                <p className="text-sm" style={MUTED}>
                  Account status
                </p>
                <p className="font-semibold" style={{ fontSize: 'calc(var(--gw-font) + 4px)' }}>
                  {titleCase(str(player.status, 'active'))}
                </p>
              </div>
              <Badge>{rankName}</Badge>
            </Card>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Level" value={level} icon="🔼" />
              <Stat label="Rewards" value={asArray(gam(player).rewards).length} icon="🎁" />
              <Stat label="Missions" value={asArray(gam(player).missions).length} icon="🎯" />
            </div>
          </div>
        );
      }
      case 'progress': {
        return (
          <div style={colGap}>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Level" value={level} icon="🔼" />
              <Stat label="Rank" value={rankName} icon="⭐" />
              <Stat label="XP" value={xp.toLocaleString()} icon="✨" />
              <Stat label="XP to next" value={toNext.toLocaleString()} icon="🎯" />
            </div>
            <Card>
              <div className="mb-2 flex items-center justify-between text-xs" style={MUTED}>
                <span>{rankName}</span>
                <span>{str(nextRank.rank_name, 'Next rank')}</span>
              </div>
              <ProgressBar value={xp} max={xp + toNext} />
              {nextRank.xp_remaining !== undefined && (
                <p className="mt-2 text-xs" style={MUTED}>
                  {num(nextRank.xp_remaining).toLocaleString()} XP to{' '}
                  {str(nextRank.rank_name, 'next rank')}
                </p>
              )}
            </Card>
          </div>
        );
      }
      default:
        return null;
    }
  };

  /** Rich, image-led mission detail mirroring the games-platform mission UI. */
  const renderMissionDetail = (item: Item): ReactNode => {
    const d = (item.data as Item) ?? {};
    const name = str(item.name ?? d.name, 'Mission');
    const img = str(d.large_image, '');
    const rewardLabel = str(d.reward_label, '');
    const condition = str(d.condition_label, '');
    const description = str(item.description ?? d.description, '');

    const missionRows: [string, ReactNode][] = [
      ['Status', item.status ? <Badge>{titleCase(str(item.status))}</Badge> : '—'],
      ['Reward', str(d.reward_amount)],
      ['Reward type', titleCase(str(d.reward_type, 'bonus'))],
      ['Mission type', str(d.category)],
      ['Target', condition || titleCase(str(d.objective_type, '—'))],
    ];
    if (d.min_bet !== undefined && d.min_bet !== null && d.min_bet !== '')
      missionRows.push(['Min bet', `$${str(d.min_bet)}`]);
    if (d.min_multiplier !== undefined && d.min_multiplier !== null && d.min_multiplier !== '')
      missionRows.push(['Min multiplier', `x${str(d.min_multiplier)}`]);
    missionRows.push(['Bet currency', str(d.bet_currency, 'All Currencies')]);
    missionRows.push(['Bonus wagering', str(d.bonus_wagering, 'Excluded')]);

    const rewardRows: [string, ReactNode][] = [
      ['Reward', rewardLabel || str(d.reward_amount, '—')],
      ['Deposit', d.deposit_required ? 'Required' : 'Not required'],
      ['Wagering', d.wagering_required ? 'Required' : 'Not required'],
    ];
    if (d.max_bonus !== undefined && d.max_bonus !== null && d.max_bonus !== '')
      rewardRows.push(['Max bonus', `$${str(d.max_bonus)}`]);

    return (
      <div style={colGap}>
        <button type="button" onClick={closeDetail} className="text-left text-sm" style={MUTED}>
          ← Back
        </button>

        <Thumb src={img || undefined} icon={TYPE_ICON.mission} banner />

        <div>
          <p className="font-bold leading-tight" style={{ fontSize: 'calc(var(--gw-font) + 4px)' }}>
            {name}
          </p>
          {description ? (
            <p className="mt-1 text-sm" style={MUTED}>
              {description}
            </p>
          ) : null}
        </div>

        <Card style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <IconChip icon="🎁" />
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide" style={MUTED}>
              Reward
            </p>
            <p className="font-bold" style={{ fontSize: 'calc(var(--gw-font) + 2px)' }}>
              {rewardLabel || str(d.reward_amount, '—')}
            </p>
            {condition ? (
              <p className="mt-0.5 text-xs" style={MUTED}>
                Target: {condition}
              </p>
            ) : null}
          </div>
        </Card>

        <p className="flex items-center gap-1.5 font-semibold">
          <span aria-hidden>🎯</span> Mission
        </p>
        <DetailRows rows={missionRows} />

        <p className="flex items-center gap-1.5 font-semibold">
          <span aria-hidden>🎁</span> Reward details
        </p>
        <DetailRows rows={rewardRows} />

        {/* Interactive: join / progress / play games in-iframe / claim. */}
        {missionControls(
          liveMissions.find((x) => str(x.id) === str(item.id)) ?? {
            id: str(item.id),
            status: str(item.status, 'AVAILABLE'),
            games: asArray(d.games).map(String),
          },
          { missionId: str(item.id) }
        )}

        {d.more_details ? (
          <div>
            <p className="mb-1 font-semibold">More details</p>
            <p className="text-sm leading-relaxed" style={MUTED}>
              {str(d.more_details)}
            </p>
          </div>
        ) : null}
      </div>
    );
  };

  /** Interactive tournament detail — join, play games in-iframe, claim prize. */
  const renderTournamentDetail = (item: Item): ReactNode => {
    const d = (item.data as Item) ?? {};
    const name = str(item.name ?? d.name, 'Tournament');
    const img = str(d.large_image, '');
    const id = str(item.id);
    const lt = liveTournaments.find((x) => str(x.id) === id);
    const games = (lt?.games as string[] | undefined) ?? asArray(d.games).map(String);
    const registered = !!tprog?.registered;
    const claimed = !!tprog?.claimed;
    const prize = num(tprog?.prize_amount);
    const rows: [string, ReactNode][] = [
      [
        'Status',
        lt?.status ? (
          <Badge>{titleCase(str(lt.status))}</Badge>
        ) : tprog?.status ? (
          <Badge>{titleCase(str(tprog.status))}</Badge>
        ) : (
          '—'
        ),
      ],
      ['Industry', str(d.industry)],
      ['Prize pool', str(d.prize_pool, '—')],
      ['Your score', str(tprog?.score, '0')],
      ['Your rank', tprog?.rank ? `#${tprog.rank}` : '—'],
    ];
    return (
      <div style={colGap}>
        <button type="button" onClick={closeDetail} className="text-left text-sm" style={MUTED}>
          ← Back
        </button>
        <Thumb src={img || undefined} icon={TYPE_ICON.tournament} banner />
        <div>
          <p className="font-bold leading-tight" style={{ fontSize: 'calc(var(--gw-font) + 4px)' }}>
            {name}
          </p>
        </div>
        <DetailRows rows={rows} />
        {gamesGrid(
          games,
          registered && !!email ? (key) => setPlayGame({ key, tournamentId: id }) : null
        )}
        <div className="flex flex-wrap items-center gap-2">
          {!registered ? (
            <ActBtn
              onClick={() => runLive(() => widgetApi.joinTournament(id, email, authKey))}
              disabled={action.busy}
              primary
            >
              Join tournament
            </ActBtn>
          ) : null}
          {registered && prize > 0 && !claimed ? (
            <ActBtn
              onClick={() => runLive(() => widgetApi.claimTournament(id, email, authKey))}
              disabled={action.busy}
              primary
            >
              Claim prize
            </ActBtn>
          ) : null}
          {claimed ? <Badge>Prize claimed ✓</Badge> : null}
        </div>
        {action.msg ? (
          <p className="text-xs" style={{ color: action.ok ? 'var(--gw-accent)' : '#f87171' }}>
            {action.msg}
          </p>
        ) : null}
      </div>
    );
  };

  /** Interactive bundle detail — each member mission joins/plays/claims on the bundle track. */
  const renderBundleDetail = (item: Item): ReactNode => {
    const d = (item.data as Item) ?? {};
    const name = str(item.name ?? d.name, 'Bundle');
    const bundleId = str(item.id);
    const lb = liveBundles.find((x) => str(x.id) === bundleId);
    const missions = (lb?.missions as WidgetMission[] | undefined) ?? [];
    return (
      <div style={colGap}>
        <button type="button" onClick={closeDetail} className="text-left text-sm" style={MUTED}>
          ← Back
        </button>
        <Thumb
          src={str(d.large_image, '') || undefined}
          icon={TYPE_ICON['mission-bundle']}
          banner
        />
        <div>
          <p className="font-bold leading-tight" style={{ fontSize: 'calc(var(--gw-font) + 4px)' }}>
            {name}
          </p>
          <p className="mt-0.5 text-xs" style={MUTED}>
            {num(lb?.completed)} / {num(lb?.total) || missions.length} completed
          </p>
        </div>
        {missions.length ? (
          missions.map((m) => (
            <Card key={str(m.id)} style={{ display: 'block' }}>
              <p className="mb-2 flex items-center gap-2 font-semibold">
                {str(m.name, 'Mission')}
                {m.status ? <Badge>{titleCase(str(m.status))}</Badge> : null}
              </p>
              {missionControls(m, { missionId: str(m.id), bundleId })}
            </Card>
          ))
        ) : (
          <Empty label="No missions in this bundle." />
        )}
      </div>
    );
  };

  /** In-iframe game player — plays the real games-platform game, relayed to GAMRU. */
  const renderPlay = (): ReactNode => {
    if (!playGame) return null;
    const qp = new URLSearchParams({ embed: 'widget' });
    if (playGame.missionId) qp.set('mission', playGame.missionId);
    if (playGame.bundleId) qp.set('bundle', playGame.bundleId);
    if (playGame.tournamentId) qp.set('tournament', playGame.tournamentId);
    const src = `${gamesBase}/games/${encodeURIComponent(playGame.key)}?${qp.toString()}`;
    return (
      <div style={colGap}>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setPlayGame(null);
              void loadLive();
            }}
            className="text-left text-sm"
            style={MUTED}
          >
            ← Back
          </button>
          <span className="text-sm font-semibold">
            {GAME_LABELS[playGame.key] ?? titleCase(playGame.key)}
          </span>
        </div>
        <iframe
          title="mission-game"
          src={src}
          className="w-full rounded-xl border-0"
          style={{ height: 560, background: 'var(--gw-surface)' }}
          allow="autoplay; fullscreen"
        />
        <p className="text-[11px]" style={MUTED}>
          Play to advance your progress — it updates automatically. Return when done.
        </p>
      </div>
    );
  };

  /** Image-led reward-shop product detail with quantity + in-iframe buy. */
  const renderRewardShopDetail = (item: Item): ReactNode => {
    const d = (item.data as Item) ?? {};
    const name = str(item.name ?? d.name, 'Product');
    const description = str(d.description ?? item.description, '');
    const category = str(d.category, 'Product');
    const tier = rsTier(d);
    const price = rsPrice(d);
    const stock = rsStock(d);
    const outOfStock = stock !== null && stock <= 0;
    const cost = price * qty;
    const canAfford = tokensVal >= cost && price > 0;
    const showBuy = !!playerId;

    return (
      <div style={colGap}>
        <button type="button" onClick={closeDetail} className="text-left text-sm" style={MUTED}>
          ← Reward Shop
        </button>

        <Thumb src={rsImage(d)} icon={TYPE_ICON['reward-shop']} banner fit="contain" height={200} />

        <div>
          <p className="font-bold leading-tight" style={{ fontSize: 'calc(var(--gw-font) + 4px)' }}>
            {name}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span
              className="text-sm font-semibold"
              style={{ color: outOfStock ? '#f87171' : '#34d399' }}
            >
              {outOfStock ? 'Out of Stock' : 'In Stock'}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ background: 'var(--gw-bg)', ...MUTED }}
            >
              {category}
            </span>
            {tier ? (
              <span
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white"
                style={ACCENT_GRAD}
              >
                🔒 {tier}
              </span>
            ) : null}
          </div>
        </div>

        {description ? (
          <p className="text-sm leading-relaxed" style={MUTED}>
            {description}
          </p>
        ) : null}

        <Card style={{ background: 'var(--gw-bg)' }}>
          <div
            className="flex items-center gap-2"
            style={{ fontSize: 'calc(var(--gw-font) + 4px)' }}
          >
            <span aria-hidden>🪙</span>
            <span className="font-bold" style={{ color: 'var(--gw-accent)' }}>
              {cost.toLocaleString()}
            </span>
          </div>
          <p className="mt-0.5 text-xs" style={MUTED}>
            Remaining Tokens: {tokensVal.toLocaleString()}
          </p>
        </Card>

        <div className="flex items-center gap-3">
          <span className="text-sm" style={MUTED}>
            Quantity
          </span>
          <div
            className="inline-flex items-center overflow-hidden rounded-lg"
            style={{ border: '1px solid var(--gw-border)' }}
          >
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="px-3 py-1.5 text-sm font-semibold"
              style={{ color: 'var(--gw-text)' }}
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-semibold">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              className="px-3 py-1.5 text-sm font-semibold"
              style={{ color: 'var(--gw-text)' }}
            >
              +
            </button>
          </div>
        </div>

        {action.msg && (
          <div
            className="rounded-lg px-3 py-2 text-sm"
            style={{
              border: `1px solid ${action.ok ? '#10b981' : '#ef4444'}`,
              background: action.ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              color: action.ok ? '#34d399' : '#f87171',
            }}
          >
            {action.msg}
          </div>
        )}

        {showBuy && !action.ok && (
          <button
            type="button"
            disabled={action.busy || !canAfford || outOfStock}
            onClick={() =>
              runAction(() => widgetApi.purchaseRewardShop(playerId, str(item.id), authKey, qty))
            }
            style={actionBtn}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {action.busy ? 'Processing…' : 'Buy Now'} →
          </button>
        )}
        {showBuy && !action.ok && !canAfford && !outOfStock && (
          <p className="text-xs" style={{ color: '#f87171' }}>
            You need {(cost - tokensVal).toLocaleString()} more tokens.
          </p>
        )}
      </div>
    );
  };

  const renderDetail = (item: Item): ReactNode => {
    const d = (item.data as Item) ?? {};
    const title = str(
      item.name ?? item.label ?? item.reward_label ?? d.name ?? item.action,
      'Details'
    );
    const skip = new Set(['id', 'data', 'created_at', 'updated_at', 'client_id', 'player_id']);
    const entries: [string, string][] = [];
    const push = (obj: Item) => {
      Object.entries(obj).forEach(([k, v]) => {
        if (skip.has(k) || v === null || v === undefined || v === '') return;
        if (typeof v === 'object') return;
        if (entries.length < 10) entries.push([titleCase(k), String(v)]);
      });
    };
    push(item);
    push(d);

    // reward-shop has its own rich detail (renderRewardShopDetail); this
    // generic detail covers the remaining read-only / claimable types.
    const canClaim = widgetType === 'rewards' && playerId;

    return (
      <div style={colGap}>
        <button type="button" onClick={closeDetail} className="text-left text-sm" style={MUTED}>
          ← Back
        </button>
        <Card>
          <p className="font-semibold" style={{ fontSize: 'calc(var(--gw-font) + 2px)' }}>
            {title}
          </p>
          <div className="mt-3 space-y-1.5">
            {entries.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-sm">
                <span style={MUTED}>{k}</span>
                <span className="text-right">{v}</span>
              </div>
            ))}
          </div>
        </Card>

        {action.msg && (
          <div
            className="rounded-lg px-3 py-2 text-sm"
            style={{
              border: `1px solid ${action.ok ? '#10b981' : '#ef4444'}`,
              background: action.ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              color: action.ok ? '#34d399' : '#f87171',
            }}
          >
            {action.msg}
          </div>
        )}

        {canClaim && !action.ok && (
          <button
            type="button"
            disabled={action.busy}
            onClick={() => runAction(() => widgetApi.claimReward(playerId, str(item.id), authKey))}
            style={actionBtn}
            className="w-full rounded-lg py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {action.busy ? 'Claiming…' : 'Claim reward'}
          </button>
        )}
      </div>
    );
  };

  /* ---------- shell -------------------------------------------------- */

  if (isCompact) {
    return (
      <div
        ref={rootRef}
        className="inline-block p-1"
        style={{
          ...vars,
          color: textColor || 'var(--gw-text)',
          background: 'transparent',
          fontSize: 'var(--gw-font)',
          margin: tokens.margin || undefined,
        }}
      >
        {status === 'loading' && (
          <span className="text-sm" style={MUTED}>
            …
          </span>
        )}
        {status === 'error' && <span className="text-sm text-red-500">{error}</span>}
        {status === 'ready' && renderCompact()}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={embed ? '' : 'min-h-screen'}
      style={{
        ...vars,
        background: 'var(--gw-bg)',
        backgroundImage: tokens.bgImage ? `url("${tokens.bgImage}")` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'var(--gw-text)',
        fontSize: 'var(--gw-font)',
        padding: tokens.padding,
        margin: tokens.margin || undefined,
      }}
    >
      <div
        style={{
          maxWidth: tokens.fullWidth ? '100%' : tokens.width > 0 ? tokens.width : tokens.maxWidth,
          minHeight: tokens.minHeight || undefined,
          ...alignStyle(tokens.align),
        }}
      >
        {isPage && (
          <div className="mb-4 flex items-center gap-3">
            <span
              className="flex items-center justify-center rounded-xl text-white shadow-lg"
              style={{ ...ACCENT_GRAD, width: 42, height: 42, fontSize: 21 }}
            >
              {TYPE_ICON[widgetType as PageType]}
            </span>
            <div>
              <h1
                className="font-bold leading-tight"
                style={{ fontSize: 'calc(var(--gw-font) + 6px)' }}
              >
                {TITLES[widgetType as PageType]}
              </h1>
              <p className="text-xs" style={MUTED}>
                {SUBTITLES[widgetType as PageType]}
              </p>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div style={colGap}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl"
                style={{ background: 'var(--gw-surface)' }}
              />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div
            style={{
              ...CARD,
              textAlign: 'center',
              border: '1px solid #ef4444',
              background: 'rgba(239,68,68,0.1)',
            }}
          >
            <p className="font-semibold text-red-300">{error}</p>
            <p className="mt-1 text-xs" style={MUTED}>
              This widget could not be loaded. Check the client id, auth key and allowed domains.
            </p>
          </div>
        )}

        {status === 'ready' &&
          (widgetType === 'points'
            ? renderPoints()
            : playGame
              ? renderPlay()
              : detail
                ? widgetType === 'mission'
                  ? renderMissionDetail(detail)
                  : widgetType === 'mission-bundle'
                    ? renderBundleDetail(detail)
                    : widgetType === 'tournament'
                      ? renderTournamentDetail(detail)
                      : widgetType === 'reward-shop'
                        ? renderRewardShopDetail(detail)
                        : renderDetail(detail)
                : renderList())}
      </div>
    </div>
  );
};

export default WidgetView;
