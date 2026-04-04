"use client";

import { Shift, Rates, Deductions, TaxBreakdown } from "@/lib/types";
import { calculateShiftHours, calculateShiftPay } from "@/lib/shifts";
import { calculateUKTax } from "@/lib/tax";

interface EarningsSummaryProps {
  shifts: Shift[];
  rates: Rates;
  deductions: Deductions;
  year: number;
  month: number; // 0-indexed
}

export default function EarningsSummary({ shifts, rates, deductions, year, month }: EarningsSummaryProps) {
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthShifts = shifts
    .filter((s) => s.date.startsWith(monthStr))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const totalGross = monthShifts.reduce((sum, s) => sum + calculateShiftPay(s, rates), 0);
  const totalHours = monthShifts.reduce((sum, s) => sum + calculateShiftHours(s), 0);
  const tax: TaxBreakdown = calculateUKTax(totalGross, deductions.pensionPercent, deductions.studentLoan);

  const typeLabels: Record<string, string> = {
    normal: "Normal",
    extra: "Extra",
    bankHoliday: "Bank Hol",
  };

  const typeBadgeColors: Record<string, string> = {
    normal: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    extra: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    bankHoliday: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-5">
      <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 sm:mb-4">
        Monthly Earnings
      </h3>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2.5 sm:p-3">
          <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 font-medium">Gross</p>
          <p className="text-base sm:text-xl font-bold text-green-700 dark:text-green-300">
            &#163;{tax.gross.toFixed(2)}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 sm:p-3">
          <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium">Net (est.)</p>
          <p className="text-base sm:text-xl font-bold text-blue-700 dark:text-blue-300">
            &#163;{tax.net.toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 sm:p-3">
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Hours</p>
          <p className="text-base sm:text-xl font-bold text-gray-700 dark:text-gray-200">
            {totalHours.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Deductions breakdown */}
      <div className="space-y-1 sm:space-y-1.5 mb-5 sm:mb-6 text-xs sm:text-sm">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Income Tax</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">
            -&#163;{tax.incomeTax.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>National Insurance</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">
            -&#163;{tax.nationalInsurance.toFixed(2)}
          </span>
        </div>
        {tax.pension > 0 && (
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Pension ({deductions.pensionPercent}%)</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              -&#163;{tax.pension.toFixed(2)}
            </span>
          </div>
        )}
        {tax.studentLoan > 0 && (
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Student Loan</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">
              -&#163;{tax.studentLoan.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Shifts table */}
      {monthShifts.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No shifts this month</p>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium text-right">Hours</th>
                <th className="pb-2 font-medium text-right">Pay</th>
              </tr>
            </thead>
            <tbody>
              {monthShifts.map((s) => {
                const hours = calculateShiftHours(s);
                const pay = calculateShiftPay(s, rates);
                const dayOnly = s.date.slice(5); // MM-DD
                return (
                  <tr
                    key={s.id}
                    className="border-b border-gray-100 dark:border-gray-700/50"
                  >
                    <td className="py-2 text-gray-700 dark:text-gray-300">
                      <span className="sm:hidden">{dayOnly}</span>
                      <span className="hidden sm:inline">{s.date}</span>
                    </td>
                    <td className="py-2">
                      <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${typeBadgeColors[s.type]}`}>
                        {typeLabels[s.type]}
                      </span>
                    </td>
                    <td className="py-2 text-right text-gray-700 dark:text-gray-300">
                      {hours.toFixed(1)}h
                    </td>
                    <td className="py-2 text-right font-medium text-gray-800 dark:text-gray-200">
                      &#163;{pay.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                <td className="py-2 font-semibold text-gray-800 dark:text-gray-200" colSpan={2}>
                  Total
                </td>
                <td className="py-2 text-right font-semibold text-gray-800 dark:text-gray-200">
                  {totalHours.toFixed(1)}h
                </td>
                <td className="py-2 text-right font-semibold text-gray-800 dark:text-gray-200">
                  &#163;{totalGross.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
