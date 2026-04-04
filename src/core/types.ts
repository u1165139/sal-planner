export interface CalcInputs {
  businessIncomeGST: number;
  deductibleExpenses: number;
  monthlyLiving: number;
  monthlyRepayments: number;
  monthlyDeductibleInvestmentLoss: number;
  interestIncome: number;
  propertyIncome: number;
  maximiseSuper: boolean;
  drawDividend: boolean;
  hasSpouse: boolean;
  jointOwnership: boolean;
  spouseOtherIncome: number;
  spouseExternalSuperContribution: number;
  optimiseFamilyTax: boolean;
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
  annualDeductibleInvestmentLoss: number;
  negativeGearingRefund: number;
  ownerDeductibleInvestmentLoss: number;
  ownerNegativeGearingRefund: number;
  // Recommended salary
  recommendedSalary: number;
  superContribution: number;
  spouseSalary: number;
  ownerSuperAfterTax: number;
  spouseSuperAfterTax: number;
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
  spouseTax: number;
  spouseNgRefund: number;
  afterTaxSpouseSalary: number;
  totalFamilyTax: number;
  effectivePersonalRate: number;
  effectiveCompanyRate: number;
  // Cash flow
  afterTaxSalary: number;
  totalCashAvailable: number;
  cashSurplusDeficit: number;
  isHighTaxBracket: boolean;
  netDividend: number;
  frankingCredit: number;
  grossedUpDividend: number;
  dividendTopUpTax: number;
  // Family tax optimisation
  familyTaxSaving: number;
  extraSpouseSalary: number;
  familyOptimisationActive: boolean;
  familyOptimisationMessage: string;
  ownerVoluntaryContribution: number;
  spouseVoluntaryContribution: number;
}
