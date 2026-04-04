"use client";

import { Shift } from "@/lib/types";

interface CalendarProps {
  year: number;
  month: number; // 0-indexed
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

  // Monday = 0, Sunday = 6
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
    normal: "bg-blue-500",
    extra: "bg-amber-500",
    bankHoliday: "bg-red-500",
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <button
          onClick={onPrevMonth}
          className="px-2.5 py-1 sm:px-3 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
        >
          &larr;
        </button>
        <h2 className="text-base sm:text-xl font-semibold text-gray-800 dark:text-gray-100">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          onClick={onNextMonth}
          className="px-2.5 py-1 sm:px-3 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
        >
          &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {DAY_NAMES_FULL.map((d, i) => (
          <div key={d} className="text-center text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{DAY_NAMES_SHORT[i]}</span>
          </div>
        ))}

        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="h-12 sm:h-20" />;
          }

          const dateStr = `${monthStr}-${String(day).padStart(2, "0")}`;
          const dayShifts = getShiftsForDay(day);
          const isToday = dateStr === todayStr;

          return (
            <button
              key={dateStr}
              onClick={() => onDayClick(dateStr)}
              className={`h-12 sm:h-20 p-0.5 sm:p-1 rounded sm:rounded-lg border text-left transition-colors hover:bg-blue-50 dark:hover:bg-gray-700 ${
                isToday
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <span
                className={`text-[11px] sm:text-sm font-medium ${
                  isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {day}
              </span>
              {/* On mobile: just show dots for shifts. On desktop: show time ranges */}
              <div className="mt-0.5 sm:mt-1 space-y-0.5">
                {dayShifts.map((s) => (
                  <div key={s.id}>
                    <div
                      className={`${typeColors[s.type]} hidden sm:block text-white text-[10px] px-1 rounded truncate`}
                    >
                      {s.startTime}-{s.endTime}
                    </div>
                    <div
                      className={`${typeColors[s.type]} sm:hidden w-1.5 h-1.5 rounded-full inline-block mr-0.5`}
                    />
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
