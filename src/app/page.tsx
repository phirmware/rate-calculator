"use client";

import { useState, useEffect, useMemo } from "react";
import { Shift, Rates, Deductions, ShiftData, MonthOverride } from "@/lib/types";
import Calendar from "@/components/Calendar";
import ShiftModal from "@/components/ShiftModal";
import RatesPanel from "@/components/RatesPanel";
import EarningsSummary from "@/components/EarningsSummary";

const LS_KEY = "ratecal_data";
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DEFAULT_RATES: Rates = { normal: 12, extra: 18, bankHoliday: 24 };
const DEFAULT_DEDUCTIONS: Deductions = { studentLoan: "none", pensionPercent: 0, taxCode: "1257L" };

function save(data: ShiftData) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function load(): ShiftData {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return { shifts: [], rates: DEFAULT_RATES, deductions: DEFAULT_DEDUCTIONS, monthOverrides: {} };
  try {
    const data = JSON.parse(raw);
    if (!data.deductions) {
      data.deductions = DEFAULT_DEDUCTIONS;
    }
    if (!data.deductions.taxCode) {
      data.deductions.taxCode = "1257L";
    }
    if (!data.monthOverrides) {
      data.monthOverrides = {};
    }
    return data;
  } catch {
    return { shifts: [], rates: DEFAULT_RATES, deductions: DEFAULT_DEDUCTIONS, monthOverrides: {} };
  }
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default function Home() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);
  const [deductions, setDeductions] = useState<Deductions>(DEFAULT_DEDUCTIONS);
  const [monthOverrides, setMonthOverrides] = useState<Record<string, MonthOverride>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const currentMonthKey = monthKey(year, month);
  const currentOverride = monthOverrides[currentMonthKey];
  const hasOverride = !!currentOverride;

  // Effective rates/deductions for the current month
  const effectiveRates = useMemo(
    () => currentOverride?.rates || rates,
    [currentOverride, rates]
  );
  const effectiveDeductions = useMemo(
    () => currentOverride?.deductions || deductions,
    [currentOverride, deductions]
  );

  useEffect(() => {
    const data = load();
    setShifts(data.shifts);
    setRates(data.rates);
    setDeductions(data.deductions);
    setMonthOverrides(data.monthOverrides || {});
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      save({ shifts, rates, deductions, monthOverrides });
    }
  }, [shifts, rates, deductions, monthOverrides, ready]);

  function handleSaveShift(shift: Shift) {
    setShifts((prev) => {
      const index = prev.findIndex((s) => s.id === shift.id);
      if (index >= 0) {
        return prev.map((s) => (s.id === shift.id ? shift : s));
      }
      return [...prev, shift];
    });
  }

  function handleDeleteShift(id: string) {
    setShifts((prev) => prev.filter((s) => s.id !== id));
  }

  function handleReset() {
    const mk = currentMonthKey;
    setShifts((prev) => prev.filter((s) => !s.date.startsWith(mk)));
    setShowReset(false);
  }

  function handleSaveGlobalRates(r: Rates) {
    setRates(r);
  }

  function handleSaveGlobalDeductions(d: Deductions) {
    setDeductions(d);
  }

  function handleSaveOverride(overrideRates: Rates, overrideDeductions: Deductions) {
    setMonthOverrides((prev) => ({
      ...prev,
      [currentMonthKey]: { rates: overrideRates, deductions: overrideDeductions },
    }));
  }

  function handleRemoveOverride() {
    setMonthOverrides((prev) => {
      const next = { ...prev };
      delete next[currentMonthKey];
      return next;
    });
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-white font-bold text-sm sm:text-base">RC</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Rate Cal
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium -mt-0.5">
                Shift tracker
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowReset(true)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 dark:text-slate-400 dark:hover:text-red-400 transition-all duration-200"
          >
            Reset
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 p-3 sm:p-5">
              <Calendar
                year={year}
                month={month}
                shifts={shifts}
                onDayClick={(date) => setSelectedDate(date)}
                onPrevMonth={prevMonth}
                onNextMonth={nextMonth}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            <RatesPanel
              globalRates={rates}
              globalDeductions={deductions}
              hasOverride={hasOverride}
              overrideRates={currentOverride?.rates}
              overrideDeductions={currentOverride?.deductions}
              monthLabel={`${MONTH_NAMES[month]} ${year}`}
              onSaveGlobal={(r, d) => {
                handleSaveGlobalRates(r);
                handleSaveGlobalDeductions(d);
              }}
              onSaveOverride={handleSaveOverride}
              onRemoveOverride={handleRemoveOverride}
            />
            <EarningsSummary
              shifts={shifts}
              rates={effectiveRates}
              deductions={effectiveDeductions}
              year={year}
              month={month}
            />
          </div>
        </div>
      </main>

      {/* Shift modal */}
      {selectedDate && (
        <ShiftModal
          date={selectedDate}
          existingShifts={shifts.filter((s) => s.date === selectedDate)}
          onSave={handleSaveShift}
          onDelete={handleDeleteShift}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {/* Reset confirmation */}
      {showReset && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
          onClick={() => setShowReset(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 mx-4 max-w-sm w-full animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">
              Clear this month?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              This will delete all shifts for {MONTH_NAMES[month]} {year}. Your rates and settings will not be affected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm shadow-red-500/20"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
