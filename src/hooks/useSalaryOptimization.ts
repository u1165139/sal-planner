import { useState, useMemo, useCallback, useRef } from 'react';
import { calculateTaxStrategy } from '../core/tax-engine';
import type { CalcInputs, CalcResults } from '../core/types';
import { CalcInputsSchema } from '../core/schema';
import { useDebounce } from 'use-debounce';

const DEFAULT_INPUTS: CalcInputs = {
  businessIncomeGST: 270000,
  deductibleExpenses: 30000,
  monthlyLiving: 5500,
  monthlyRepayments: 2500,
  monthlyDeductibleInvestmentLoss: 2600, // Corrected property name
  interestIncome: 0,
  propertyIncome: 35000,
  maximiseSuper: false,
  drawDividend: false,
  jointOwnership: false,
  spouseOtherIncome: 0,
  spouseExternalSuperContribution: 0,
  optimiseFamilyTax: true,
};

export function useSalaryOptimization() {
  const [inputs, setInputs] = useState<CalcInputs>(DEFAULT_INPUTS);
  const [debouncedInputs] = useDebounce(inputs, 250);
  const [wizardStep, setWizardStep] = useState(1);

  const lastValidResults = useRef<CalcResults | null>(null);

  const { results, validationErrors } = useMemo(() => {
    const parsedInputs = CalcInputsSchema.safeParse(debouncedInputs);

    if (!parsedInputs.success) {
      return { results: lastValidResults.current, validationErrors: parsedInputs.error };
    }

    const computed = calculateTaxStrategy(parsedInputs.data);
    lastValidResults.current = computed;
    return { results: computed, validationErrors: null };
  }, [debouncedInputs]);

  const set = useCallback(
    (key: keyof CalcInputs) => (val: number | boolean) => {
      const sanitizedValue = typeof val === 'number' && isNaN(val) ? 0 : val;
      setInputs((prev) => ({ ...prev, [key]: sanitizedValue }));
    },
    [],
  );

  return { inputs, set, results, setInputs, wizardStep, setWizardStep, validationErrors };
}
