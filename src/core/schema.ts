import { z } from 'zod';

export const CalcInputsSchema = z.object({
  businessIncomeGST: z.number().min(0, "Business income must be positive"),
  deductibleExpenses: z.number().min(0, "Deductible expenses must be positive"),
  monthlyLiving: z.number().min(0, "Monthly living costs must be positive"),
  monthlyRepayments: z.number().min(0, "Monthly repayments must be positive"),
  monthlyDeductibleInvestmentLoss: z.number().min(0, "Monthly deductible investment loss must be positive"),
  interestIncome: z.number().min(0, "Interest income must be positive"),
  propertyIncome: z.number().min(0, "Property income must be positive"),
  maximiseSuper: z.boolean(),
});

export type InputValidationErrors = z.ZodError<z.infer<typeof CalcInputsSchema>>;
