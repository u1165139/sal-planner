// ─── CONSTANTS: Australian Tax Rates 2025-26 ─────────────────────────────────

export const COMPANY_TAX_RATE = 0.25;
export const MEDICARE_THRESHOLD = 18200;
export const MEDICARE_RATE = 0.02;
export const SUPER_CAP = 30000; // Concessional cap 2025-26
export const SUPER_RATE = 0.115; // 11.5% SGC

export const PERSONAL_BRACKETS: { min: number; max: number; rate: number }[] = [
  { min: 0,      max: 18200,    rate: 0    },
  { min: 18201,  max: 45000,    rate: 0.16 },
  { min: 45001,  max: 135000,   rate: 0.30 },
  { min: 135001, max: 190000,   rate: 0.37 },
  { min: 190001, max: Infinity, rate: 0.45 },
];

// ─── TAX HELPERS ─────────────────────────────────────────────────────────────

export function calcPersonalIncomeTax(income: number): number {
  if (income <= 0) return 0;
  let tax = 0;
  for (const { min, max, rate } of PERSONAL_BRACKETS) {
    if (income <= min - 1) break;
    const taxable = Math.min(income, max) - (min - 1);
    tax += taxable * rate;
  }
  return tax;
}

export function calcMedicare(income: number): number {
  if (income <= MEDICARE_THRESHOLD) return 0;
  return (income - MEDICARE_THRESHOLD) * MEDICARE_RATE;
}

export function calcTotalPersonalTax(income: number): number {
  return calcPersonalIncomeTax(income) + calcMedicare(income);
}

// ─── INPUT / OUTPUT TYPES ─────────────────────────────────────────────────────

export interface CalcInputs {
  businessIncomeGST: number;
  deductibleExpenses: number;
  monthlyLiving: number;
  monthlyRepayments: number;
  monthlyAdditionalPurchase: number;
  interestIncome: number;
  propertyIncome: number;
  maximiseSuper: boolean;
}

export interface CalcResults {
  // Derived inputs
  businessRevenue: number;
  netBusinessProfit: number;
  requiredAnnualCash: number;
  availableNonSalaryCash: number;
  cashShortfall: number;
  basePersonalTaxableIncome: number;
  // Negative gearing
  annualAdditionalPurchaseLoss: number;
  negativeGearingRefund: number;
  // Recommended salary
  recommendedSalary: number;
  superContribution: number;
  // Company tax
  companyTaxableProfit: number;
  companyTax: number;
  companyAfterTaxProfit: number;
  // Personal tax
  personalTaxTotal: number;
  personalTaxOnSalary: number;
  totalPersonalTaxableIncome: number;
  // Summary
  totalTax: number;
  effectivePersonalRate: number;
  effectiveCompanyRate: number;
  // Cash flow
  afterTaxSalary: number;
  totalCashAvailable: number;
  cashSurplusDeficit: number;
}

// ─── CORE CALCULATION ENGINE ──────────────────────────────────────────────────

export function optimize(inputs: CalcInputs): CalcResults {
  const {
    businessIncomeGST,
    deductibleExpenses,
    monthlyLiving,
    monthlyRepayments,
    monthlyAdditionalPurchase,
    interestIncome,
    propertyIncome,
    maximiseSuper,
  } = inputs;

  // ── Base calculations ──────────────────────────────────────────────────────
  const businessRevenue = businessIncomeGST / 1.1;
  const netBusinessProfit = businessRevenue - deductibleExpenses;
  const requiredAnnualCash = (monthlyLiving + monthlyRepayments + monthlyAdditionalPurchase) * 12;
  const basePersonalTaxableIncome = interestIncome + propertyIncome;

  // ── Negative gearing on additional purchase ────────────────────────────────
  // The out-of-pocket amount is a negatively geared loss deducted from personal
  // taxable income, generating a tax refund that is real spendable cash.
  const annualAdditionalPurchaseLoss = monthlyAdditionalPurchase * 12;

  // We need to know the refund before we know the salary (since it affects the
  // shortfall), so we estimate it using base income only first, then refine
  // after the salary is known. Because the refund depends on the marginal rate
  // at (salary + base - loss), we solve this inside the binary search below.

  // ── Binary search for recommended salary ──────────────────────────────────
  // After-tax cash = after-tax salary + interest income + negative gearing refund
  // We need this total >= requiredAnnualCash.
  // The refund itself depends on the salary (it shifts which marginal bracket
  // the loss is valued at), so we compute it inside the search.

  const availableNonSalaryCash = interestIncome;

  let recommendedSalary = 0;

  // Helper: given a gross salary, compute the negative gearing refund and
  // after-tax salary so we can check if total cash covers the requirement.
  const computeCash = (salary: number) => {
    const grossIncome = salary + basePersonalTaxableIncome;
    // Tax without the negative gearing deduction
    const taxWithout = calcTotalPersonalTax(grossIncome);
    // Tax with the negative gearing deduction applied
    const taxWith = calcTotalPersonalTax(Math.max(0, grossIncome - annualAdditionalPurchaseLoss));
    const ngRefund = taxWithout - taxWith;
    const taxOnBaseOnly = calcTotalPersonalTax(basePersonalTaxableIncome);
    const personalTaxOnSalary = taxWithout - taxOnBaseOnly;
    const afterTax = salary - personalTaxOnSalary;
    return { afterTax, ngRefund };
  };

  const totalCashNeeded = requiredAnnualCash;

  // Check if zero salary already covers needs (e.g. large NG refund on base income)
  const { afterTax: afterTaxAt0, ngRefund: ngAt0 } = computeCash(0);
  const cashAt0 = afterTaxAt0 + availableNonSalaryCash + ngAt0;

  if (cashAt0 < totalCashNeeded) {
    let lo = 0;
    let hi = Math.max(netBusinessProfit, 1_000_000);
    for (let i = 0; i < 120; i++) {
      const mid = (lo + hi) / 2;
      const { afterTax, ngRefund } = computeCash(mid);
      const totalCash = afterTax + availableNonSalaryCash + ngRefund;
      if (totalCash < totalCashNeeded) lo = mid;
      else hi = mid;
    }
    recommendedSalary = (lo + hi) / 2;
  }

  // Cap at net business profit
  recommendedSalary = Math.min(Math.max(0, recommendedSalary), Math.max(0, netBusinessProfit));

  // ── Super adjustment ───────────────────────────────────────────────────────
  let superContribution = 0;
  if (maximiseSuper) {
    const maxSalaryWithSuper = Math.max(0, netBusinessProfit) / (1 + SUPER_RATE);
    recommendedSalary = Math.min(recommendedSalary, maxSalaryWithSuper);
    superContribution = Math.min(recommendedSalary * SUPER_RATE, SUPER_CAP);
  }

  // ── Final tax calculations ─────────────────────────────────────────────────
  const grossIncome = recommendedSalary + basePersonalTaxableIncome;

  // Personal tax before negative gearing deduction
  const personalTaxWithout = calcTotalPersonalTax(grossIncome);
  // Personal tax after negative gearing deduction
  const personalTaxWith = calcTotalPersonalTax(Math.max(0, grossIncome - annualAdditionalPurchaseLoss));
  const negativeGearingRefund = personalTaxWithout - personalTaxWith;

  // The actual tax paid is after the refund is applied
  const personalTaxTotal = personalTaxWith;

  const personalTaxOnBaseOnly = calcTotalPersonalTax(basePersonalTaxableIncome);
  const personalTaxOnSalary   = personalTaxWithout - personalTaxOnBaseOnly;

  const totalPersonalTaxableIncome = Math.max(0, grossIncome - annualAdditionalPurchaseLoss);

  const companyTaxableProfit  = Math.max(0, netBusinessProfit - recommendedSalary - superContribution);
  const companyTax            = companyTaxableProfit * COMPANY_TAX_RATE;
  const companyAfterTaxProfit = companyTaxableProfit - companyTax;

  const afterTaxSalary     = recommendedSalary - personalTaxOnSalary;
  const totalCashAvailable = afterTaxSalary + availableNonSalaryCash + negativeGearingRefund;
  const cashShortfall      = Math.max(0, requiredAnnualCash - availableNonSalaryCash - negativeGearingRefund);
  const cashSurplusDeficit = totalCashAvailable - requiredAnnualCash;
  const totalTax           = companyTax + personalTaxTotal;

  return {
    businessRevenue,
    netBusinessProfit,
    requiredAnnualCash,
    availableNonSalaryCash,
    cashShortfall,
    basePersonalTaxableIncome,
    annualAdditionalPurchaseLoss,
    negativeGearingRefund,
    recommendedSalary,
    superContribution,
    companyTaxableProfit,
    companyTax,
    companyAfterTaxProfit,
    personalTaxTotal,
    personalTaxOnSalary,
    totalPersonalTaxableIncome,
    totalTax,
    effectivePersonalRate:
      grossIncome > 0 ? (personalTaxTotal / grossIncome) * 100 : 0,
    effectiveCompanyRate:
      netBusinessProfit > 0 ? (companyTax / netBusinessProfit) * 100 : 0,
    afterTaxSalary,
    totalCashAvailable,
    cashSurplusDeficit,
  };
}

// ─── FORMAT HELPERS ───────────────────────────────────────────────────────────

export const fmt = (n: number): string =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

export const fmtPct = (n: number): string => `${n.toFixed(1)}%`;
