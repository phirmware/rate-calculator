"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Shift, Rates, Deductions, ShiftData, MonthOverride, ShiftPreset } from "@/lib/types";
import Calendar from "@/components/Calendar";
import ShiftModal, { DEFAULT_PRESETS } from "@/components/ShiftModal";
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
  if (!raw) return { shifts: [], rates: DEFAULT_RATES, deductions: DEFAULT_DEDUCTIONS, monthOverrides: {}, presets: DEFAULT_PRESETS };
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
    if (!data.presets || data.presets.length === 0) {
      data.presets = DEFAULT_PRESETS;
    }
    return data;
  } catch {
    return { shifts: [], rates: DEFAULT_RATES, deductions: DEFAULT_DEDUCTIONS, monthOverrides: {}, presets: DEFAULT_PRESETS };
  }
}

type TrackEvent = { action: "add" | "edit" | "delete"; shift: Shift; ts: string };

const pendingEvents: TrackEvent[] = [];
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 10_000; // send 10 s after last action

function getBrowserInfo() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${screen.width}×${screen.height}`,
    platform: navigator.platform,
  };
}

function flushEvents() {
  if (pendingEvents.length === 0) return;
  const events = pendingEvents.splice(0); // drain
  if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
  const body = JSON.stringify({ events, browser: getBrowserInfo() });
  // sendBeacon is reliable during page close; fall back to fetch otherwise
  if (typeof navigator.sendBeacon === "function") {
    navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
  } else {
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body })
      .catch(() => {});
  }
}

function trackShift(action: "add" | "edit" | "delete", shift: Shift) {
  pendingEvents.push({ action, shift, ts: new Date().toISOString() });
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(flushEvents, DEBOUNCE_MS);
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
  const [presets, setPresets] = useState<ShiftPreset[]>(DEFAULT_PRESETS);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [activeTab, setActiveTab] = useState<"calendar" | "earnings" | "settings">("calendar");

  const currentMonthKey = monthKey(year, month);
  const currentOverride = monthOverrides[currentMonthKey];
  const hasOverride = !!currentOverride;
  const currentMonthShiftCount = shifts.filter((s) => s.date.startsWith(currentMonthKey)).length;

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
    setPresets(data.presets || DEFAULT_PRESETS);
    setReady(true);

    window.addEventListener("beforeunload", flushEvents);
    return () => window.removeEventListener("beforeunload", flushEvents);
  }, []);

  useEffect(() => {
    if (ready) {
      save({ shifts, rates, deductions, monthOverrides, presets });
    }
  }); // no deps — intentionally saves after every render when ready

  function handleSaveShift(shift: Shift) {
    setShifts((prev) => {
      const index = prev.findIndex((s) => s.id === shift.id);
      if (index >= 0) {
        trackShift("edit", shift);
        return prev.map((s) => (s.id === shift.id ? shift : s));
      }
      trackShift("add", shift);
      return [...prev, shift];
    });
  }

  function handleDeleteShift(id: string) {
    setShifts((prev) => {
      const shift = prev.find((s) => s.id === id);
      if (shift) trackShift("delete", shift);
      return prev.filter((s) => s.id !== id);
    });
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

      {/* ── Header ── */}
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
              {/* Desktop subtitle */}
              <p className="hidden lg:block text-xs text-slate-400 dark:text-slate-500 font-medium -mt-0.5">
                Shift tracker
              </p>
              {/* Mobile: context-aware subtitle */}
              <p className="lg:hidden text-[11px] text-slate-400 dark:text-slate-500 font-medium -mt-0.5">
                {activeTab === "calendar"
                  ? `${MONTH_NAMES[month]} ${year}`
                  : activeTab === "earnings"
                  ? "Earnings"
                  : "Settings"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowReset(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 dark:text-slate-400 dark:hover:text-red-400 transition-all duration-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28 lg:pb-8">
        {/*
          Single render tree — CSS visibility controls mobile tabs.
          On lg+ all panels are visible in the grid.
        */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-4 lg:space-y-0">

          {/* Calendar panel */}
          <div className={`lg:col-span-2 animate-tab-in ${activeTab !== "calendar" ? "hidden lg:block" : ""}`}>
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
          <div className={`lg:space-y-4 ${activeTab === "calendar" ? "hidden lg:block" : ""}`}>

            {/* Settings panel */}
            <div className={`animate-tab-in ${activeTab === "earnings" ? "hidden lg:block" : ""}`}>
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
            </div>

            {/* Earnings panel */}
            <div className={`animate-tab-in ${activeTab === "settings" ? "hidden lg:block" : ""} lg:mt-4`}>
              <EarningsSummary
                shifts={shifts}
                rates={effectiveRates}
                deductions={effectiveDeductions}
                year={year}
                month={month}
              />
            </div>

          </div>
        </div>
      </main>

      {/* ── Bottom navigation (mobile only) ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-700/60">
        <div
          className="flex items-stretch"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
        >
          {(
            [
              {
                id: "calendar" as const,
                label: "Calendar",
                icon: (active: boolean) => (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.25 : 1.75}>
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                ),
              },
              {
                id: "earnings" as const,
                label: "Earnings",
                icon: (active: boolean) => (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.25 : 1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 20V10M12 20V4M6 20v-6" />
                  </svg>
                ),
              },
              {
                id: "settings" as const,
                label: "Settings",
                icon: (active: boolean) => (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.25 : 1.75}>
                    <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                    <circle cx="8"  cy="6"  r="2" fill="currentColor" stroke="none" />
                    <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none" />
                    <circle cx="8"  cy="18" r="2" fill="currentColor" stroke="none" />
                  </svg>
                ),
              },
            ] as const
          ).map(({ id, label, icon }) => {
            const active = activeTab === id;
            const badge  = id === "earnings" && !active && currentMonthShiftCount > 0
              ? currentMonthShiftCount
              : null;

            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center gap-1 pt-2.5 pb-1 relative transition-colors duration-200 ${
                  active
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-400 dark:text-slate-500 active:text-slate-600"
                }`}
              >
                {/* Active pill indicator */}
                <div
                  className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-indigo-500 transition-all duration-300 ${
                    active ? "w-8 opacity-100" : "w-0 opacity-0"
                  }`}
                />

                {/* Icon + badge */}
                <div className="relative">
                  {icon(active)}
                  {badge && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-semibold tracking-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Shift modal ── */}
      {selectedDate && (
        <ShiftModal
          date={selectedDate}
          existingShifts={shifts.filter((s) => s.date === selectedDate)}
          presets={presets}
          onSave={handleSaveShift}
          onDelete={handleDeleteShift}
          onSavePresets={setPresets}
          onClose={() => setSelectedDate(null)}
        />
      )}

      {/* ── Reset confirmation ── */}
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
