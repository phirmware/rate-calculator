import { TaxBreakdown, StudentLoanPlan } from "./types";

// Student loan annual thresholds and rates (2024/25)
const STUDENT_LOAN_CONFIG: Record<
  Exclude<StudentLoanPlan, "none">,
  { threshold: number; rate: number }
> = {
  plan1: { threshold: 22015, rate: 0.09 },
  plan2: { threshold: 27295, rate: 0.09 },
  plan4: { threshold: 27660, rate: 0.09 },
  plan5: { threshold: 25000, rate: 0.09 },
  postgrad: { threshold: 21000, rate: 0.06 },
};

/**
 * Parse a UK tax code and return the personal allowance and any special tax mode.
 *
 * Common formats:
 *   "1257L"  → personal allowance = 1257 * 10 = £12,570
 *   "1100M"  → marriage allowance received, PA = £11,000
 *   "K475"   → negative allowance, adds £4,750 to taxable income
 *   "BR"     → all income at 20% (basic rate), no allowance
 *   "D0"     → all income at 40% (higher rate)
 *   "D1"     → all income at 45% (additional rate)
 *   "NT"     → no tax
 *   "0T"     → zero personal allowance
 *   "S1257L" → Scottish (we ignore the S prefix, use same bands for simplicity)
 *   "C1257L" → Welsh (same treatment)
 */
export function parseTaxCode(code: string): {
  personalAllowance: number;
  mode: "normal" | "BR" | "D0" | "D1" | "NT" | "K";
  kAmount: number; // Only used when mode is "K"
} {
  const cleaned = code.trim().toUpperCase();

  // Strip S (Scottish) or C (Welsh) prefix — we use the same bands for simplicity
  const stripped = cleaned.replace(/^[SC]/, "");

  // Special flat-rate codes
  if (stripped === "BR") return { personalAllowance: 0, mode: "BR", kAmount: 0 };
  if (stripped === "D0") return { personalAllowance: 0, mode: "D0", kAmount: 0 };
  if (stripped === "D1") return { personalAllowance: 0, mode: "D1", kAmount: 0 };
  if (stripped === "NT") return { personalAllowance: 0, mode: "NT", kAmount: 0 };

  // 0T — zero personal allowance
  if (stripped === "0T") return { personalAllowance: 0, mode: "normal", kAmount: 0 };

  // K code — negative allowance (adds to taxable income)
  const kMatch = stripped.match(/^K(\d+)$/);
  if (kMatch) {
    const kAmount = parseInt(kMatch[1], 10) * 10;
    return { personalAllowance: 0, mode: "K", kAmount };
  }

  // Standard codes: number followed by letter(s) e.g. 1257L, 1100M, 1257N, 1257T
  const stdMatch = stripped.match(/^(\d+)[LMNT]$/);
  if (stdMatch) {
    const pa = parseInt(stdMatch[1], 10) * 10;
    return { personalAllowance: pa, mode: "normal", kAmount: 0 };
  }

  // Fallback: try to extract a number, default to standard
  const numMatch = stripped.match(/(\d+)/);
  if (numMatch) {
    const pa = parseInt(numMatch[1], 10) * 10;
    return { personalAllowance: pa, mode: "normal", kAmount: 0 };
  }

  // Unrecognised — default to standard 1257L
  return { personalAllowance: 12570, mode: "normal", kAmount: 0 };
}

export function calculateUKTax(
  monthlyGross: number,
  pensionPercent: number,
  studentLoanPlan: StudentLoanPlan,
  taxCode: string
): TaxBreakdown {
  const { personalAllowance, mode, kAmount } = parseTaxCode(taxCode);

  // Pension is deducted before tax (salary sacrifice / relief at source)
  const monthlyPension = monthlyGross * (pensionPercent / 100);
  const taxableMonthly = monthlyGross - monthlyPension;
  const annualTaxable = taxableMonthly * 12;

  // Income Tax
  let incomeTax = 0;

  if (mode === "NT") {
    // No tax
    incomeTax = 0;
  } else if (mode === "BR") {
    // All taxable income at basic rate
    incomeTax = annualTaxable * 0.2;
  } else if (mode === "D0") {
    // All taxable income at higher rate
    incomeTax = annualTaxable * 0.4;
  } else if (mode === "D1") {
    // All taxable income at additional rate
    incomeTax = annualTaxable * 0.45;
  } else {
    // Normal or K code — apply bands with personal allowance
    let taxableAfterPA = annualTaxable - personalAllowance;

    // K code: add the K amount to taxable income instead
    if (mode === "K") {
      taxableAfterPA = annualTaxable + kAmount;
    }

    if (taxableAfterPA > 0) {
      // Additional rate: above £125,140
      const additionalThreshold = 125140 - personalAllowance;
      // Higher rate: above £50,270
      const higherThreshold = 50270 - personalAllowance;

      if (taxableAfterPA > additionalThreshold && additionalThreshold > 0) {
        incomeTax += (taxableAfterPA - Math.max(additionalThreshold, 0)) * 0.45;
        incomeTax += (Math.min(taxableAfterPA, additionalThreshold) - Math.max(higherThreshold, 0)) * 0.4;
        if (higherThreshold > 0) {
          incomeTax += Math.min(taxableAfterPA, higherThreshold) * 0.2;
        }
      } else if (taxableAfterPA > higherThreshold && higherThreshold > 0) {
        incomeTax += (taxableAfterPA - higherThreshold) * 0.4;
        incomeTax += higherThreshold * 0.2;
      } else {
        incomeTax += taxableAfterPA * 0.2;
      }
    }
  }

  if (incomeTax < 0) incomeTax = 0;

  // National Insurance (based on gross, not post-pension)
  const annualGross = monthlyGross * 12;
  let nationalInsurance = 0;
  if (annualGross > 50270) {
    nationalInsurance += (annualGross - 50270) * 0.02;
    nationalInsurance += (50270 - 12570) * 0.08;
  } else if (annualGross > 12570) {
    nationalInsurance += (annualGross - 12570) * 0.08;
  }

  // Student Loan (based on gross income)
  let studentLoan = 0;
  if (studentLoanPlan !== "none") {
    const config = STUDENT_LOAN_CONFIG[studentLoanPlan];
    if (annualGross > config.threshold) {
      studentLoan = (annualGross - config.threshold) * config.rate;
    }
  }

  // Convert back to monthly
  const monthlyTax = incomeTax / 12;
  const monthlyNI = nationalInsurance / 12;
  const monthlyStudentLoan = studentLoan / 12;
  const net = monthlyGross - monthlyPension - monthlyTax - monthlyNI - monthlyStudentLoan;

  const round = (n: number) => Math.round(n * 100) / 100;

  return {
    gross: round(monthlyGross),
    pension: round(monthlyPension),
    incomeTax: round(monthlyTax),
    nationalInsurance: round(monthlyNI),
    studentLoan: round(monthlyStudentLoan),
    net: round(net),
  };
}
