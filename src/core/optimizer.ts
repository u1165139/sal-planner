import { calculateTaxStrategy } from './tax-engine';
import { SUPER_CONTRIBUTIONS_TAX } from './constants';
import type { CalcInputs, CalcResults } from './types';

export interface Suggestion {
  label: string;
  description: string;
  taxDelta: number;
  wealthDelta: number;
  toggles: Partial<CalcInputs>;
}

function calcTax(r: CalcResults): number {
  return (
    r.personalTaxTotal +
    r.companyTax +
    r.superContribution * SUPER_CONTRIBUTIONS_TAX -
    r.negativeGearingRefund +
    r.spouseTax +
    r.dividendTopUpTax
  );
}

function calcWealth(r: CalcResults): number {
  return (
    r.afterTaxSalary +
    r.afterTaxSpouseSalary +
    r.negativeGearingRefund +
    r.superContribution * (1 - SUPER_CONTRIBUTIONS_TAX) +
    r.companyAfterTaxProfit +
    r.netDividend -
    r.dividendTopUpTax
  );
}

function evaluate(inputs: CalcInputs, overrides: Partial<CalcInputs>): CalcResults {
  return calculateTaxStrategy({ ...inputs, ...overrides });
}

export function generateSuggestions(
  inputs: CalcInputs,
  current: CalcResults,
): Suggestion[] {
  const currentTax = calcTax(current);
  const currentWealth = calcWealth(current);

  const hasNewProperty = inputs.monthlyDeductibleInvestmentLoss > 0;

  // Build list of candidate single-toggle flips
  const candidates: Array<{
    toggles: Partial<CalcInputs>;
    label: string;
    description: string;
  }> = [];

  // maximiseSuper — always a candidate
  if (!inputs.maximiseSuper) {
    candidates.push({
      toggles: { maximiseSuper: true },
      label: 'Turn on max super',
      description: `Contributes up to $30,000 into super at 15% tax — well below your marginal rate. Reduces company tax and builds retirement wealth.`,
    });
  } else {
    candidates.push({
      toggles: { maximiseSuper: false },
      label: 'Turn off max super',
      description: 'Keeps more profit in the company at 25% rather than locking it in super. Useful if you need more liquidity.',
    });
  }

  // optimiseFamilyTax — only if hasSpouse
  if (inputs.hasSpouse) {
    if (!inputs.optimiseFamilyTax) {
      candidates.push({
        toggles: { optimiseFamilyTax: true },
        label: 'Pay spouse a salary from the company',
        description: 'Splits income between your bracket and your spouse\'s lower bracket, reducing total family tax.',
      });
    } else {
      candidates.push({
        toggles: { optimiseFamilyTax: false },
        label: 'Stop paying spouse a company salary',
        description: 'Routes all salary through you. Only beneficial if your brackets are equal.',
      });
    }
  }

  // jointOwnership — only if hasSpouse and has new property with loss
  if (inputs.hasSpouse && hasNewProperty) {
    if (!inputs.jointOwnership) {
      candidates.push({
        toggles: { jointOwnership: true },
        label: 'Jointly own the new property',
        description: 'Splits the deductible loss 50/50, giving your spouse their own NG refund and potentially reducing family tax.',
      });
    } else {
      candidates.push({
        toggles: { jointOwnership: false },
        label: 'Own the new property in your name only',
        description: 'Claims the full deductible loss against your higher income, maximising the NG refund.',
      });
    }
  }

  // Evaluate each single-toggle candidate
  const evaluated = candidates.map(c => {
    const r = evaluate(inputs, c.toggles);
    const taxDelta = calcTax(r) - currentTax;
    const wealthDelta = calcWealth(r) - currentWealth;
    return { ...c, taxDelta, wealthDelta };
  });

  // Check best multi-toggle combination (all optimisable toggles together)
  const bestMultiToggles: Partial<CalcInputs> = {};
  candidates.forEach(c => Object.assign(bestMultiToggles, c.toggles));
  const multiResult = evaluate(inputs, bestMultiToggles);
  const multiTaxDelta = calcTax(multiResult) - currentTax;
  const multiWealthDelta = calcWealth(multiResult) - currentWealth;

  // If multi is materially better than best single on both metrics, add it
  const bestSingleTaxDelta = Math.min(...evaluated.map(e => e.taxDelta));
  const bestSingleWealthDelta = Math.max(...evaluated.map(e => e.wealthDelta));
  const multiIsBetterOnTax = multiTaxDelta < bestSingleTaxDelta - 500;
  const multiIsBetterOnWealth = multiWealthDelta > bestSingleWealthDelta + 500;

  if (candidates.length > 1 && (multiIsBetterOnTax || multiIsBetterOnWealth)) {
    const toggleNames = candidates.map(c => c.label.replace('Turn on ', '').replace('Turn off ', '')).join(' + ');
    evaluated.push({
      toggles: bestMultiToggles,
      label: `Apply all strategies together`,
      description: `Combining ${toggleNames} gives a better outcome than any single change.`,
      taxDelta: multiTaxDelta,
      wealthDelta: multiWealthDelta,
    });
  }

  // Filter to only meaningful improvements
  const THRESHOLD = 200;
  const suggestions = evaluated.filter(e =>
    e.taxDelta < -THRESHOLD || e.wealthDelta > THRESHOLD
  );

  // Sort by combined impact — weight tax saving and wealth gain equally
  suggestions.sort((a, b) => {
    const scoreA = (a.wealthDelta) + (-a.taxDelta);
    const scoreB = (b.wealthDelta) + (-b.taxDelta);
    return scoreB - scoreA;
  });

  // Return top 3 suggestions
  return suggestions.slice(0, 3);
}

