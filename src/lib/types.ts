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

export type PresetIcon = "sun" | "moon" | "sunrise" | "clock" | "star" | "zap";

export interface ShiftPreset {
  id: string;
  label: string;
  start: string; // HH:mm
  end: string;   // HH:mm
  icon: PresetIcon;
}

export interface ShiftData {
  shifts: Shift[];
  rates: Rates;
  deductions: Deductions;
  monthOverrides?: Record<string, MonthOverride>; // keyed by "YYYY-MM"
  presets?: ShiftPreset[];
}

export interface TaxBreakdown {
  gross: number;
  pension: number;
  incomeTax: number;
  nationalInsurance: number;
  studentLoan: number;
  net: number;
}
