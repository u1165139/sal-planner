import { useTax } from '../../context/TaxContext';
import { fmt } from '../../utils/formatters';
import { calcTotalPersonalTax } from '../../core/tax-engine';

export function FamilyTaxSummary() {
  const { inputs, results } = useTax();

  if (!results || !inputs.enableSpouseSplitting) {
    return null;
  }

  const { recommendedSalary, spouseSalary, basePersonalTaxableIncome, annualDeductibleInvestmentLoss, grossedUpDividend } = results;

  // Total salary distributed from the business
  const totalDistributedSalary = recommendedSalary + spouseSalary;

  // Calculate tax if owner took the full salary
  const grossIncomeOwnerOnly = totalDistributedSalary + basePersonalTaxableIncome + grossedUpDividend;
  const taxOwnerOnly = calcTotalPersonalTax(Math.max(0, grossIncomeOwnerOnly - annualDeductibleInvestmentLoss));

  // Calculate tax base for spouse if they had no salary from business
  const spouseBaseTax = calcTotalPersonalTax(inputs.spouseOtherIncome || 0);

  // The total family personal tax if the spouse wasn't split with business money
  // (Owner takes the whole salary burden)
  const familyPersonalTaxWithoutSplit = taxOwnerOnly + spouseBaseTax;

  // The total family personal tax currently being paid
  const familyPersonalTaxWithSplit = results.personalTaxTotal + (calcTotalPersonalTax((inputs.spouseOtherIncome || 0) + spouseSalary) - spouseBaseTax);

  // Compare to get the tax savings from splitting
  const taxSavings = familyPersonalTaxWithoutSplit - familyPersonalTaxWithSplit;

  return (
    <div className="card section" style={{ border: '1px solid var(--accent)' }}>
      <div className="card-title" style={{ color: 'var(--accent)' }}>
        <span className="card-title-dot" style={{ background: 'var(--accent)' }} />
        Spouse Income Splitting
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', background: 'var(--surface2)', borderRadius: '12px' }}>
          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Salary Share</span>
            <strong>{fmt(recommendedSalary)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-red)' }}>
            <span>Personal Tax</span>
            <strong>{fmt(results.personalTaxTotal)}</strong>
          </div>
        </div>

        <div style={{ padding: '1rem', background: 'var(--surface2)', borderRadius: '12px' }}>
          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Spouse</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Salary Share</span>
            <strong>{fmt(spouseSalary)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-red)' }}>
            <span>Additional Tax</span>
            <strong>{fmt(results.spouseTax)}</strong>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--accent-dim)', borderRadius: '12px', border: '1px dashed var(--accent)' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
          Annual Tax Savings from Splitting
        </span>
        <strong style={{ fontSize: '1.4rem', color: 'var(--accent)' }}>
          {fmt(Math.max(0, taxSavings))}
        </strong>
      </div>
    </div>
  );
}
