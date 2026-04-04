import { createSelector } from 'reselect';
import type { CalcInputs, CalcResults } from './types';

// Define the shape of the state object that our selectors will receive.
interface SelectorState {
  results: CalcResults | null;
  inputs: CalcInputs;
}

// Input selectors now pull their data from the single 'state' object.
const selectResults = (state: SelectorState) => state.results;
const selectInputs = (state: SelectorState) => state.inputs;

export const selectHeroSummary = createSelector(
  [selectResults, selectInputs],
  (results, inputs) => {
    if (!results) return null;
    return {
      recommendedSalary: results.recommendedSalary,
      spouseSalary: results.spouseSalary,
      superContribution: results.superContribution,
      netBusinessProfit: results.netBusinessProfit,
      businessRevenue: results.businessRevenue,
      maximiseSuper: inputs.maximiseSuper,
      isHighTaxBracket: results.isHighTaxBracket,
    };
  }
);

export const selectMetricsSummary = createSelector(
  // This selector only needs 'results', so its input selector is simpler.
  (state: SelectorState) => state.results,
  (results) => {
    if (!results) return null;
    return {
      totalTax: results.totalTax,
      businessRevenue: results.businessRevenue,
      companyTax: results.companyTax,
      effectiveCompanyRate: results.effectiveCompanyRate,
      personalTaxTotal: results.personalTaxTotal,
      effectivePersonalRate: results.effectivePersonalRate,
      negativeGearingRefund: results.negativeGearingRefund,
      afterTaxSalary: results.afterTaxSalary,
    };
  }
);

export const selectCompanyTaxBreakdown = createSelector(
  [selectResults, selectInputs],
  (results, inputs) => {
    if (!results) return null;
    return {
      businessRevenue: results.businessRevenue,
      netBusinessProfit: results.netBusinessProfit,
      recommendedSalary: results.recommendedSalary,
      superContribution: results.superContribution,
      companyTaxableProfit: results.companyTaxableProfit,
      companyTax: results.companyTax,
      companyAfterTaxProfit: results.companyAfterTaxProfit,
      maximiseSuper: inputs.maximiseSuper,
    };
  }
);

export const selectPersonalTaxBreakdown = createSelector(
  [selectResults, selectInputs],
  (results, inputs) => {
    if (!results) return null;
    return {
      recommendedSalary: results.recommendedSalary,
      interestIncome: inputs.interestIncome,
      propertyIncome: inputs.propertyIncome,
      basePersonalTaxableIncome: results.basePersonalTaxableIncome,
      annualDeductibleInvestmentLoss: results.annualDeductibleInvestmentLoss,
      totalPersonalTaxableIncome: results.totalPersonalTaxableIncome,
      taxBeforeDeduction: results.personalTaxTotal + results.negativeGearingRefund + results.frankingCredit,
      personalTaxTotal: results.personalTaxTotal,
      negativeGearingRefund: results.negativeGearingRefund,
      effectivePersonalRate: results.effectivePersonalRate,
      drawDividend: inputs.drawDividend,
      grossedUpDividend: results.grossedUpDividend,
      frankingCredit: results.frankingCredit,
    };
  }
);

export const selectCashFlowSummary = createSelector(
  [selectResults, selectInputs],
  (results, inputs) => {
    if (!results) return null;
    return {
      afterTaxSalary: results.afterTaxSalary,
      interestIncome: inputs.interestIncome,
      negativeGearingRefund: results.negativeGearingRefund,
      totalCashAvailable: results.totalCashAvailable,
      monthlyLiving: inputs.monthlyLiving,
      monthlyRepayments: inputs.monthlyRepayments,
      monthlyDeductibleInvestmentLoss: inputs.monthlyDeductibleInvestmentLoss,
      requiredAnnualCash: results.requiredAnnualCash,
      cashSurplusDeficit: results.cashSurplusDeficit,
    };
  }
);

export const selectDividendAnalysis = createSelector(
  [selectResults, selectInputs],
  (results, inputs) => {
    if (!results) return null;
    return {
      drawDividend: inputs.drawDividend,
      netDividend: results.netDividend,
      frankingCredit: results.frankingCredit,
      grossedUpDividend: results.grossedUpDividend,
      dividendTopUpTax: results.dividendTopUpTax,
    };
  }
);
