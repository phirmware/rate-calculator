"use client";

import { useState } from "react";
import { Rates, Deductions, StudentLoanPlan } from "@/lib/types";
import { parseTaxCode } from "@/lib/tax";

interface RatesPanelProps {
  rates: Rates;
  deductions: Deductions;
  onSaveRates: (rates: Rates) => void;
  onSaveDeductions: (deductions: Deductions) => void;
}

function TaxCodeHint({ code }: { code: string }) {
  const parsed = parseTaxCode(code);
  let hint = "";
  if (parsed.mode === "BR") hint = "All income taxed at 20%";
  else if (parsed.mode === "D0") hint = "All income taxed at 40%";
  else if (parsed.mode === "D1") hint = "All income taxed at 45%";
  else if (parsed.mode === "NT") hint = "No tax deducted";
  else if (parsed.mode === "K") hint = `Adds \u00A3${parsed.kAmount.toLocaleString()} to taxable income`;
  else hint = `Tax-free allowance: \u00A3${parsed.personalAllowance.toLocaleString()}`;
  return <p className="text-[10px] text-slate-400 mt-1 ml-0.5">{hint}</p>;
}

const STUDENT_LOAN_OPTIONS: { value: StudentLoanPlan; label: string }[] = [
  { value: "none", label: "None" },
  { value: "plan1", label: "Plan 1 (pre-2012)" },
  { value: "plan2", label: "Plan 2 (post-2012)" },
  { value: "plan4", label: "Plan 4 (Scotland)" },
  { value: "plan5", label: "Plan 5 (post-2023)" },
  { value: "postgrad", label: "Postgraduate" },
];

export default function RatesPanel({
  rates, deductions, onSaveRates, onSaveDeductions,
}: RatesPanelProps) {
  const [normal, setNormal] = useState(rates.normal.toString());
  const [extra, setExtra] = useState(rates.extra.toString());
  const [bankHoliday, setBankHoliday] = useState(rates.bankHoliday.toString());
  const [pensionPercent, setPensionPercent] = useState(deductions.pensionPercent.toString());
  const [studentLoan, setStudentLoan] = useState<StudentLoanPlan>(deductions.studentLoan);
  const [taxCode, setTaxCode] = useState(deductions.taxCode || "1257L");
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(false);

  function handleSave() {
    const n = parseFloat(normal);
    const e = parseFloat(extra);
    const b = parseFloat(bankHoliday);
    const p = parseFloat(pensionPercent);

    if (isNaN(n) || isNaN(e) || isNaN(b) || n <= 0 || e <= 0 || b <= 0) return;
    if (isNaN(p) || p < 0 || p > 100) return;

    onSaveRates({ normal: n, extra: e, bankHoliday: b });
    onSaveDeductions({ pensionPercent: p, studentLoan, taxCode: taxCode.trim() || "1257L" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
      {/* Collapsible header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">Settings</h3>
            <p className="text-[11px] text-slate-400">Rates &amp; deductions</p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Collapsible content */}
      {open && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
          {/* Hourly Rates */}
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Hourly Rates
          </p>
          <div className="space-y-2.5">
            {[
              { label: "Normal", value: normal, setter: setNormal, color: "bg-indigo-500" },
              { label: "Extra", value: extra, setter: setExtra, color: "bg-amber-500" },
              { label: "Bank Holiday", value: bankHoliday, setter: setBankHoliday, color: "bg-rose-500" },
            ].map(({ label, value, setter, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${color} shrink-0`} />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-20 shrink-0">{label}</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">&#163;</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    className="w-full rounded-lg pl-7 pr-3 py-2 text-sm font-medium bg-slate-50 dark:bg-slate-700/50 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-slate-200 outline-none transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Deductions */}
          <div className="pt-2">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              Deductions
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Tax Code
                </label>
                <input
                  type="text"
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value.toUpperCase())}
                  placeholder="1257L"
                  maxLength={10}
                  className="w-full rounded-lg px-3 py-2 text-sm font-medium bg-slate-50 dark:bg-slate-700/50 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-slate-200 outline-none transition-colors uppercase tracking-wider"
                />
                <TaxCodeHint code={taxCode} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Pension Contribution
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={pensionPercent}
                    onChange={(e) => setPensionPercent(e.target.value)}
                    className="w-full rounded-lg pl-3 pr-8 py-2 text-sm font-medium bg-slate-50 dark:bg-slate-700/50 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-slate-200 outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 ml-0.5">Pre-tax deduction</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  Student Loan
                </label>
                <select
                  value={studentLoan}
                  onChange={(e) => setStudentLoan(e.target.value as StudentLoanPlan)}
                  className="w-full rounded-lg px-3 py-2 text-sm font-medium bg-slate-50 dark:bg-slate-700/50 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 text-slate-800 dark:text-slate-200 outline-none transition-colors appearance-none"
                >
                  {STUDENT_LOAN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
              saved
                ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                : "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm shadow-indigo-500/20 hover:from-indigo-600 hover:to-indigo-700"
            }`}
          >
            {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      )}
    </div>
  );
}
