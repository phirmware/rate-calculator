"use client";

import { Shift, Rates, Deductions, TaxBreakdown } from "@/lib/types";
import { calculateShiftHours, calculateShiftPay } from "@/lib/shifts";
import { calculateUKTax } from "@/lib/tax";

interface EarningsSummaryProps {
  shifts: Shift[];
  rates: Rates;
  deductions: Deductions;
  year: number;
  month: number;
}

export default function EarningsSummary({ shifts, rates, deductions, year, month }: EarningsSummaryProps) {
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthShifts = shifts
    .filter((s) => s.date.startsWith(monthStr))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const totalGross = monthShifts.reduce((sum, s) => sum + calculateShiftPay(s, rates), 0);
  const totalHours = monthShifts.reduce((sum, s) => sum + calculateShiftHours(s), 0);
  const tax: TaxBreakdown = calculateUKTax(totalGross, deductions.pensionPercent, deductions.studentLoan, deductions.taxCode || "1257L");

  const typeLabels: Record<string, string> = {
    normal: "Normal",
    extra: "Extra",
    bankHoliday: "Bank Hol",
  };

  const typeDotColors: Record<string, string> = {
    normal: "bg-indigo-500",
    extra: "bg-amber-500",
    bankHoliday: "bg-rose-500",
  };

  const totalDeductions = tax.incomeTax + tax.nationalInsurance + tax.pension + tax.studentLoan;

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-5">

      {/* Hero stats */}
      <div className="flex items-stretch gap-2 sm:gap-3 mb-4">
        {/* Gross */}
        <div className="flex-1 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 sm:p-3.5 text-white shadow-sm shadow-emerald-500/20">
          <p className="text-[10px] sm:text-xs font-medium text-emerald-100">Gross</p>
          <p className="text-lg sm:text-2xl font-bold mt-0.5">
            &#163;{tax.gross.toFixed(2)}
          </p>
        </div>
        {/* Net */}
        <div className="flex-1 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-3 sm:p-3.5 text-white shadow-sm shadow-indigo-500/20">
          <p className="text-[10px] sm:text-xs font-medium text-indigo-100">Net (est.)</p>
          <p className="text-lg sm:text-2xl font-bold mt-0.5">
            &#163;{tax.net.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Hours + shifts count */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 bg-slate-50 dark:bg-slate-700/30 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-200/70 dark:bg-slate-600/50 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium">Hours</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{totalHours.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex-1 bg-slate-50 dark:bg-slate-700/30 rounded-xl px-3 py-2.5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-200/70 dark:bg-slate-600/50 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><path d="M16 2v4M8 2v4m-5 4h18" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium">Shifts</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{monthShifts.length}</p>
          </div>
        </div>
      </div>

      {/* Deductions breakdown */}
      {totalDeductions > 0 && (
        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3 mb-4">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            Deductions
          </p>
          <div className="space-y-1.5">
            {[
              { label: "Income Tax", value: tax.incomeTax },
              { label: "National Insurance", value: tax.nationalInsurance },
              ...(tax.pension > 0 ? [{ label: `Pension (${deductions.pensionPercent}%)`, value: tax.pension }] : []),
              ...(tax.studentLoan > 0 ? [{ label: "Student Loan", value: tax.studentLoan }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  -&#163;{value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shifts list */}
      {monthShifts.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><path d="M16 2v4M8 2v4m-5 4h18" />
            </svg>
          </div>
          <p className="text-sm text-slate-400 font-medium">No shifts this month</p>
          <p className="text-xs text-slate-300 dark:text-slate-600 mt-0.5">Tap a day to add one</p>
        </div>
      ) : (
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            Shifts
          </p>
          <div className="space-y-1.5">
            {monthShifts.map((s) => {
              const hours = calculateShiftHours(s);
              const pay = calculateShiftPay(s, rates);
              const d = new Date(s.date + "T00:00:00");
              const dayNum = d.getDate();
              const dayName = d.toLocaleDateString("en-GB", { weekday: "short" });
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 py-2 px-1 group"
                >
                  {/* Date badge */}
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700/40 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] text-slate-400 font-medium leading-none">{dayName}</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">{dayNum}</span>
                  </div>

                  {/* Shift info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${typeDotColors[s.type]}`} />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {s.startTime} – {s.endTime}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {typeLabels[s.type]}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 pl-3">{hours.toFixed(2)} hrs</p>
                  </div>

                  {/* Pay */}
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 shrink-0">
                    &#163;{pay.toFixed(2)}
                  </span>
                </div>
              );
            })}

            {/* Totals */}
            <div className="flex items-center gap-3 pt-2 mt-1 border-t-2 border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Total</span>
                <p className="text-[11px] text-slate-400">{totalHours.toFixed(2)} hrs</p>
              </div>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                &#163;{totalGross.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
