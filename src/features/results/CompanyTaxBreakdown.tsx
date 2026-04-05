import { useState } from 'react';
import { useTax } from '../../context/TaxContext';
import { selectCompanyTaxBreakdown } from '../../core/selectors';
import { fmt } from '../../utils/formatters';
import { SUPER_CONTRIBUTIONS_TAX } from '../../core/constants';

export function CompanyTaxBreakdown() {
  const { inputs, results } = useTax();
  const [view, setView] = useState<'summary' | 'detail'>('summary');
  
  // Pass a single state object to the selector
  const breakdown = selectCompanyTaxBreakdown({ results, inputs });

  if (!breakdown) return null;

  const totalVoluntary = breakdown.ownerVoluntaryContribution + (breakdown.spouseVoluntaryContribution || 0);

  return (
    <div className="panel-card">
      <div className="panel-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="panel-card-dot" />
          Company Tax
        </div>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.08)', borderRadius: '20px', padding: '2px', gap: '2px' }}>
          {(['summary', 'detail'] as const).map(v => (
            <div
              key={v}
              onClick={() => setView(v)}
              style={{
                fontSize: '0.62rem', fontWeight: 600, padding: '3px 10px',
                borderRadius: '16px', cursor: 'pointer', whiteSpace: 'nowrap',
                background: view === v ? 'var(--color-accent)' : 'transparent',
                color: view === v ? '#fff' : 'rgba(255,255,255,0.45)',
                transition: 'all 0.15s',
              }}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </div>
          ))}
        </div>
      </div>

      {view === 'summary' && (
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
                <span className="tax-row-value" style={{ color: 'var(--color-accent)' }}>−{fmt(breakdown.spouseVoluntaryContribution)}</span>
              </div>
            )}
            {totalVoluntary > 0 && (
              <div className="tax-row" style={{ fontSize: '0.72rem', opacity: 0.7 }}>
                <span className="tax-row-label">Net into super (after 15% tax)</span>
                <span className="tax-row-value" style={{ color: 'var(--color-accent)' }}>
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
      )}

      {view === 'detail' && (
        <div style={{ marginTop: '0.5rem', overflowX: 'auto' }}>
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Line item</th>
                <th>Notes</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Revenue (excl. GST)</td>
                <td className="note-cell"></td>
                <td>{fmt(breakdown.businessRevenue)}</td>
              </tr>
              <tr>
                <td>Less: deductible expenses</td>
                <td className="note-cell"></td>
                <td style={{ color: 'var(--color-negative)' }}>−{fmt(inputs.deductibleExpenses)}</td>
              </tr>
              <tr className="subtotal-row">
                <td>Net profit before salary</td>
                <td className="note-cell"></td>
                <td>{fmt(breakdown.netBusinessProfit)}</td>
              </tr>
              <tr>
                <td>Less: owner salary</td>
                <td className="note-cell"></td>
                <td style={{ color: 'var(--color-negative)' }}>−{fmt(breakdown.recommendedSalary)}</td>
              </tr>
              {breakdown.spouseSalary > 0 && (
                <tr>
                  <td>Less: spouse salary</td>
                  <td className="note-cell"></td>
                  <td style={{ color: 'var(--color-negative)' }}>−{fmt(breakdown.spouseSalary)}</td>
                </tr>
              )}
              <tr>
                <td>Less: super SGC</td>
                <td className="note-cell">Deductible to company</td>
                <td style={{ color: 'var(--color-negative)' }}>−{fmt(breakdown.superContribution - totalVoluntary)}</td>
              </tr>
              {totalVoluntary > 0 && (
                <tr>
                  <td>Less: voluntary super top-up</td>
                  <td className="note-cell">Up to $30k cap</td>
                  <td style={{ color: 'var(--color-negative)' }}>−{fmt(totalVoluntary)}</td>
                </tr>
              )}
              <tr className="subtotal-row">
                <td>Taxable company profit</td>
                <td className="note-cell"></td>
                <td>{fmt(breakdown.companyTaxableProfit)}</td>
              </tr>
              <tr>
                <td>Company tax @ 25% SBBRE</td>
                <td className="note-cell"></td>
                <td style={{ color: 'var(--color-negative)' }}>−{fmt(breakdown.companyTax)}</td>
              </tr>
              <tr className="total-row">
                <td>After-tax profit</td>
                <td className="note-cell"></td>
                <td style={{ color: 'var(--color-accent)' }}>{fmt(breakdown.companyAfterTaxProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
