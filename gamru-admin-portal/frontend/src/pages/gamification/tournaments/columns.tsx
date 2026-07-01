import { useEffect, useState, type FC } from 'react';
import {
  STATUS_COL,
  NAME_COL,
  pill,
  dash,
  dataCell,
  type ColumnDef,
} from '@/components/gamification/cells';

/** Live "time left until the tournament ends" counter (re-ticks every second). */
const TournamentCountdown: FC<{ end: unknown }> = ({ end }) => {
  const target = end ? new Date(String(end)).getTime() : NaN;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (Number.isNaN(target)) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);

  if (Number.isNaN(target)) return <span className="text-slate-500 text-xs">No end date</span>;

  const diff = target - now;
  if (diff <= 0) {
    return (
      <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
        Ended
      </span>
    );
  }

  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const label = d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`;

  return (
    <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
      Ends in {label}
    </span>
  );
};

const fmt = (v: unknown): string => {
  if (!v) return '-';
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
};

export const tournamentsColumns: ColumnDef[] = [
  STATUS_COL,
  NAME_COL,
  { header: 'Type', render: dataCell('tournament_type') },
  { header: 'Period', render: dataCell('period') },
  {
    header: 'Time Frame',
    render: (r) =>
      r.data?.start_date || r.data?.end_date ? (
        <div className="text-xs space-y-1">
          <div className="text-slate-400">{fmt(r.data?.start_date)}</div>
          <div className="text-slate-400">{fmt(r.data?.end_date)}</div>
          <TournamentCountdown end={r.data?.end_date} />
        </div>
      ) : (
        dash(null)
      ),
  },
  {
    header: 'Industry',
    render: (r) => (r.data?.industry ? pill(String(r.data.industry)) : dash(null)),
  },
  {
    header: 'Min Bet Amount',
    render: (r) => (r.data?.min_bet ? pill(`${r.data.min_bet} USD`) : dash(null)),
  },
  { header: 'Max Number of Bets', render: dataCell('max_bets') },
  {
    header: 'Opt-in',
    render: (r) => (
      <span className="text-slate-400 text-xs">{r.data?.opt_in ? 'Active' : 'Inactive'}</span>
    ),
  },
  { header: 'Buy-in', render: dataCell('buy_in') },
];
