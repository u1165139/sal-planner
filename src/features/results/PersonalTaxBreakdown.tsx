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
        <div className="tax-row"><span className="tax-row-label">Salary</span><span className="tax-row-value">{fmt(breakdown.recommendedSalary)}</span></div>
        <div className="tax-row"><span className="tax-row-label">+ Interest Income</span><span className="tax-row-value">{fmt(breakdown.interestIncome)}</span></div>
        <div className="tax-row"><span className="tax-row-label">+ Property Income</span><span className="tax-row-value">{fmt(breakdown.propertyIncome)}</span></div>
        <div className="tax-row"><span className="tax-row-label">Gross Taxable Income</span><span className="tax-row-value">{fmt(breakdown.recommendedSalary + breakdown.basePersonalTaxableIncome)}</span></div>
        {breakdown.annualAdditionalPurchaseLoss > 0 && (
          <div className="tax-row"><span className="tax-row-label">Less: NG Loss (Additional Purchase)</span><span className="tax-row-value negative">−{fmt(breakdown.annualAdditionalPurchaseLoss)}</span></div>
        )}
        <div className="tax-row"><span className="tax-row-label">Net Taxable Income</span><span className="tax-row-value">{fmt(breakdown.totalPersonalTaxableIncome)}</span></div>
        <div className="tax-row"><span className="tax-row-label">Income Tax + Medicare</span><span className="tax-row-value negative">−{fmt(breakdown.personalTaxTotal)}</span></div>
        {breakdown.negativeGearingRefund > 0 && (
          <div className="tax-row"><span className="tax-row-label">Negative Gearing Refund</span><span className="tax-row-value positive">+{fmt(breakdown.negativeGearingRefund)}</span></div>
        )}
        <div className="tax-total"><span className="tax-total-label">Effective Rate</span><span className="tax-row-value gold">{fmtPct(breakdown.effectivePersonalRate)}</span></div>
      </div>
    </div>
  );
}
