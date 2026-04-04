import {
  COMPANY_TAX_RATE,
  MEDICARE_THRESHOLD,
  MEDICARE_SHADING_RATE,
  MEDICARE_RATE,
  SUPER_CAP,
  SUPER_RATE,
  PERSONAL_BRACKETS,
} from './constants';
import type { CalcInputs, CalcResults } from './types';

const ensureNumber = (n: number) => (isFinite(n) ? n : 0);

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

  // Calculate the two possible levy amounts
  const shadingLevy = (income - MEDICARE_THRESHOLD) * MEDICARE_SHADING_RATE;
  const fullLevy = income * MEDICARE_RATE;

  // The ATO charges the smaller of the two
  return Math.min(shadingLevy, fullLevy);
}

export function calcTotalPersonalTax(income: number): number {
  return calcPersonalIncomeTax(income) + calcMedicare(income);
}

// ─── CORE CALCULATION ENGINE ──────────────────────────────────────────────────

export function calculateTaxStrategy(inputs: CalcInputs): CalcResults {
  const {
    businessIncomeGST,
    deductibleExpenses,
    monthlyLiving,
    monthlyRepayments,
    monthlyDeductibleInvestmentLoss,
    interestIncome,
    propertyIncome,
    maximiseSuper,
  } = inputs;

  // ── Base calculations ──────────────────────────────────────────────────────
  const businessRevenue = businessIncomeGST / 1.1;
  const netBusinessProfit = businessRevenue - deductibleExpenses;
  const requiredAnnualCash = (monthlyLiving + monthlyRepayments + monthlyDeductibleInvestmentLoss) * 12;
  const basePersonalTaxableIncome = interestIncome + propertyIncome;

  // ── Negative gearing on investment loss ────────────────────────────────
  const annualDeductibleInvestmentLoss = monthlyDeductibleInvestmentLoss * 12;

  // ── Binary search for recommended salary ──────────────────────────────────
  const availableNonSalaryCash = interestIncome;
  let recommendedSalary = 0;

  const computeCash = (salary: number) => {
    const grossIncome = salary + basePersonalTaxableIncome;
    const taxWithout = calcTotalPersonalTax(grossIncome);
    const taxWith = calcTotalPersonalTax(Math.max(0, grossIncome - annualDeductibleInvestmentLoss));
    const ngRefund = taxWithout - taxWith;
    const taxOnBaseOnly = calcTotalPersonalTax(basePersonalTaxableIncome);
    const personalTaxOnSalary = taxWithout - taxOnBaseOnly;
    const afterTax = salary - personalTaxOnSalary;
    return { afterTax, ngRefund };
  };

  const totalCashNeeded = requiredAnnualCash;
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

  recommendedSalary = Math.min(Math.max(0, recommendedSalary), Math.max(0, netBusinessProfit));

  // ── Super adjustment ───────────────────────────────────────────────────────
  let superContribution = 0;
  if (maximiseSuper) {
    const maxSalaryWithSuper = Math.max(0, netBusinessProfit) / (1 + SUPER_RATE);
    recommendedSalary = Math.min(recommendedSalary, maxSalaryWithSuper);
    superContribution = Math.min(recommendedSalary * SUPER_RATE, SUPER_CAP);
  }

  // ── Final tax calculations ─────────────────────────────────────────────────
  const companyTaxableProfit = Math.max(0, netBusinessProfit - recommendedSalary - superContribution);
  const companyTax = companyTaxableProfit * COMPANY_TAX_RATE;
  const companyAfterTaxProfit = companyTaxableProfit - companyTax;

  let netDividend = 0;
  let frankingCredit = 0;
  let grossedUpDividend = 0;
  let dividendTopUpTax = 0;

  if (inputs.drawDividend) {
    netDividend = companyAfterTaxProfit;
    frankingCredit = netDividend * (COMPANY_TAX_RATE / (1 - COMPANY_TAX_RATE));
    grossedUpDividend = netDividend + frankingCredit;
  }

  const grossIncome = recommendedSalary + basePersonalTaxableIncome + grossedUpDividend;
  const personalTaxWithout = calcTotalPersonalTax(grossIncome);
  const personalTaxWith = calcTotalPersonalTax(Math.max(0, grossIncome - annualDeductibleInvestmentLoss));
  
  if (inputs.drawDividend) {
    const baseTaxWithoutDiv = calcTotalPersonalTax(Math.max(0, recommendedSalary + basePersonalTaxableIncome - annualDeductibleInvestmentLoss));
    dividendTopUpTax = Math.max(0, personalTaxWith - baseTaxWithoutDiv - frankingCredit);
  }

  const negativeGearingRefund = personalTaxWithout - personalTaxWith;
  let personalTaxTotal = personalTaxWith - frankingCredit;
  if (personalTaxTotal < 0) personalTaxTotal = 0;
  
  const personalTaxOnBaseOnly = calcTotalPersonalTax(basePersonalTaxableIncome);
  const personalTaxOnSalary = personalTaxWithout - personalTaxOnBaseOnly;
  const totalPersonalTaxableIncome = Math.max(0, grossIncome - annualDeductibleInvestmentLoss);

  const afterTaxSalary = recommendedSalary - personalTaxOnSalary;
  const totalCashAvailable = afterTaxSalary + availableNonSalaryCash + negativeGearingRefund + netDividend - dividendTopUpTax;
  const cashShortfall = Math.max(0, requiredAnnualCash - availableNonSalaryCash - negativeGearingRefund - (netDividend - dividendTopUpTax));
  const cashSurplusDeficit = totalCashAvailable - requiredAnnualCash;
  const totalTax = companyTax + personalTaxTotal;
  const isHighTaxBracket = totalPersonalTaxableIncome > 190000;

  return {
    businessRevenue: ensureNumber(businessRevenue),
    netBusinessProfit: ensureNumber(netBusinessProfit),
    requiredAnnualCash: ensureNumber(requiredAnnualCash),
    availableNonSalaryCash: ensureNumber(availableNonSalaryCash),
    cashShortfall: ensureNumber(cashShortfall),
    basePersonalTaxableIncome: ensureNumber(basePersonalTaxableIncome),
    annualDeductibleInvestmentLoss: ensureNumber(annualDeductibleInvestmentLoss),
    negativeGearingRefund: ensureNumber(negativeGearingRefund),
    recommendedSalary: ensureNumber(recommendedSalary),
    superContribution: ensureNumber(superContribution),
    companyTaxableProfit: ensureNumber(companyTaxableProfit),
    companyTax: ensureNumber(companyTax),
    companyAfterTaxProfit: ensureNumber(companyAfterTaxProfit),
    personalTaxTotal: ensureNumber(personalTaxTotal),
    personalTaxOnSalary: ensureNumber(personalTaxOnSalary),
    totalPersonalTaxableIncome: ensureNumber(totalPersonalTaxableIncome),
    totalTax: ensureNumber(totalTax),
    effectivePersonalRate: ensureNumber((personalTaxTotal / grossIncome) * 100),
    effectiveCompanyRate: ensureNumber((companyTax / netBusinessProfit) * 100),
    afterTaxSalary: ensureNumber(afterTaxSalary),
    totalCashAvailable: ensureNumber(totalCashAvailable),
    cashSurplusDeficit: ensureNumber(cashSurplusDeficit),
    isHighTaxBracket,
    netDividend: ensureNumber(netDividend),
    frankingCredit: ensureNumber(frankingCredit),
    grossedUpDividend: ensureNumber(grossedUpDividend),
    dividendTopUpTax: ensureNumber(dividendTopUpTax),
  };
}
