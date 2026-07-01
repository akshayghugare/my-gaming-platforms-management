import { useMemo, useState, type FC } from 'react';
import { ChevronUp, Search } from 'lucide-react';
import DataCardGrid from '@/components/players/DataCardGrid';
import type { Player } from '@/types/player.types';

const filterRecord = (
  rec: Record<string, unknown> | null | undefined,
  q: string
): Record<string, unknown> => {
  if (!rec) return {};
  if (!q) return rec;
  const lower = q.toLowerCase();
  return Object.fromEntries(
    Object.entries(rec).filter(
      ([k, v]) =>
        k.toLowerCase().includes(lower) ||
        String(v ?? '')
          .toLowerCase()
          .includes(lower)
    )
  );
};

const Section: FC<{
  title: string;
  data: Record<string, unknown>;
  defaultOpen?: boolean;
}> = ({ title, data, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  const count = Object.keys(data).length;
  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-lg">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-4 py-3">
        <ChevronUp
          size={16}
          className={`text-slate-400 transition-transform ${open ? '' : 'rotate-180'}`}
        />
        <span className="font-semibold text-sm">{title}</span>
        <span className="ml-1 text-xs bg-blue-500/20 text-blue-300 rounded-full px-2 py-0.5">
          {count}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <DataCardGrid data={data} />
        </div>
      )}
    </div>
  );
};

const PlayerDataTab: FC<{ player: Player }> = ({ player }) => {
  const [search, setSearch] = useState('');

  const playerData = useMemo(
    () => filterRecord(player.player_data, search),
    [player.player_data, search]
  );
  const customData = useMemo(
    () => filterRecord(player.custom_data, search),
    [player.custom_data, search]
  );
  const txData = useMemo(
    () => filterRecord(player.transactional_data, search),
    [player.transactional_data, search]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Search</label>
          <div className="relative">
            <input
              className="w-64 pl-3 pr-9 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search
              size={15}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>
      </div>

      <Section title="Player Data" data={playerData} />
      <Section title="Custom Data" data={customData} />
      <Section title="Transactional Data" data={txData} />
    </div>
  );
};

export default PlayerDataTab;
