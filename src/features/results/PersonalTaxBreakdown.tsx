import { useTax } from '../../context/TaxContext';
import { selectPersonalTaxBreakdown } from '../../core/selectors';
import { fmt, fmtPct } from '../../utils/formatters';

export function PersonalTaxBreakdown() {
  const { inputs, results } = useTax();
  // Pass a single state object to the selector
  const breakdown = selectPersonalTaxBreakdown({ results, inputs });

  if (!breakdown) return null;

  return (
    <div className="panel-card">
      <div className="panel-card-title"><span className="panel-card-dot" />Personal Tax</div>
      <div className="tax-breakdown">
        <h4 style={{ margin: '0.5rem 0', fontSize: '0.85rem', color: 'var(--panel-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Income Sources</h4>
        <div className="tax-row"><span className="tax-row-label">Salary</span><span className="tax-row-value">{fmt(breakdown.recommendedSalary)}</span></div>
        <div className="tax-row"><span className="tax-row-label">+ Interest Income</span><span className="tax-row-value">{fmt(breakdown.interestIncome)}</span></div>
        <div className="tax-row"><span className="tax-row-label">+ Property Income</span><span className="tax-row-value">{fmt(breakdown.propertyIncome)}</span></div>
        {breakdown.drawDividend && (
          <div className="tax-row"><span className="tax-row-label">+ Grossed-up Dividend</span><span className="tax-row-value">{fmt(breakdown.grossedUpDividend)}</span></div>
        )}
        <div className="tax-row"><span className="tax-row-label">Gross Taxable Income</span><span className="tax-row-value">{fmt(breakdown.recommendedSalary + breakdown.basePersonalTaxableIncome + (breakdown.drawDividend ? breakdown.grossedUpDividend : 0))}</span></div>

        <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.85rem', color: 'var(--panel-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tax & Adjustments</h4>
        {breakdown.annualDeductibleInvestmentLoss > 0 && (
          <div className="tax-row"><span className="tax-row-label">Less: Deductible Investment Loss</span><span className="tax-row-value negative">−{fmt(breakdown.annualDeductibleInvestmentLoss)}</span></div>
        )}
        <div className="tax-row"><span className="tax-row-label">Net Taxable Income</span><span className="tax-row-value">{fmt(breakdown.totalPersonalTaxableIncome)}</span></div>
        {breakdown.negativeGearingRefund > 0 || breakdown.drawDividend ? (
          <>
            <div className="tax-row"><span className="tax-row-label">Estimated Tax (Gross)</span><span className="tax-row-value negative">−{fmt(breakdown.taxBeforeDeduction)}</span></div>
            {breakdown.negativeGearingRefund > 0 && (
              <div className="tax-row tax-row-indent"><span className="tax-row-label">Tax Saved (Negative Gearing)</span><span className="tax-row-value positive">+{fmt(breakdown.negativeGearingRefund)}</span></div>
            )}
            {breakdown.drawDividend && (
              <div className="tax-row tax-row-indent"><span className="tax-row-label">Less: Franking Credit Offset</span><span className="tax-row-value positive">+{fmt(breakdown.frankingCredit)}</span></div>
            )}
            <div className="tax-row"><span className="tax-row-label">Final Income Tax + Medicare</span><span className="tax-row-value negative">−{fmt(breakdown.personalTaxTotal)}</span></div>
          </>
        ) : (
          <div className="tax-row"><span className="tax-row-label">Income Tax + Medicare</span><span className="tax-row-value negative">−{fmt(breakdown.personalTaxTotal)}</span></div>
        )}
        <div className="tax-total"><span className="tax-total-label">Effective Rate <span title="Calculated as Total Tax divided by Gross Taxable Income" style={{ cursor: 'help', fontSize: '0.8em', marginLeft: '4px', verticalAlign: 'middle', opacity: 0.7 }}>ⓘ</span></span><span className="tax-row-value gold">{fmtPct(breakdown.effectivePersonalRate)}</span></div>

        <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--panel-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</h4>
          <div className="tax-row"><span className="tax-row-label">Gross Salary</span><span className="tax-row-value">{fmt(breakdown.recommendedSalary)}</span></div>
          <div className="tax-row"><span className="tax-row-label">Less Allocated Tax</span><span className="tax-row-value negative">−{fmt(breakdown.personalTaxOnSalary)}</span></div>
          <div className="tax-row" style={{ borderTop: '1px dashed var(--panel-border)', marginTop: '0.5rem', paddingTop: '0.5rem', fontWeight: 'bold' }}>
            <span className="tax-row-label">Net Cash Salary</span>
            <span className="tax-row-value positive">{fmt(breakdown.afterTaxSalary)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
