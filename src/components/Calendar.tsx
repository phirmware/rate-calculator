"use client";

import { Shift } from "@/lib/types";

interface CalendarProps {
  year: number;
  month: number;
  shifts: Shift[];
  onDayClick: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

export default function Calendar({
  year, month, shifts, onDayClick, onPrevMonth, onNextMonth,
}: CalendarProps) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  function getShiftsForDay(day: number): Shift[] {
    const dateStr = `${monthStr}-${String(day).padStart(2, "0")}`;
    return shifts.filter((s) => s.date === dateStr);
  }

  const typeColors: Record<string, string> = {
    normal: "bg-indigo-500",
    extra: "bg-amber-500",
    bankHoliday: "bg-rose-500",
  };

  const typeDotColors: Record<string, string> = {
    normal: "bg-indigo-400",
    extra: "bg-amber-400",
    bankHoliday: "bg-rose-400",
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <button
          onClick={onPrevMonth}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all duration-200 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          onClick={onNextMonth}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all duration-200 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1">
        {DAY_NAMES_FULL.map((d, i) => (
          <div key={`${d}-${i}`} className="text-center text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 py-1.5 uppercase tracking-wider">
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{DAY_NAMES_SHORT[i]}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="h-12 sm:h-[4.5rem]" />;
          }

          const dateStr = `${monthStr}-${String(day).padStart(2, "0")}`;
          const dayShifts = getShiftsForDay(day);
          const isToday = dateStr === todayStr;
          const hasShifts = dayShifts.length > 0;

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`h-12 sm:h-[4.5rem] p-0.5 sm:p-1.5 rounded-lg sm:rounded-xl text-left transition-all duration-200 active:scale-[0.97] relative ${
                isToday
                  ? "bg-indigo-500 shadow-md shadow-indigo-500/20"
                  : hasShifts
                  ? "bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <span
                className={`text-[11px] sm:text-sm font-semibold ${
                  isToday
                    ? "text-white"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {day}
              </span>

              {/* Desktop: show time ranges */}
              <div className="hidden sm:block mt-0.5 space-y-0.5">
                {dayShifts.slice(0, 2).map((s) => (
                  <div
                    key={s.id}
                    className={`${isToday ? "bg-white/25" : typeColors[s.type]} text-white text-[9px] leading-tight px-1 py-px rounded truncate`}
                  >
                    {s.startTime}
                  </div>
                ))}
                {dayShifts.length > 2 && (
                  <div className={`text-[9px] ${isToday ? "text-white/70" : "text-slate-400"}`}>
                    +{dayShifts.length - 2}
                  </div>
                )}
              </div>

              {/* Mobile: show dots */}
              {dayShifts.length > 0 && (
                <div className="sm:hidden absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {dayShifts.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className={`w-1 h-1 rounded-full ${isToday ? "bg-white/70" : typeDotColors[s.type]}`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
