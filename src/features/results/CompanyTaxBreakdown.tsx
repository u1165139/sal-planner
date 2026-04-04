import { useTax } from '../../context/TaxContext';
import { selectCompanyTaxBreakdown } from '../../core/selectors';
import { fmt } from '../../utils/formatters';
import { SUPER_CONTRIBUTIONS_TAX } from '../../core/constants';

export function CompanyTaxBreakdown() {
  const { inputs, results } = useTax();
  // Pass a single state object to the selector
  const breakdown = selectCompanyTaxBreakdown({ results, inputs });

  if (!breakdown) return null;

  return (
    <div className="panel-card">
      <div className="panel-card-title"><span className="panel-card-dot" />Company Tax</div>
      <div className="tax-breakdown">
        <div className="tax-row"><span className="tax-row-label">Revenue (Excl. GST)</span><span className="tax-row-value">{fmt(breakdown.businessRevenue)}</span></div>
        <div className="tax-row"><span className="tax-row-label">Net Profit (Before Salary)</span><span className="tax-row-value">{fmt(breakdown.netBusinessProfit)}</span></div>
      <div className="tax-row">
        <span className="tax-row-label">Less: Owner Salary</span>
        <span className="tax-row-value negative">−{fmt(breakdown.recommendedSalary)}</span>
      </div>
      {breakdown.spouseSalary > 0 && (
        <div className="tax-row">
          <span className="tax-row-label">Less: Spouse Salary</span>
          <span className="tax-row-value negative">−{fmt(breakdown.spouseSalary)}</span>
        </div>
      )}
      {breakdown.superContribution > 0 && (
        <>
          <div className="tax-row">
            <span className="tax-row-label">
              Less: Super {breakdown.maximiseSuper ? '(SGC + Voluntary)' : '(SGC)'}
            </span>
            <span className="tax-row-value negative">−{fmt(breakdown.superContribution)}</span>
          </div>
          {breakdown.maximiseSuper && breakdown.ownerVoluntaryContribution > 0 && (
            <div className="tax-row tax-row-indent">
              <span className="tax-row-label">Owner voluntary top-up</span>
              <span className="tax-row-value negative">−{fmt(breakdown.ownerVoluntaryContribution)}</span>
            </div>
          )}
          {breakdown.maximiseSuper && breakdown.spouseVoluntaryContribution > 0 && (
            <div className="tax-row tax-row-indent">
              <span className="tax-row-label">↳ Spouse voluntary top-up</span>
              <span className="tax-row-value" style={{ color: '#a78bfa' }}>−{fmt(breakdown.spouseVoluntaryContribution)}</span>
            </div>
          )}
          {(breakdown.ownerVoluntaryContribution > 0 || breakdown.spouseVoluntaryContribution > 0) && (
            <div className="tax-row" style={{ fontSize: '0.72rem', opacity: 0.7 }}>
              <span className="tax-row-label">Net into super (after 15% tax)</span>
              <span className="tax-row-value" style={{ color: '#a78bfa' }}>
                {fmt(breakdown.superContribution * (1 - SUPER_CONTRIBUTIONS_TAX))}
              </span>
            </div>
          )}
        </>
      )}

      <div className="tax-row total-row"><span className="tax-row-label">Taxable Company Profit</span><span className="tax-row-value">{fmt(breakdown.companyTaxableProfit)}</span></div>
        <div className="tax-row"><span className="tax-row-label">Company Tax @ 25%</span><span className="tax-row-value negative">−{fmt(breakdown.companyTax)}</span></div>
        <div className="tax-total"><span className="tax-total-label">After-Tax Profit</span><span className="tax-row-value gold">{fmt(breakdown.companyAfterTaxProfit)}</span></div>
      </div>
    </div>
  );
}
