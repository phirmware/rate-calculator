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

const BREAKDOWN_ROWS: {
  type: Shift["type"];
  label: string;
  stripe: string;
  tint: string;
  getRateLabel: (rates: Rates) => string;
}[] = [
  {
    type: "normal",
    label: "Basic",
    stripe: "bg-indigo-500",
    tint: "bg-indigo-50/60 dark:bg-indigo-950/20",
    getRateLabel: (r) => `£${r.normal.toFixed(2)}/hr`,
  },
  {
    type: "holiday",
    label: "Holiday Pay",
    stripe: "bg-emerald-500",
    tint: "bg-emerald-50/60 dark:bg-emerald-950/20",
    getRateLabel: (r) => `£${r.normal.toFixed(2)}/hr`,
  },
  {
    type: "extra",
    label: "Overtime",
    stripe: "bg-amber-500",
    tint: "bg-amber-50/60 dark:bg-amber-950/20",
    getRateLabel: (r) => `£${r.extra.toFixed(2)}/hr`,
  },
  {
    type: "bankHoliday",
    label: "Bank Holiday",
    stripe: "bg-rose-500",
    tint: "bg-rose-50/60 dark:bg-rose-950/20",
    getRateLabel: (r) => `£${r.bankHoliday.toFixed(2)}/hr`,
  },
];

const DOT_COLOR: Record<Shift["type"], string> = {
  normal: "bg-indigo-500",
  holiday: "bg-emerald-500",
  extra: "bg-amber-500",
  bankHoliday: "bg-rose-500",
};

const TYPE_LABEL: Record<Shift["type"], string> = {
  normal: "Basic",
  holiday: "Holiday",
  extra: "OT",
  bankHoliday: "Bank Hol",
};

const TYPE_BADGE: Record<Shift["type"], string> = {
  normal: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400",
  holiday: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
  extra: "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
  bankHoliday: "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
};

export default function EarningsSummary({ shifts, rates, deductions, year, month }: EarningsSummaryProps) {
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthShifts = shifts
    .filter((s) => s.date.startsWith(monthStr))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const totalGross = monthShifts.reduce((sum, s) => sum + calculateShiftPay(s, rates), 0);
  const totalHours = monthShifts.reduce((sum, s) => sum + calculateShiftHours(s), 0);
  const tax: TaxBreakdown = calculateUKTax(totalGross, deductions.pensionPercent, deductions.studentLoan, deductions.taxCode || "1257L");
  const totalDeductions = tax.incomeTax + tax.nationalInsurance + tax.pension + tax.studentLoan;

  const breakdown = BREAKDOWN_ROWS.map((row) => {
    const rowShifts = monthShifts.filter((s) => s.type === row.type);
    const hours  = rowShifts.reduce((sum, s) => sum + calculateShiftHours(s), 0);
    const amount = rowShifts.reduce((sum, s) => sum + calculateShiftPay(s, rates), 0);
    return { ...row, hours, amount };
  });

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-5 space-y-4">

      {/* ── Hero stats ── */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-1 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 text-white shadow-sm shadow-emerald-500/25">
          <p className="text-[10px] font-semibold text-emerald-100/90 uppercase tracking-wider">Gross</p>
          <p className="text-lg sm:text-xl font-bold mt-0.5 tabular-nums leading-tight">£{tax.gross.toFixed(2)}</p>
        </div>
        <div className="col-span-1 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-3 text-white shadow-sm shadow-indigo-500/25">
          <p className="text-[10px] font-semibold text-indigo-100/90 uppercase tracking-wider">Net</p>
          <p className="text-lg sm:text-xl font-bold mt-0.5 tabular-nums leading-tight">£{tax.net.toFixed(2)}</p>
        </div>
        <div className="col-span-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl p-3">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hours</p>
          <p className="text-lg sm:text-xl font-bold mt-0.5 tabular-nums leading-tight text-slate-700 dark:text-slate-200">
            {totalHours.toFixed(1)}
          </p>
        </div>
      </div>

      {/* ── Pay Breakdown ── */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
          Pay Breakdown
        </p>
        <div className="rounded-xl overflow-hidden border border-slate-200/70 dark:border-slate-700/50 divide-y divide-slate-100 dark:divide-slate-700/40">
          {breakdown.map((row) => (
            <div
              key={row.type}
              className={`flex items-center gap-3 px-3 py-3 transition-opacity ${
                row.hours > 0 ? row.tint : "opacity-25 bg-white dark:bg-transparent"
              }`}
            >
              <div className={`w-1 self-stretch rounded-full shrink-0 ${row.stripe}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">{row.label}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5 tabular-nums">
                  {row.getRateLabel(rates)}
                </p>
              </div>
              <span className="text-[11px] tabular-nums font-medium text-slate-500 dark:text-slate-400 shrink-0 text-right w-[4.5rem]">
                {row.hours.toFixed(2)} hrs
              </span>
              <span className="text-sm tabular-nums font-bold text-slate-700 dark:text-slate-200 shrink-0 text-right w-16">
                £{row.amount.toFixed(2)}
              </span>
            </div>
          ))}

          {/* Total row */}
          <div className="flex items-center gap-3 px-3 py-3 bg-slate-50 dark:bg-slate-700/40">
            <div className="w-1 shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Total</p>
            </div>
            <span className="text-[11px] tabular-nums font-bold text-slate-600 dark:text-slate-300 shrink-0 text-right w-[4.5rem]">
              {totalHours.toFixed(2)} hrs
            </span>
            <span className="text-sm tabular-nums font-bold text-indigo-600 dark:text-indigo-400 shrink-0 text-right w-16">
              £{totalGross.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Deductions ── */}
      {totalDeductions > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            Deductions
          </p>
          <div className="rounded-xl overflow-hidden border border-slate-200/70 dark:border-slate-700/50 divide-y divide-slate-100 dark:divide-slate-700/40">
            {[
              { label: "Income Tax",         value: tax.incomeTax },
              { label: "National Insurance", value: tax.nationalInsurance },
              ...(tax.pension > 0     ? [{ label: `Pension (${deductions.pensionPercent}%)`, value: tax.pension }]     : []),
              ...(tax.studentLoan > 0 ? [{ label: "Student Loan",                             value: tax.studentLoan }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center px-3 py-2.5 bg-white dark:bg-slate-800/40">
                <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
                <span className="text-xs font-bold tabular-nums text-rose-500 dark:text-rose-400">
                  -£{value.toFixed(2)}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center px-3 py-2.5 bg-slate-50 dark:bg-slate-700/40">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Total deducted</span>
              <span className="text-sm font-bold tabular-nums text-rose-500 dark:text-rose-400">
                -£{totalDeductions.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Shift list ── */}
      {monthShifts.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <path d="M16 2v4M8 2v4m-5 4h18" />
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
          <div className="rounded-xl overflow-hidden border border-slate-200/70 dark:border-slate-700/50 divide-y divide-slate-100 dark:divide-slate-700/40">
            {monthShifts.map((s) => {
              const hours = calculateShiftHours(s);
              const pay   = calculateShiftPay(s, rates);
              const d     = new Date(s.date + "T00:00:00");
              return (
                <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-slate-800/40">
                  {/* Date badge */}
                  <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-700/60 flex flex-col items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/50">
                    <span className="text-[9px] text-slate-400 font-semibold leading-none uppercase">
                      {d.toLocaleDateString("en-GB", { weekday: "short" })}
                    </span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">
                      {d.getDate()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                        {s.startTime} – {s.endTime}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_BADGE[s.type]}`}>
                        {TYPE_LABEL[s.type]}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 tabular-nums">
                      {hours.toFixed(2)} hrs
                    </p>
                  </div>

                  {/* Pay */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[s.type]}`} />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                      £{pay.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Totals row */}
            <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 dark:bg-slate-700/40">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Total</p>
                <p className="text-[10px] text-slate-400 tabular-nums">{totalHours.toFixed(2)} hrs</p>
              </div>
              <span className="text-sm font-bold tabular-nums text-indigo-600 dark:text-indigo-400 shrink-0">
                £{totalGross.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
