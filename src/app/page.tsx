"use client";

import { useState, useEffect } from "react";
import { Shift, Rates, Deductions, ShiftData } from "@/lib/types";
import Calendar from "@/components/Calendar";
import ShiftModal from "@/components/ShiftModal";
import RatesPanel from "@/components/RatesPanel";
import EarningsSummary from "@/components/EarningsSummary";

const LS_KEY = "ratecal_data";
const DEFAULT_RATES: Rates = { normal: 12, extra: 18, bankHoliday: 24 };
const DEFAULT_DEDUCTIONS: Deductions = { studentLoan: "none", pensionPercent: 0 };

function save(data: ShiftData) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function load(): ShiftData {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return { shifts: [], rates: DEFAULT_RATES, deductions: DEFAULT_DEDUCTIONS };
  try {
    const data = JSON.parse(raw);
    // Migrate old data that doesn't have deductions
    if (!data.deductions) {
      data.deductions = DEFAULT_DEDUCTIONS;
    }
    return data;
  } catch {
    return { shifts: [], rates: DEFAULT_RATES, deductions: DEFAULT_DEDUCTIONS };
  }
}

export default function Home() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);
  const [deductions, setDeductions] = useState<Deductions>(DEFAULT_DEDUCTIONS);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const data = load();
    setShifts(data.shifts);
    setRates(data.rates);
    setDeductions(data.deductions);
    setReady(true);
  }, []);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (ready) {
      save({ shifts, rates, deductions });
    }
  }, [shifts, rates, deductions, ready]);

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
    localStorage.removeItem(LS_KEY);
    setShifts([]);
    setRates(DEFAULT_RATES);
    setDeductions(DEFAULT_DEDUCTIONS);
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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
              Rate Cal
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Shift tracker &amp; earnings calculator
            </p>
          </div>
          <button
            onClick={handleReset}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
          >
            Reset
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow p-3 sm:p-5">
            <Calendar
              year={year}
              month={month}
              shifts={shifts}
              onDayClick={(date) => setSelectedDate(date)}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <RatesPanel
              rates={rates}
              deductions={deductions}
              onSaveRates={setRates}
              onSaveDeductions={setDeductions}
            />
            <EarningsSummary
              shifts={shifts}
              rates={rates}
              deductions={deductions}
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
    </div>
  );
}
