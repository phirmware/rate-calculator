export interface Shift {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: "normal" | "extra" | "bankHoliday";
}

export interface Rates {
  normal: number;
  extra: number;
  bankHoliday: number;
}

export type StudentLoanPlan = "none" | "plan1" | "plan2" | "plan4" | "plan5" | "postgrad";

export interface Deductions {
  studentLoan: StudentLoanPlan;
  pensionPercent: number; // e.g. 5 for 5%
  taxCode: string; // e.g. "1257L", "BR", "D0", "K475"
}

export interface MonthOverride {
  rates?: Rates;
  deductions?: Deductions;
}

export interface ShiftData {
  shifts: Shift[];
  rates: Rates;
  deductions: Deductions;
  monthOverrides?: Record<string, MonthOverride>; // keyed by "YYYY-MM"
}

export interface TaxBreakdown {
  gross: number;
  pension: number;
  incomeTax: number;
  nationalInsurance: number;
  studentLoan: number;
  net: number;
}
