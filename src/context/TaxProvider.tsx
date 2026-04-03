import type { ReactNode } from 'react';
import { useSalaryOptimization } from '../hooks/useSalaryOptimization';
import { TaxContext } from './TaxContext';

// This component provides the salary optimization state to its children.
export const TaxProvider = ({ children }: { children: ReactNode }) => {
  const salaryOptimizationState = useSalaryOptimization();

  return (
    <TaxContext.Provider value={salaryOptimizationState}>
      {children}
    </TaxContext.Provider>
  );
};
