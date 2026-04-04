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
  const splitLossOwner = inputs.jointOwnership ? annualDeductibleInvestmentLoss / 2 : annualDeductibleInvestmentLoss;
  const splitLossSpouse = inputs.jointOwnership ? annualDeductibleInvestmentLoss / 2 : 0;


  // ── Binary search for recommended salary ──────────────────────────────────
  const availableNonSalaryCash = interestIncome;
  let recommendedOwnerSalary = 0;
  let recommendedSpouseSalary = 0;
  let totalRecommendedSalary = 0;

  const computeCash = (totalSalary: number) => {
    const ownerSal = totalSalary;
    const spouseSal = 0;

    const grossIncome = ownerSal + basePersonalTaxableIncome;
    const taxWithout = calcTotalPersonalTax(grossIncome);
    const taxWith = calcTotalPersonalTax(Math.max(0, grossIncome - splitLossOwner));
    const ngRefundOwner = taxWithout - taxWith;
    
    const taxOnBaseOnly = calcTotalPersonalTax(basePersonalTaxableIncome);
    const personalTaxOnSalary = taxWithout - taxOnBaseOnly;
    const afterTaxOwner = ownerSal - personalTaxOnSalary;

    let afterTaxSpouse = 0;
    let ngRefundSpouse = 0;
    if (inputs.jointOwnership) {
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
    // Step 1: Calculate mandatory SGC on the drawn salary
    const mandatorySGC = (recommendedOwnerSalary + recommendedSpouseSalary) * SUPER_RATE;

    // Step 2: Calculate how much extra the company can contribute to reach the cap
    // Each person with a salary gets their own $30k cap
    let totalCap = 0;
    if (recommendedOwnerSalary > 0) totalCap += SUPER_CAP;
    if (recommendedSpouseSalary > 0) totalCap += SUPER_CAP;
    if (totalCap === 0) totalCap = SUPER_CAP;

    // Step 3: The company makes an additional voluntary concessional contribution
    // on top of SGC to reach the cap — this is deductible to the company
    const targetContribution = Math.min(mandatorySGC + (totalCap - mandatorySGC), totalCap);
    const additionalContribution = Math.max(0, targetContribution - mandatorySGC);

    // Step 4: Cap total salary + super within available profit
    // (can't pay more super than there is profit to support it)
    const maxPossibleSuper = Math.max(0, netBusinessProfit - recommendedOwnerSalary - recommendedSpouseSalary);
    superContribution = Math.min(targetContribution, maxPossibleSuper);

    // Step 5: If maximising super reduces available cash (because super isn't spendable),
    // we may need to slightly increase salary to compensate — re-run binary search
    // only if the additional contribution meaningfully reduces spendable cash
    if (additionalContribution > 0) {
      const { afterTax: afterTaxCheck, ngRefund: ngCheck } = computeCash(recommendedOwnerSalary + recommendedSpouseSalary);
      const cashCheck = afterTaxCheck + availableNonSalaryCash + ngCheck;
      if (cashCheck < requiredAnnualCash) {
        // Need more salary to cover cash needs after super is maximised
        let lo = recommendedOwnerSalary + recommendedSpouseSalary;
        let hi = Math.max(netBusinessProfit, 1_000_000);
        for (let i = 0; i < 80; i++) {
          const mid = (lo + hi) / 2;
          const salaryForSuper = Math.min(mid / (1 + SUPER_RATE), mid);
          const { afterTax, ngRefund } = computeCash(salaryForSuper);
          const total = afterTax + availableNonSalaryCash + ngRefund;
          if (total < requiredAnnualCash) lo = mid; else hi = mid;
        }
        const newTotalSalary = Math.min((lo + hi) / 2, Math.max(0, netBusinessProfit));
        const reSplit = computeCash(newTotalSalary);
        recommendedOwnerSalary = reSplit.ownerSal;
        recommendedSpouseSalary = reSplit.spouseSal;
        const newMandatorySGC = (recommendedOwnerSalary + recommendedSpouseSalary) * SUPER_RATE;
        const newMaxSuper = Math.max(0, netBusinessProfit - recommendedOwnerSalary - recommendedSpouseSalary);
        superContribution = Math.min(totalCap, newMaxSuper, newMandatorySGC + additionalContribution);
      }
    }
  } else {
    // Mandatory SGC always applies on any salary drawn
    superContribution = (recommendedOwnerSalary + recommendedSpouseSalary) * SUPER_RATE;
  }

  // ── Final tax calculations ─────────────────────────────────────────────────
  let companyTaxableProfit = Math.max(0, netBusinessProfit - totalRecommendedSalary - superContribution);
  let companyTax = companyTaxableProfit * COMPANY_TAX_RATE;
  let companyAfterTaxProfit = companyTaxableProfit - companyTax;

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
  if (inputs.jointOwnership) {
    const sGross = recommendedSpouseSalary + (inputs.spouseOtherIncome || 0);
    const sTaxWithout = calcTotalPersonalTax(sGross);
    const sTaxWith = calcTotalPersonalTax(Math.max(0, sGross - splitLossSpouse));
    spouseNgRefund = sTaxWithout - sTaxWith;
    const sTaxBase = calcTotalPersonalTax(inputs.spouseOtherIncome || 0);
    spouseTax = sTaxWith - sTaxBase;
    afterTaxSpouseSalary = recommendedSpouseSalary - (sTaxWithout - sTaxBase);
  }

  let ownerNegativeGearingRefund = personalTaxWithout - personalTaxWith;
  let negativeGearingRefund = ownerNegativeGearingRefund + spouseNgRefund;

  let personalTaxTotal = personalTaxWith - frankingCredit;
  
  const personalTaxOnBaseOnly = calcTotalPersonalTax(basePersonalTaxableIncome);
  let personalTaxOnSalary = personalTaxWithout - personalTaxOnBaseOnly;
  let totalPersonalTaxableIncome = Math.max(0, grossIncome - splitLossOwner);

  let afterTaxOwnerSalary = recommendedOwnerSalary - personalTaxOnSalary;

  let afterTaxSalary = afterTaxOwnerSalary + afterTaxSpouseSalary;
  let totalCashAvailable = afterTaxSalary + availableNonSalaryCash + negativeGearingRefund + netDividend - dividendTopUpTax;
  const cashShortfall = Math.max(0, requiredAnnualCash - availableNonSalaryCash - negativeGearingRefund - (netDividend - dividendTopUpTax));
  let cashSurplusDeficit = totalCashAvailable - requiredAnnualCash;
  let totalFamilyTax = companyTax + personalTaxTotal + spouseTax;
  let isHighTaxBracket = totalPersonalTaxableIncome > 190000;

  // ── Family tax bracket optimisation ───────────────────────────────────────
  let extraSpouseSalary = 0;
  let familyTaxSaving = 0;
  let familyOptimisationActive = false;
  let familyOptimisationMessage = '';

  if (inputs.optimiseFamilyTax && inputs.jointOwnership) {
    const spouseBase = inputs.spouseOtherIncome || 0;

    // Owner's marginal rate on the current salary
    const ownerMarginal = (calcTotalPersonalTax(totalPersonalTaxableIncome + 100) - calcTotalPersonalTax(totalPersonalTaxableIncome)) / 100;

    // Spouse's marginal rate on their existing income
    const spouseCurrentNet = Math.max(0, spouseBase - splitLossSpouse);
    const spouseMarginal = (calcTotalPersonalTax(spouseCurrentNet + 100) - calcTotalPersonalTax(spouseCurrentNet)) / 100;

    if (ownerMarginal <= spouseMarginal) {
      familyOptimisationMessage = `No benefit: your marginal rate (${Math.round(ownerMarginal * 100)}%) is not higher than your spouse's current rate (${Math.round(spouseMarginal * 100)}%). Routing salary to your spouse would not reduce family tax.`;
    } else {
      // The spouse's NG refund from their own income is always present (joint ownership)
      // and always contributes to the family cash pool regardless of company salary
      const spouseBaseNgRefund = calcTotalPersonalTax(spouseBase) - calcTotalPersonalTax(Math.max(0, spouseBase - splitLossSpouse));

      // Helper: compute owner's cash (after-tax salary + owner NG refund)
      // for a given owner salary level
      const ownerCashFromSalary = (sal: number) => {
        const og = sal + basePersonalTaxableIncome;
        const afterTax = sal - (calcTotalPersonalTax(og) - calcTotalPersonalTax(basePersonalTaxableIncome));
        const ng = calcTotalPersonalTax(og) - calcTotalPersonalTax(Math.max(0, og - splitLossOwner));
        return afterTax + ng;
      };

      // For a given spouse company salary, find the minimum owner salary that keeps
      // total family cash >= requiredAnnualCash, then compute total family tax.
      const evaluateSpouseSalary = (spouseSal: number) => {
        // Spouse net contribution from company salary (after their marginal tax on it)
        const spouseTotalGross = spouseSal + spouseBase;
        const spouseNetIncome = Math.max(0, spouseTotalGross - splitLossSpouse);
        const spouseTotalTax = calcTotalPersonalTax(spouseNetIncome);
        const spouseTaxBase = calcTotalPersonalTax(Math.max(0, spouseBase - splitLossSpouse));
        const extraSpouseTax = spouseTotalTax - spouseTaxBase;
        const spouseNetContrib = spouseSal - extraSpouseTax;

        // Owner must cover remaining family cash need after spouse contribution and spouse NG
        const targetOwnerCash = Math.max(0, requiredAnnualCash - spouseBaseNgRefund - spouseNetContrib);

        // Binary search for minimum owner salary that delivers targetOwnerCash
        let lo = 0;
        let hi = Math.max(netBusinessProfit, 1_000_000);
        for (let i = 0; i < 80; i++) {
          const mid = (lo + hi) / 2;
          if (ownerCashFromSalary(mid) < targetOwnerCash) lo = mid; else hi = mid;
        }
        const minOwnerSal = (lo + hi) / 2;

        // Company tax with new salary structure (salary is deductible pre-tax)
        const newSuperContrib = (minOwnerSal + spouseSal) * SUPER_RATE;
        const newCompanyTaxableProfit = Math.max(0, netBusinessProfit - minOwnerSal - spouseSal - newSuperContrib);
        const newCompanyTax = newCompanyTaxableProfit * COMPANY_TAX_RATE;

        // Owner tax on their reduced salary
        const ownerGrossFinal = minOwnerSal + basePersonalTaxableIncome;
        const ownerTax = calcTotalPersonalTax(Math.max(0, ownerGrossFinal - splitLossOwner));

        return {
          totalFamilyTax: newCompanyTax + ownerTax + spouseTotalTax,
          minOwnerSal,
        };
      };

      // Search over spouse salary from 0 to 80% of netBusinessProfit in 200 steps
      // (wide range — optimal is often $40-60k even when profit is $215k)
      const baseFamilyTax = evaluateSpouseSalary(0).totalFamilyTax;
      let bestSpouseSal = 0;
      let bestFamilyTax = baseFamilyTax;
      const steps = 200;
      const maxSpouseSal = netBusinessProfit * 0.8;

      for (let i = 1; i <= steps; i++) {
        const spouseSal = (maxSpouseSal * i) / steps;
        const { totalFamilyTax } = evaluateSpouseSalary(spouseSal);
        if (totalFamilyTax < bestFamilyTax) {
          bestFamilyTax = totalFamilyTax;
          bestSpouseSal = spouseSal;
        }
      }

      // Fine search around best
      const fineRange = maxSpouseSal / steps;
      const fineStart = Math.max(0, bestSpouseSal - fineRange);
      const fineEnd = Math.min(maxSpouseSal, bestSpouseSal + fineRange);
      for (let i = 0; i <= steps; i++) {
        const spouseSal = fineStart + ((fineEnd - fineStart) * i) / steps;
        const { totalFamilyTax } = evaluateSpouseSalary(spouseSal);
        if (totalFamilyTax < bestFamilyTax) {
          bestFamilyTax = totalFamilyTax;
          bestSpouseSal = spouseSal;
        }
      }

      extraSpouseSalary = bestSpouseSal;
      familyTaxSaving = baseFamilyTax - bestFamilyTax;

      if (familyTaxSaving > 50 && extraSpouseSalary > 100) {
        familyOptimisationActive = true;
        const ownerRatePct = Math.round(ownerMarginal * 100);
        const spouseRatePct = Math.round(spouseMarginal * 100);
        const extraK = extraSpouseSalary >= 1000
          ? `$${Math.round(extraSpouseSalary / 1000)}k`
          : `$${Math.round(extraSpouseSalary)}`;
        const saving = Math.round(familyTaxSaving).toLocaleString();
        familyOptimisationMessage = `Paying your spouse ${extraK} from the company (instead of routing it to you) saves $${saving} in total family tax — shifting income from your ${ownerRatePct}% bracket to your spouse's ${spouseRatePct}% bracket. Your take-home pay is unchanged.`;
      } else {
        familyOptimisationMessage = `No meaningful saving found. The gap between your marginal rates (${Math.round(ownerMarginal * 100)}% vs ${Math.round(spouseMarginal * 100)}%) is not large enough to overcome the difference in company tax treatment.`;
      }

      if (familyOptimisationActive) {
        const optimised = evaluateSpouseSalary(bestSpouseSal);

        // Overwrite salary figures
        recommendedOwnerSalary = optimised.minOwnerSal;
        recommendedSpouseSalary = extraSpouseSalary;

        // Recalculate super on new salary split
        if (maximiseSuper) {
          let totalCap = 0;
          if (recommendedOwnerSalary > 0) totalCap += SUPER_CAP;
          if (recommendedSpouseSalary > 0) totalCap += SUPER_CAP;
          if (totalCap === 0) totalCap = SUPER_CAP;
          superContribution = Math.min((recommendedOwnerSalary + recommendedSpouseSalary) * SUPER_RATE, totalCap);
        } else {
          superContribution = (recommendedOwnerSalary + recommendedSpouseSalary) * SUPER_RATE;
        }

        // Recalculate company tax
        const optCompanyTaxableProfit = Math.max(0, netBusinessProfit - recommendedOwnerSalary - recommendedSpouseSalary - superContribution);
        const optCompanyTax = optCompanyTaxableProfit * COMPANY_TAX_RATE;
        const optCompanyAfterTaxProfit = optCompanyTaxableProfit - optCompanyTax;

        // Recalculate owner personal tax
        const optOwnerGross = recommendedOwnerSalary + basePersonalTaxableIncome + grossedUpDividend;
        const optPersonalTaxWithout = calcTotalPersonalTax(optOwnerGross);
        const optPersonalTaxWith = calcTotalPersonalTax(Math.max(0, optOwnerGross - splitLossOwner));
        const optOwnerNgRefund = optPersonalTaxWithout - optPersonalTaxWith;
        const optPersonalTaxTotal = optPersonalTaxWith - frankingCredit;
        const optPersonalTaxOnBaseOnly = calcTotalPersonalTax(basePersonalTaxableIncome);
        const optPersonalTaxOnSalary = optPersonalTaxWithout - optPersonalTaxOnBaseOnly;
        const optTotalPersonalTaxableIncome = Math.max(0, optOwnerGross - splitLossOwner);
        const optAfterTaxOwnerSalary = recommendedOwnerSalary - optPersonalTaxOnSalary;

        // Recalculate spouse personal tax
        const optSpouseGross = recommendedSpouseSalary + (inputs.spouseOtherIncome || 0);
        const optSpouseTaxWithout = calcTotalPersonalTax(optSpouseGross);
        const optSpouseTaxWith = calcTotalPersonalTax(Math.max(0, optSpouseGross - splitLossSpouse));
        const optSpouseNgRefund = optSpouseTaxWithout - optSpouseTaxWith;
        const optSpouseTaxBase = calcTotalPersonalTax(inputs.spouseOtherIncome || 0);
        const optSpouseTax = optSpouseTaxWith - optSpouseTaxBase;
        const optAfterTaxSpouseSalary = recommendedSpouseSalary - (optSpouseTaxWithout - optSpouseTaxBase);

        // Overwrite all downstream variables
        companyTaxableProfit = optCompanyTaxableProfit;
        companyTax = optCompanyTax;
        companyAfterTaxProfit = optCompanyAfterTaxProfit;
        personalTaxTotal = optPersonalTaxTotal;
        personalTaxOnSalary = optPersonalTaxOnSalary;
        totalPersonalTaxableIncome = optTotalPersonalTaxableIncome;
        ownerNegativeGearingRefund = optOwnerNgRefund;
        spouseTax = optSpouseTax;
        spouseNgRefund = optSpouseNgRefund;
        afterTaxSpouseSalary = optAfterTaxSpouseSalary;
        negativeGearingRefund = optOwnerNgRefund + optSpouseNgRefund;
        afterTaxOwnerSalary = optAfterTaxOwnerSalary;
        afterTaxSalary = optAfterTaxOwnerSalary + optAfterTaxSpouseSalary;
        totalCashAvailable = afterTaxSalary + availableNonSalaryCash + negativeGearingRefund + netDividend - dividendTopUpTax;
        cashSurplusDeficit = totalCashAvailable - requiredAnnualCash;
        totalFamilyTax = optCompanyTax + optPersonalTaxTotal + optSpouseTax;
        isHighTaxBracket = optTotalPersonalTaxableIncome > 190000;
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
