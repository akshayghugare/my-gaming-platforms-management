import { useState, type FC } from 'react';

const DAYS: readonly string[] = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS: readonly string[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface ViewDate {
  year: number;
  month: number;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const CalendarComponent: FC = () => {
  const today = new Date();
  const [viewDate, setViewDate] = useState<ViewDate>({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const { year, month } = viewDate;
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prev = (): void => {
    setViewDate((v) =>
      v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }
    );
  };

  const next = (): void => {
    setViewDate((v) =>
      v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }
    );
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d: number): boolean =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="w-full bg-[#0d1b3e] p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-100">
          {MONTHS[month]} {year}
        </span>
        <div className="flex gap-2">
          <button
            onClick={prev}
            className="text-slate-500 hover:text-slate-200 text-base px-1 transition-colors"
            type="button"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="text-slate-500 hover:text-slate-200 text-base px-1 transition-colors"
            type="button"
          >
            ›
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center mb-1">
        {DAYS.map((d, i) => (
          <div key={i} className="text-[10px] font-semibold text-slate-500 py-1 uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 text-center">
        {cells.map((d, i) => (
          <div
            key={i}
            className={`
              w-7 h-7 flex items-center justify-center mx-auto my-0.5 rounded-full text-xs cursor-pointer transition-colors
              ${!d ? 'invisible' : ''}
              ${
                d && isToday(d)
                  ? 'bg-blue-500 text-white font-semibold'
                  : d
                    ? 'text-slate-500 hover:bg-white/8 hover:text-slate-200'
                    : ''
              }
            `}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarComponent;
