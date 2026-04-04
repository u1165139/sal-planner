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
    optimiseFamilyTax,
  } = inputs;

  // ── Base calculations ──────────────────────────────────────────────────────
  const businessRevenue = businessIncomeGST / 1.1;
  const netBusinessProfit = businessRevenue - deductibleExpenses;
  const requiredAnnualCash = (monthlyLiving + monthlyRepayments + monthlyDeductibleInvestmentLoss) * 12;
  const basePersonalTaxableIncome = interestIncome + propertyIncome;

  // ── Negative gearing on investment loss ────────────────────────────────
  const annualDeductibleInvestmentLoss = monthlyDeductibleInvestmentLoss * 12;
  const splitLossOwner = inputs.jointOwnership ? annualDeductibleInvestmentLoss / 2 : annualDeductibleInvestmentLoss;
  const splitLossSpouse = inputs.jointOwnership ? annualDeductibleInvestmentLoss / 2 : 0;

  const findBestSplit = (totalSalary: number) => {
    let bestO = totalSalary;
    let minTax = Infinity;
    const spouseBase = inputs.spouseOtherIncome || 0;

    const evaluate = (o: number) => {
      const s = totalSalary - o;
      const taxO = calcTotalPersonalTax(Math.max(0, o + basePersonalTaxableIncome - splitLossOwner));
      const taxS = calcTotalPersonalTax(Math.max(0, s + spouseBase - splitLossSpouse));
      return taxO + taxS;
    };

    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const o = (totalSalary * i) / steps;
      const tax = evaluate(o);
      if (tax < minTax) {
        minTax = tax;
        bestO = o;
      }
    }

    const fineRange = totalSalary / steps;
    const start = Math.max(0, bestO - fineRange);
    const end = Math.min(totalSalary, bestO + fineRange);
    for (let i = 0; i <= steps; i++) {
      const o = start + ((end - start) * i) / steps;
      const tax = evaluate(o);
      if (tax <= minTax) {
        minTax = tax;
        bestO = o;
      }
    }

    return { ownerSalary: bestO, spouseSalary: totalSalary - bestO };
  };

  // ── Binary search for recommended salary ──────────────────────────────────
  const availableNonSalaryCash = interestIncome;
  let recommendedOwnerSalary = 0;
  let recommendedSpouseSalary = 0;
  let totalRecommendedSalary = 0;

  const computeCash = (totalSalary: number) => {
    let ownerSal = totalSalary;
    let spouseSal = 0;

    if (inputs.enableSpouseSplitting) {
      const split = findBestSplit(totalSalary);
      ownerSal = split.ownerSalary;
      spouseSal = split.spouseSalary;
    }

    const grossIncome = ownerSal + basePersonalTaxableIncome;
    const taxWithout = calcTotalPersonalTax(grossIncome);
    const taxWith = calcTotalPersonalTax(Math.max(0, grossIncome - splitLossOwner));
    const ngRefundOwner = taxWithout - taxWith;
    
    const taxOnBaseOnly = calcTotalPersonalTax(basePersonalTaxableIncome);
    const personalTaxOnSalary = taxWithout - taxOnBaseOnly;
    const afterTaxOwner = ownerSal - personalTaxOnSalary;

    let afterTaxSpouse = 0;
    let ngRefundSpouse = 0;
    if (inputs.enableSpouseSplitting || inputs.jointOwnership) {
      const sGross = spouseSal + (inputs.spouseOtherIncome || 0);
      const sTaxWithout = calcTotalPersonalTax(sGross);
      const sTaxWith = calcTotalPersonalTax(Math.max(0, sGross - splitLossSpouse));
      ngRefundSpouse = sTaxWithout - sTaxWith;
      
      const sTaxBase = calcTotalPersonalTax(inputs.spouseOtherIncome || 0);
      afterTaxSpouse = spouseSal - (sTaxWithout - sTaxBase);
    }

    const afterTax = afterTaxOwner + afterTaxSpouse;
    const ngRefund = ngRefundOwner + ngRefundSpouse;
    return { afterTax, ngRefund, ownerSal, spouseSal };
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
    totalRecommendedSalary = (lo + hi) / 2;
  }

  totalRecommendedSalary = Math.min(Math.max(0, totalRecommendedSalary), Math.max(0, netBusinessProfit));
  const splitResult = computeCash(totalRecommendedSalary);
  recommendedOwnerSalary = splitResult.ownerSal;
  recommendedSpouseSalary = splitResult.spouseSal;

  // ── Super adjustment ───────────────────────────────────────────────────────
  let superContribution = 0;
  if (maximiseSuper) {
    // Calculate total effective cap based on who receives a salary
    let totalCap = 0;
    if (recommendedOwnerSalary > 0) totalCap += SUPER_CAP;
    if (inputs.enableSpouseSplitting && recommendedSpouseSalary > 0) totalCap += SUPER_CAP;
    // Default to at least one cap if salaries haven't been mapped yet but profit exists
    if (totalCap === 0) totalCap = SUPER_CAP;

    const maxSalaryWithSuper = Math.max(0, netBusinessProfit) / (1 + SUPER_RATE);
    totalRecommendedSalary = Math.min(totalRecommendedSalary, maxSalaryWithSuper);
    const reSplit = computeCash(totalRecommendedSalary);
    recommendedOwnerSalary = reSplit.ownerSal;
    recommendedSpouseSalary = reSplit.spouseSal;

    // Recalculate cap purely based on finalized split
    totalCap = 0;
    if (recommendedOwnerSalary > 0) totalCap += SUPER_CAP;
    if (recommendedSpouseSalary > 0) totalCap += SUPER_CAP;
    if (totalCap === 0) totalCap = SUPER_CAP;

    superContribution = Math.min((recommendedOwnerSalary + recommendedSpouseSalary) * SUPER_RATE, totalCap);
  } else {
    // Enforce base SGC calculation for salaries drawn
    superContribution = (recommendedOwnerSalary + recommendedSpouseSalary) * SUPER_RATE;
  }

  // ── Final tax calculations ─────────────────────────────────────────────────
  const companyTaxableProfit = Math.max(0, netBusinessProfit - totalRecommendedSalary - superContribution);
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

  const grossIncome = recommendedOwnerSalary + basePersonalTaxableIncome + grossedUpDividend;
  const personalTaxWithout = calcTotalPersonalTax(grossIncome);
  const personalTaxWith = calcTotalPersonalTax(Math.max(0, grossIncome - splitLossOwner));
  
  if (inputs.drawDividend) {
    const baseTaxWithoutDiv = calcTotalPersonalTax(Math.max(0, recommendedOwnerSalary + basePersonalTaxableIncome - splitLossOwner));
    dividendTopUpTax = personalTaxWith - baseTaxWithoutDiv - frankingCredit;
  }

  let spouseNgRefund = 0;
  let spouseTax = 0;
  let afterTaxSpouseSalary = 0;
  if (inputs.enableSpouseSplitting || inputs.jointOwnership) {
    const sGross = recommendedSpouseSalary + (inputs.spouseOtherIncome || 0);
    const sTaxWithout = calcTotalPersonalTax(sGross);
    const sTaxWith = calcTotalPersonalTax(Math.max(0, sGross - splitLossSpouse));
    spouseNgRefund = sTaxWithout - sTaxWith;
    const sTaxBase = calcTotalPersonalTax(inputs.spouseOtherIncome || 0);
    spouseTax = sTaxWith - sTaxBase;
    afterTaxSpouseSalary = recommendedSpouseSalary - (sTaxWithout - sTaxBase);
  }

  const ownerNegativeGearingRefund = personalTaxWithout - personalTaxWith;
  const negativeGearingRefund = ownerNegativeGearingRefund + spouseNgRefund;

  const personalTaxTotal = personalTaxWith - frankingCredit;
  
  const personalTaxOnBaseOnly = calcTotalPersonalTax(basePersonalTaxableIncome);
  const personalTaxOnSalary = personalTaxWithout - personalTaxOnBaseOnly;
  const totalPersonalTaxableIncome = Math.max(0, grossIncome - splitLossOwner);

  const afterTaxOwnerSalary = recommendedOwnerSalary - personalTaxOnSalary;

  const afterTaxSalary = afterTaxOwnerSalary + afterTaxSpouseSalary;
  const totalCashAvailable = afterTaxSalary + availableNonSalaryCash + negativeGearingRefund + netDividend - dividendTopUpTax;
  const cashShortfall = Math.max(0, requiredAnnualCash - availableNonSalaryCash - negativeGearingRefund - (netDividend - dividendTopUpTax));
  const cashSurplusDeficit = totalCashAvailable - requiredAnnualCash;
  const totalFamilyTax = companyTax + personalTaxTotal + spouseTax;
  const isHighTaxBracket = totalPersonalTaxableIncome > 190000;

  // ── Family tax optimisation ────────────────────────────────────────────────
  let extraSpouseSalary = 0;
  let familyTaxSaving = 0;
  let familyOptimisationActive = false;
  let familyOptimisationMessage = '';

  if (optimiseFamilyTax && (inputs.enableSpouseSplitting || inputs.jointOwnership)) {
    const spouseBase = inputs.spouseOtherIncome || 0;
    const availableForOptimisation = Math.max(0, companyAfterTaxProfit);

    // Owner's marginal rate on next dollar (using $100 probe for accuracy)
    const ownerMarginal = (calcTotalPersonalTax(totalPersonalTaxableIncome + 100) - calcTotalPersonalTax(totalPersonalTaxableIncome)) / 100;

    // Spouse's current marginal rate on next dollar (on their existing income after loss)
    const spouseCurrentNet = Math.max(0, spouseBase - splitLossSpouse);
    const spouseMarginal = (calcTotalPersonalTax(spouseCurrentNet + 100) - calcTotalPersonalTax(spouseCurrentNet)) / 100;

    if (ownerMarginal <= spouseMarginal) {
      familyOptimisationMessage = `No benefit: your marginal rate (${Math.round(ownerMarginal * 100)}%) is not higher than your spouse's current rate (${Math.round(spouseMarginal * 100)}%). Routing more salary to your spouse would not reduce family tax.`;
    } else if (availableForOptimisation < 1000) {
      familyOptimisationMessage = `No company profit available to redistribute. All profit has been drawn as salary or retained for super.`;
    } else {
      // Binary search: find the optimal extra spouse salary from company profit
      // that minimises total family tax (personal tax both people + company tax)
      // Constraint: owner salary stays fixed at recommendedOwnerSalary (cash needs are met)
      // Extra spouse salary comes purely from company after-tax profit being paid as salary instead

      const computeFamilyTax = (extraSpouse: number) => {
        // Extra salary paid to spouse reduces company taxable profit
        // (salary is deductible, so company saves 25% on each dollar paid)
        const companySalaryDeduction = extraSpouse;
        const newCompanyTaxableProfit = Math.max(0, companyTaxableProfit - companySalaryDeduction);
        const newCompanyTax = newCompanyTaxableProfit * COMPANY_TAX_RATE;

        // Owner tax unchanged — owner salary is fixed
        const newOwnerTax = personalTaxTotal;

        // Spouse tax on their total income including extra salary
        const spouseTotalIncome = spouseBase + extraSpouse;
        const spouseNetIncome = Math.max(0, spouseTotalIncome - splitLossSpouse);
        const spouseTaxBase = calcTotalPersonalTax(Math.max(0, spouseBase - splitLossSpouse));
        const newSpouseTax = calcTotalPersonalTax(spouseNetIncome) - spouseTaxBase + spouseTax;

        return newCompanyTax + newOwnerTax + newSpouseTax;
      };

      // Find the extra spouse salary amount that minimises total family tax
      // Search in steps then refine
      let bestExtra = 0;
      let bestTax = computeFamilyTax(0);
      const steps = 200;
      for (let i = 1; i <= steps; i++) {
        const extra = (availableForOptimisation * i) / steps;
        const tax = computeFamilyTax(extra);
        if (tax < bestTax) {
          bestTax = tax;
          bestExtra = extra;
        }
      }

      // Fine search around best
      const fineRange = availableForOptimisation / steps;
      const fineStart = Math.max(0, bestExtra - fineRange);
      const fineEnd = Math.min(availableForOptimisation, bestExtra + fineRange);
      for (let i = 0; i <= steps; i++) {
        const extra = fineStart + ((fineEnd - fineStart) * i) / steps;
        const tax = computeFamilyTax(extra);
        if (tax < bestTax) {
          bestTax = tax;
          bestExtra = extra;
        }
      }

      extraSpouseSalary = bestExtra;
      const currentFamilyTax = companyTax + personalTaxTotal + spouseTax;
      familyTaxSaving = currentFamilyTax - bestTax;

      if (familyTaxSaving > 50 && extraSpouseSalary > 100) {
        familyOptimisationActive = true;
        const ownerRatePct = Math.round(ownerMarginal * 100);
        const spouseRatePct = Math.round(spouseMarginal * 100);
        const extraK = extraSpouseSalary >= 1000
          ? `$${Math.round(extraSpouseSalary / 1000)}k`
          : `$${Math.round(extraSpouseSalary)}`;
        familyOptimisationMessage = `Paying your spouse an extra ${extraK} from company profit saves $${Math.round(familyTaxSaving).toLocaleString()} in total family tax — moving income from your ${ownerRatePct}% bracket to your spouse's ${spouseRatePct}% bracket.`;
      } else {
        familyOptimisationMessage = `After accounting for the 25% company tax already paid on this profit, routing additional salary to your spouse does not meaningfully reduce total family tax.`;
      }
    }
  }

  return {
    businessRevenue: ensureNumber(businessRevenue),
    netBusinessProfit: ensureNumber(netBusinessProfit),
    requiredAnnualCash: ensureNumber(requiredAnnualCash),
    availableNonSalaryCash: ensureNumber(availableNonSalaryCash),
    cashShortfall: ensureNumber(cashShortfall),
    basePersonalTaxableIncome: ensureNumber(basePersonalTaxableIncome),
    annualDeductibleInvestmentLoss: ensureNumber(annualDeductibleInvestmentLoss),
    negativeGearingRefund: ensureNumber(negativeGearingRefund),
    ownerDeductibleInvestmentLoss: ensureNumber(splitLossOwner),
    ownerNegativeGearingRefund: ensureNumber(ownerNegativeGearingRefund),
    recommendedSalary: ensureNumber(recommendedOwnerSalary),
    spouseSalary: ensureNumber(recommendedSpouseSalary),
    superContribution: ensureNumber(superContribution),
    companyTaxableProfit: ensureNumber(companyTaxableProfit),
    companyTax: ensureNumber(companyTax),
    companyAfterTaxProfit: ensureNumber(companyAfterTaxProfit),
    personalTaxTotal: ensureNumber(personalTaxTotal),
    personalTaxOnSalary: ensureNumber(personalTaxOnSalary),
    totalPersonalTaxableIncome: ensureNumber(totalPersonalTaxableIncome),
    totalTax: ensureNumber(companyTax + personalTaxTotal + spouseTax),
    spouseTax: ensureNumber(spouseTax),
    spouseNgRefund: ensureNumber(spouseNgRefund),
    afterTaxSpouseSalary: ensureNumber(afterTaxSpouseSalary),
    totalFamilyTax: ensureNumber(totalFamilyTax),
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
    extraSpouseSalary: ensureNumber(extraSpouseSalary),
    familyTaxSaving: ensureNumber(familyTaxSaving),
    familyOptimisationActive: familyOptimisationActive,
    familyOptimisationMessage: familyOptimisationMessage,
  };
}
