import type { ReactNode } from 'react';
import { Users } from 'lucide-react';
import type { GamificationEntity } from '@/types/gamification.types';

/** One table column: a header label and how to render a row's cell. */
export interface ColumnDef {
  header: string;
  render: (row: GamificationEntity) => ReactNode;
}

// ─── Shared cell renderers ────────────────────────────────────────────────────
// Reusable building blocks for the per-module column definitions. Each module
// owns its own column list (in its folder) but composes it from these so the
// look & feel stays consistent across the gamification section.

export const StatusCell = (row: GamificationEntity): ReactNode => (
  <span
    className={`px-3 py-1 rounded-full text-xs font-medium ${
      row.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
    }`}
  >
    {row.status === 'ACTIVE' ? 'Active' : 'Inactive'}
  </span>
);

export const NameCell = (row: GamificationEntity): ReactNode => (
  <span className="font-medium text-blue-400 underline">{row.name}</span>
);

export const TagsCell = (row: GamificationEntity): ReactNode =>
  row.tags?.length ? (
    <div className="flex flex-wrap gap-1">
      {row.tags.map((t) => (
        <span key={t} className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-200 text-xs">
          {t}
        </span>
      ))}
    </div>
  ) : (
    <span className="text-slate-500">-</span>
  );

/** Render a value or a muted dash when it's empty. */
export const dash = (v: unknown): ReactNode =>
  v === undefined || v === null || v === '' ? <span className="text-slate-500">-</span> : String(v);

/** Render a value pulled from `row.data[key]` (joins arrays, dashes empties). */
export const dataCell =
  (key: string): ((row: GamificationEntity) => ReactNode) =>
  (row) => {
    const v = row.data?.[key];
    return Array.isArray(v) ? (v.length ? v.join(', ') : dash(null)) : dash(v);
  };

/** Pill chip used for short, highlighted values. */
export const pill = (text: ReactNode): ReactNode => (
  <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-200 text-xs">{text}</span>
);

export const STATUS_COL: ColumnDef = { header: 'Status', render: StatusCell };
export const NAME_COL: ColumnDef = { header: 'Name', render: NameCell };
export const TAGS_COL: ColumnDef = { header: 'Tags', render: TagsCell };

/**
 * A clickable "Participated" column showing the player count (off
 * `row.participant_count`). Clicking calls `onOpen(row)` to open the
 * participants modal — mirrors the tournament leaderboard / segment count UX.
 */
export const participatedCol = (onOpen: (row: GamificationEntity) => void): ColumnDef => ({
  header: 'Participated',
  render: (row) => {
    const count = row.participant_count ?? 0;
    return (
      <button
        type="button"
        onClick={() => onOpen(row)}
        title="View participated players"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 text-xs font-medium"
      >
        <Users size={13} />
        {count} {count === 1 ? 'player' : 'players'}
      </button>
    );
  },
});

/** A column that shows a small badge when `row.data[key]` is set. */
export const BadgeCol = (header: string, key: string): ColumnDef => ({
  header,
  render: (row) =>
    row.data?.[key] ? (
      <span className="px-3 py-1 rounded bg-blue-600/30 text-blue-300 text-xs">{header}</span>
    ) : (
      <span className="text-slate-500">-</span>
    ),
});
