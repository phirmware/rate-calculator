import { Shift, Rates } from "./types";

export function calculateShiftHours(shift: Shift): number {
  const [startH, startM] = shift.startTime.split(":").map(Number);
  const [endH, endM] = shift.endTime.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  // Handle overnight shifts
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return (endMinutes - startMinutes) / 60;
}

export function calculateShiftPay(shift: Shift, rates: Rates): number {
  const hours = calculateShiftHours(shift);
  const ratePerHour =
    shift.type === "normal"      ? rates.normal      :
    shift.type === "holiday"     ? rates.normal      : // holiday uses basic rate
    shift.type === "extra"       ? rates.extra       :
                                   rates.bankHoliday;
  return Math.round(hours * ratePerHour * 100) / 100;
}

export function calculateMonthlyEarnings(
  shifts: Shift[],
  rates: Rates,
  year: number,
  month: number
): number {
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthShifts = shifts.filter((s) => s.date.startsWith(monthStr));
  return monthShifts.reduce((total, shift) => total + calculateShiftPay(shift, rates), 0);
}
