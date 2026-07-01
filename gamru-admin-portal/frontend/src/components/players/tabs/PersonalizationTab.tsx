import { useMemo, useState, type FC } from 'react';
import type { CategoryStat, Player } from '@/types/player.types';

const EmptyCard: FC<{ title: string }> = ({ title }) => (
  <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-6">
    <h3 className="font-semibold mb-4">{title}</h3>
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-16 border-2 border-slate-600 rounded mb-3" />
      <p className="font-semibold text-slate-300">No results found.</p>
      <p className="text-xs text-slate-500 mt-1">
        What you searched for was unfortunately not found. Please try another combination.
      </p>
    </div>
  </div>
);

/**
 * Pleasant, deterministic palette for category/provider slices —
 * indexed by row order so the donut and legend always line up.
 */
const SLICE_COLORS = [
  '#3b82f6', // blue-500
  '#22d3ee', // cyan-400
  '#a855f7', // purple-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#84cc16', // lime-500
];

const Donut: FC<{ total: number; rows: CategoryStat[] }> = ({ total, rows }) => {
  const stops = useMemo(() => {
    const safeTotal = rows.reduce((s, r) => s + Math.max(0, r.turnover), 0) || 1;
    let cursor = 0;
    const segs = rows.map((r, i) => {
      const start = (cursor / safeTotal) * 100;
      cursor += Math.max(0, r.turnover);
      const end = (cursor / safeTotal) * 100;
      return `${SLICE_COLORS[i % SLICE_COLORS.length]} ${start}% ${end}%`;
    });
    return segs.length ? `conic-gradient(${segs.join(', ')})` : 'conic-gradient(#1e293b 0% 100%)';
  }, [rows]);

  return (
    <div className="relative w-32 h-32 shrink-0">
      <div className="absolute inset-0 rounded-full" style={{ background: stops }} />
      <div className="absolute inset-[14px] rounded-full bg-slate-900" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-sm font-semibold">USD {total.toFixed(2)}</span>
        <span className="text-[10px] text-slate-400">Total Turnover</span>
      </div>
    </div>
  );
};

const StatCard: FC<{ title: string; rows?: CategoryStat[]; total: number }> = ({
  title,
  rows,
  total,
}) => {
  const data = rows ?? [];
  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-5">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="flex items-center gap-6">
        <Donut total={total} rows={data} />
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-slate-400">
              <tr>
                <th className="text-left py-1">NAME</th>
                <th className="text-left py-1">PERC.</th>
                <th className="text-left py-1">TURNOVER</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-3 text-slate-500">
                    No data
                  </td>
                </tr>
              ) : (
                data.map((r, i) => (
                  <tr key={r.name} className="border-t border-slate-700/60">
                    <td className="py-2">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            background: SLICE_COLORS[i % SLICE_COLORS.length],
                          }}
                        />
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="text-blue-300 hover:underline underline-offset-2"
                        >
                          {r.name}
                        </a>
                      </span>
                    </td>
                    <td className="py-2">{r.perc}%</td>
                    <td className="py-2">USD {r.turnover}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PersonalizationTab: FC<{ player: Player }> = ({ player }) => {
  const [view, setView] = useState<'casino' | 'sports'>('casino');
  const [favCategory, setFavCategory] = useState<string>('');
  const casino = player.personalization?.casino;
  const total = casino?.totalTurnover ?? 0;
  const allFav = casino?.favoriteGames ?? [];
  const favCategories = useMemo(
    () => Array.from(new Set(allFav.map((g) => g.category).filter(Boolean))),
    [allFav]
  );
  const fav = favCategory ? allFav.filter((g) => g.category === favCategory) : allFav;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['casino', 'sports'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-full text-sm capitalize ${
                view === v
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <select className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm">
          <option>Lifetime</option>
          <option>Last 30 days</option>
          <option>Last 7 days</option>
        </select>
      </div>

      {view === 'casino' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <StatCard title="Game Category" rows={casino?.gameCategory} total={total} />
            <StatCard title="Game Provider" rows={casino?.gameProvider} total={total} />
          </div>

          <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-5">
            <div className="flex items-start justify-between mb-4 gap-4">
              <h3 className="font-semibold">Favorite Games</h3>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-slate-400">Categories</span>
                <select
                  value={favCategory}
                  onChange={(e) => setFavCategory(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm min-w-[220px]"
                >
                  <option value="">All</option>
                  {favCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800 text-slate-400 text-xs">
                  <tr>
                    <th className="p-2 text-left">POSITION</th>
                    <th className="p-2 text-left">GAME</th>
                    <th className="p-2 text-left">CATEGORY</th>
                    <th className="p-2 text-left">TURNOVER</th>
                    <th className="p-2 text-left">PERC.</th>
                  </tr>
                </thead>
                <tbody>
                  {fav.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500">
                        No favorite games
                      </td>
                    </tr>
                  ) : (
                    fav.map((g) => (
                      <tr key={g.position} className="border-t border-slate-700/60">
                        <td className="p-2">{g.position}</td>
                        <td className="p-2">{g.game}</td>
                        <td className="p-2">{g.category}</td>
                        <td className="p-2">USD {g.turnover}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden max-w-[160px]">
                              <div className="h-full bg-blue-500" style={{ width: `${g.perc}%` }} />
                            </div>
                            <span className="text-xs">{g.perc}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <EmptyCard title="Sports" />
          <EmptyCard title="Tournaments" />
          <EmptyCard title="Teams" />
          <EmptyCard title="Markets" />
        </div>
      )}
    </div>
  );
};

export default PersonalizationTab;
