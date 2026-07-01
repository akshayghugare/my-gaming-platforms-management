import { useEffect, useState, type FC } from 'react';
import apiService from '@/services/api';
import type { PaginatedData } from '@/types';
import type { GamificationEntity } from '@/types/gamification.types';
import type { GamificationTag, GamificationTagCategory } from '@/types/gamificationTags.types';
import MultiSelectDropdown from '@/components/inputs/MultiSelectDropdown';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'switch'
  | 'tags'
  | 'ranks'
  | 'levels'
  | 'datetime'
  | 'segments'
  | 'missions';

/** One configured level inside a Rank (stored in data.levels[]). */
export interface RankLevel {
  level: number;
  xp_start: number;
  xp_end: number;
  reward_type?: string;
  reward_value?: number;
  /** SDLCGames bonus ids granted on reaching this level (comma-separated paste). */
  bonus_ids?: string[];
}

/** Parse the comma-separated Bonus IDs cell into a clean string[]. */
const parseBonusIds = (raw: string): string[] =>
  raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

/** Reward types selectable per level (kept in sync with the rank-wide reward step). */
export const LEVEL_REWARD_TYPES: FieldOption[] = [
  { label: 'None', value: '' },
  { label: 'Bonus Cash', value: 'bonus_cash' },
  { label: 'Free Spins', value: 'free_spins' },
  { label: 'XP Points', value: 'xp' },
  { label: 'Tokens', value: 'tokens' },
];

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldDef {
  /** key inside form.data (or 'name'/'description' which are root columns) */
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: FieldOption[];
  /** half-width when true (two per row) */
  half?: boolean;
  hint?: string;
  /** Filter the tag dropdown by category (only used for `type: 'tags'`). */
  tagCategory?: GamificationTagCategory;
}

const RanksField: FC<{
  value: string[];
  onChange: (next: string[]) => void;
}> = ({ value, onChange }) => {
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiService.get<PaginatedData<GamificationEntity>>(
          '/gamification/ranks/paginate',
          { page: 1, limit: 100 }
        );
        if (cancelled) return;
        const names = response?.success ? (response.data?.data ?? []).map((r) => r.name) : [];
        setOptions(Array.from(new Set([...names, ...value])));
      } catch {
        if (!cancelled) setOptions(value);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <MultiSelectDropdown
      options={options}
      selected={value}
      onChange={onChange}
      placeholder="Select ranks…"
    />
  );
};

const TagsField: FC<{
  value: string[];
  onChange: (next: string[]) => void;
  category?: GamificationTagCategory;
}> = ({ value, onChange, category }) => {
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiService.get<PaginatedData<GamificationTag>>(
          '/tags-gamification/paginate',
          { page: 1, limit: 100, ...(category ? { category } : {}) }
        );
        if (cancelled) return;
        const names = response?.success ? (response.data?.data ?? []).map((t) => t.name) : [];
        setOptions(Array.from(new Set([...names, ...value])));
      } catch {
        if (!cancelled) setOptions(value);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <MultiSelectDropdown
      options={options}
      selected={value}
      onChange={onChange}
      placeholder="Select tags…"
    />
  );
};

/**
 * Multi-select dropdown of CRM segments, sourced live from
 * `/segments/paginate`. Stores the selected segment names (strings) so the
 * tournament's `data.segment` carries human-readable audience names.
 */
const SegmentsField: FC<{
  value: string[];
  onChange: (next: string[]) => void;
}> = ({ value, onChange }) => {
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiService.get<PaginatedData<{ id: string; name: string }>>(
          '/segments/paginate',
          { page: 1, limit: 100, archived: false }
        );
        if (cancelled) return;
        const names = response?.success ? (response.data?.data ?? []).map((s) => s.name) : [];
        setOptions(Array.from(new Set([...names, ...value])));
      } catch {
        if (!cancelled) setOptions(value);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <MultiSelectDropdown
      options={options}
      selected={value}
      onChange={onChange}
      placeholder="Select segments…"
    />
  );
};

/** A mission grouped in a bundle — stored with both its id (the relation to
 * the missions table) and its name (for display / back-compat). */
export interface MissionRef {
  id: string;
  name: string;
}

/** Coerce a stored `data.missions` value (objects, names, or a legacy
 * comma-separated string) into `{ id, name }[]`. */
export const toMissionRefs = (value: unknown): MissionRef[] => {
  if (Array.isArray(value)) {
    return value
      .map((v) =>
        typeof v === 'string'
          ? { id: '', name: v.trim() }
          : {
              id: String((v as MissionRef).id ?? '').trim(),
              name: String((v as MissionRef).name ?? '').trim(),
            }
      )
      .filter((r) => r.id || r.name);
  }
  if (typeof value === 'string' && value) {
    return value
      .split(',')
      .map((s) => ({ id: '', name: s.trim() }))
      .filter((r) => r.name);
  }
  return [];
};

/**
 * Multi-select dropdown of existing missions, sourced live from
 * `/gamification/missions/paginate` (active, non-archived). Stores the selected
 * missions as `{ id, name }[]` so a bundle's `data.missions` keeps a real
 * relation (the mission id) to the missions table plus a human-readable name —
 * mirroring how RanksField/SegmentsField work, but id-aware.
 */
const MissionsField: FC<{
  value: MissionRef[];
  onChange: (next: MissionRef[]) => void;
}> = ({ value, onChange }) => {
  const [catalog, setCatalog] = useState<MissionRef[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiService.get<PaginatedData<GamificationEntity>>(
          '/gamification/missions/paginate',
          { page: 1, limit: 100, archived: false, status: 'ACTIVE' }
        );
        if (cancelled) return;
        const rows = response?.success ? (response.data?.data ?? []) : [];
        setCatalog(rows.map((m) => ({ id: m.id, name: m.name })));
      } catch {
        if (!cancelled) setCatalog([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // The dropdown works in names; we map names back to `{ id, name }` on change.
  const byName = new Map(catalog.map((m) => [m.name, m]));
  const selectedNames = value.map((v) => v.name);
  const options = Array.from(new Set([...catalog.map((m) => m.name), ...selectedNames]));

  const onNamesChange = (names: string[]) =>
    onChange(
      names.map((n) => byName.get(n) ?? value.find((v) => v.name === n) ?? { id: '', name: n })
    );

  return (
    <MultiSelectDropdown
      options={options}
      selected={selectedNames}
      onChange={onNamesChange}
      placeholder="Select missions…"
    />
  );
};

export interface WizardStep {
  key: string;
  title: string;
  /** short helper line under the step title */
  subtitle?: string;
  fields: FieldDef[];
}

const ROOT_FIELDS = new Set(['name', 'description', 'priority']);

export const isRootField = (name: string) => ROOT_FIELDS.has(name);

/** Where this rank's levels must begin so the whole ladder stays continuous. */
export interface LevelContinuation {
  /** First level number for this rank (previous rank's last level + 1, or 1). */
  startLevel: number;
  /** First XP value for this rank (previous rank's last xp_end, or 0). */
  startXp: number;
  /** Name of the rank this one continues from, for the helper text. */
  fromRank?: string | null;
}

const DEFAULT_CONTINUATION: LevelContinuation = { startLevel: 1, startXp: 0 };

/**
 * Re-stitch levels into one continuous ladder: levels are numbered
 * sequentially from `startLevel`, and each XP window starts exactly where
 * the previous one ended (the first starting at `startXp`). Only `xp_end`
 * and the reward are user-controlled — the rest is derived so a rank can
 * never restart level numbers or leave gaps the backend would reject.
 */
const normalizeLevels = (rows: RankLevel[], cont: LevelContinuation): RankLevel[] => {
  let cursor = cont.startXp;
  return rows.map((row, i) => {
    const xp_start = cursor;
    const rawEnd = Number(row.xp_end);
    const xp_end = Number.isFinite(rawEnd) && rawEnd > xp_start ? rawEnd : xp_start + 100;
    cursor = xp_end;
    return {
      ...row,
      level: cont.startLevel + i,
      xp_start,
      xp_end,
      reward_type: row.reward_type ?? '',
      reward_value: row.reward_value ?? 0,
    };
  });
};

interface LevelsEditorProps {
  value: RankLevel[];
  onChange: (value: RankLevel[]) => void;
  continuation?: LevelContinuation;
}

/**
 * Repeatable editor for a Rank's levels. Levels are part of a single global
 * ladder — this rank continues numbering and XP from the previous rank
 * (`continuation`). Level number and XP Start are derived (read-only); the
 * admin only sets each level's XP End and optional per-level reward.
 */
const LevelsEditor: FC<LevelsEditorProps> = ({ value, onChange, continuation }) => {
  const cont = continuation ?? DEFAULT_CONTINUATION;
  const cell =
    'w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500';
  const lockedCell =
    'w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-400 cursor-not-allowed';

  const rows = normalizeLevels(value, cont);

  const emit = (next: RankLevel[]) => onChange(normalizeLevels(next, cont));

  const update = (idx: number, patch: Partial<RankLevel>) =>
    emit(rows.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const addRow = () => {
    const last = rows[rows.length - 1];
    const nextStart = last ? last.xp_end : cont.startXp;
    emit([
      ...rows,
      {
        level: cont.startLevel + rows.length,
        xp_start: nextStart,
        xp_end: nextStart + 100,
        reward_type: '',
        reward_value: 0,
      },
    ]);
  };

  const removeRow = (idx: number) => emit(rows.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-slate-500">
        {cont.fromRank
          ? `Continues from rank “${cont.fromRank}” — starts at level ${cont.startLevel} / ${cont.startXp} XP.`
          : `First rank — starts at level ${cont.startLevel} / ${cont.startXp} XP.`}{' '}
        Level &amp; XP Start are auto-continued; set XP End and the reward.
      </p>

      {rows.length > 0 && (
        <div className="grid grid-cols-[55px_1fr_1fr_1fr_80px_1.4fr_28px] gap-2 text-[11px] text-slate-500 px-1">
          <span>Level</span>
          <span>XP Start</span>
          <span>XP End</span>
          <span>Level Reward</span>
          <span>Reward Val</span>
          <span>Bonus IDs</span>
          <span />
        </div>
      )}

      {rows.map((row, idx) => (
        <div
          key={idx}
          className="grid grid-cols-[55px_1fr_1fr_1fr_80px_1.4fr_28px] gap-2 items-center"
        >
          <input type="number" className={lockedCell} value={row.level} readOnly tabIndex={-1} />
          <input type="number" className={lockedCell} value={row.xp_start} readOnly tabIndex={-1} />
          <input
            type="number"
            className={cell}
            value={row.xp_end ?? ''}
            onChange={(e) => update(idx, { xp_end: Number(e.target.value) })}
          />
          <select
            className={cell}
            value={row.reward_type ?? ''}
            onChange={(e) => update(idx, { reward_type: e.target.value })}
          >
            {LEVEL_REWARD_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            className={cell}
            value={row.reward_value ?? ''}
            onChange={(e) => update(idx, { reward_value: Number(e.target.value) })}
          />
          <input
            type="text"
            className={cell}
            placeholder="SDLCGames bonus ids, comma-separated"
            value={(row.bonus_ids ?? []).join(', ')}
            onChange={(e) => update(idx, { bonus_ids: parseBonusIds(e.target.value) })}
            title="Paste SDLCGames bonus IDs (from Bonus Management), separated by commas"
          />
          <button
            type="button"
            onClick={() => removeRow(idx)}
            className="text-red-400 hover:text-red-300 text-sm"
            title="Remove level"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="mt-1 px-3 py-1.5 rounded text-xs bg-blue-600/80 hover:bg-blue-600 text-white"
      >
        + Add Level
      </button>
    </div>
  );
};

interface FieldRendererProps {
  field: FieldDef;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  /** Ladder continuation context for the `levels` editor. */
  levelContinuation?: LevelContinuation;
}

export const FieldRenderer: FC<FieldRendererProps> = ({
  field,
  value,
  error,
  onChange,
  levelContinuation,
}) => {
  const base =
    'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500';

  return (
    <div className={field.half ? 'w-full' : 'w-full'}>
      <label className="text-xs text-slate-400 block mb-1">
        {field.label}
        {field.required && <span className="text-red-400"> *</span>}
      </label>

      {field.type === 'text' && (
        <input
          className={base}
          placeholder={field.placeholder}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'datetime' && (
        <input
          type="datetime-local"
          className={base}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'segments' && (
        <SegmentsField
          value={
            Array.isArray(value)
              ? (value as string[])
              : typeof value === 'string' && value
                ? [value]
                : []
          }
          onChange={(v) => onChange(v)}
        />
      )}

      {field.type === 'number' && (
        <input
          type="number"
          className={base}
          placeholder={field.placeholder}
          value={(value as number | string) ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          rows={3}
          className={base}
          placeholder={field.placeholder}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'select' && (
        <select
          className={base}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}

      {field.type === 'multiselect' && (
        <div className="flex flex-wrap gap-2 p-2 bg-slate-800 border border-slate-700 rounded">
          {field.options?.map((o) => {
            const arr = Array.isArray(value) ? (value as string[]) : [];
            const checked = arr.includes(o.value);
            return (
              <button
                type="button"
                key={o.value}
                onClick={() =>
                  onChange(checked ? arr.filter((v) => v !== o.value) : [...arr, o.value])
                }
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  checked
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}

      {field.type === 'tags' && (
        <TagsField
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={(v) => onChange(v)}
          category={field.tagCategory}
        />
      )}

      {field.type === 'ranks' && (
        <RanksField
          value={
            Array.isArray(value)
              ? (value as string[])
              : typeof value === 'string' && value
                ? value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                : []
          }
          onChange={(v) => onChange(v)}
        />
      )}

      {field.type === 'missions' && (
        <MissionsField value={toMissionRefs(value)} onChange={(v) => onChange(v)} />
      )}

      {field.type === 'switch' && (
        <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer mt-1">
          <input
            type="checkbox"
            className="w-4 h-4 accent-blue-600"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          {field.placeholder ?? 'Enabled'}
        </label>
      )}

      {field.type === 'levels' && (
        <LevelsEditor
          value={Array.isArray(value) ? (value as RankLevel[]) : []}
          onChange={(v) => onChange(v)}
          continuation={levelContinuation}
        />
      )}

      {field.hint && <p className="text-[11px] text-slate-500 mt-1">{field.hint}</p>}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
};
