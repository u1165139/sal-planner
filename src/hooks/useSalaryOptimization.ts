import { useState, useMemo, useCallback } from 'react';
import { calculateTaxStrategy } from '../core/tax-engine';
import type { CalcInputs } from '../core/types';
import { CalcInputsSchema } from '../core/schema';
import type { InputValidationErrors } from '../core/schema';
import { useDebounce } from 'use-debounce';

const DEFAULT_INPUTS: CalcInputs = {
  businessIncomeGST: 270000,
  deductibleExpenses: 30000,
  monthlyLiving: 5000,
  monthlyRepayments: 2500,
  monthlyAdditionalPurchase: 2500,
  interestIncome: 0,
  propertyIncome: 35000,
  maximiseSuper: false,
};

export function useSalaryOptimization() {
  const [inputs, setInputs] = useState<CalcInputs>(DEFAULT_INPUTS);
  const [debouncedInputs] = useDebounce(inputs, 250);
  const [activeTab, setActiveTab] = useState<'business' | 'personal'>('business');
  const [validationErrors, setValidationErrors] = useState<InputValidationErrors | null>(null);

  const results = useMemo(() => {
    const parsedInputs = CalcInputsSchema.safeParse(debouncedInputs);

    if (!parsedInputs.success) {
      setValidationErrors(parsedInputs.error);
      return null;
    }

    setValidationErrors(null); // Clear errors if validation passes
    return calculateTaxStrategy(parsedInputs.data);
  }, [debouncedInputs]);

  const set = useCallback(
    (key: keyof CalcInputs) => (val: number | boolean) => {
      // This is a critical safeguard. We ensure that no NaN values can ever be
      // set in our state, even if a component (like InputField) has a bug.
      const sanitizedValue = typeof val === 'number' && isNaN(val) ? 0 : val;
      setInputs((prev) => ({ ...prev, [key]: sanitizedValue }));
    },
    [],
  );

  return { inputs, set, results, setInputs, activeTab, setActiveTab, validationErrors };
}
