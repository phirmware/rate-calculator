"use client";

import { useState } from "react";
import { Rates, Deductions, StudentLoanPlan } from "@/lib/types";

interface RatesPanelProps {
  rates: Rates;
  deductions: Deductions;
  onSaveRates: (rates: Rates) => void;
  onSaveDeductions: (deductions: Deductions) => void;
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
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const n = parseFloat(normal);
    const e = parseFloat(extra);
    const b = parseFloat(bankHoliday);
    const p = parseFloat(pensionPercent);

    if (isNaN(n) || isNaN(e) || isNaN(b) || n <= 0 || e <= 0 || b <= 0) return;
    if (isNaN(p) || p < 0 || p > 100) return;

    onSaveRates({ normal: n, extra: e, bankHoliday: b });
    onSaveDeductions({ pensionPercent: p, studentLoan });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-5">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4">Settings</h3>
      <div className="space-y-3">
        {/* Hourly Rates */}
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
          Hourly Rates
        </p>
        {[
          { label: "Normal", value: normal, setter: setNormal, dot: "bg-blue-500" },
          { label: "Extra", value: extra, setter: setExtra, dot: "bg-amber-500" },
          { label: "Bank Holiday", value: bankHoliday, setter: setBankHoliday, dot: "bg-red-500" },
        ].map(({ label, value, setter, dot }) => (
          <div key={label}>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              <span className={`inline-block w-2 h-2 rounded-full ${dot} mr-2`} />
              {label} (per hour)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">&#163;</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-7 pr-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
            </div>
          </div>
        ))}

        {/* Deductions */}
        <div className="pt-2">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
            Deductions
          </p>

          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
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
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg pl-3 pr-7 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Deducted before income tax</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Student Loan
            </label>
            <select
              value={studentLoan}
              onChange={(e) => setStudentLoan(e.target.value as StudentLoanPlan)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              {STUDENT_LOAN_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`w-full py-2 rounded-lg font-medium transition-colors ${
            saved
              ? "bg-green-500 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {saved ? "Saved!" : "Update Settings"}
        </button>
      </div>
    </div>
  );
}
