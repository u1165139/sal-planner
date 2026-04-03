import { createContext, useContext } from 'react';
import type { useSalaryOptimization } from '../hooks/useSalaryOptimization';

// The type of the value that will be provided by the context
type SalaryOptimizationContextType = ReturnType<typeof useSalaryOptimization>;

// Create the context with an undefined initial value
export const TaxContext = createContext<SalaryOptimizationContextType | undefined>(undefined);

// Create the custom hook to consume the context
export const useTax = () => {
  const context = useContext(TaxContext);
  if (context === undefined) {
    // This error is thrown if useTax is used outside of a TaxProvider
    throw new Error('useTax must be used within a TaxProvider');
  }
  return context;
};
