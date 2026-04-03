
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
