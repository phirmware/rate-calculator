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

export function calculateUKTax(
  monthlyGross: number,
  pensionPercent: number,
  studentLoanPlan: StudentLoanPlan
): TaxBreakdown {
  // Pension is deducted before tax (salary sacrifice / relief at source)
  const monthlyPension = monthlyGross * (pensionPercent / 100);
  const taxableMonthly = monthlyGross - monthlyPension;
  const annualTaxable = taxableMonthly * 12;

  // Income Tax
  let incomeTax = 0;
  if (annualTaxable > 125140) {
    incomeTax += (annualTaxable - 125140) * 0.45;
    incomeTax += (125140 - 50270) * 0.4;
    incomeTax += (50270 - 12570) * 0.2;
  } else if (annualTaxable > 50270) {
    incomeTax += (annualTaxable - 50270) * 0.4;
    incomeTax += (50270 - 12570) * 0.2;
  } else if (annualTaxable > 12570) {
    incomeTax += (annualTaxable - 12570) * 0.2;
  }

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
