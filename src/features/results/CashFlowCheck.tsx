import { useTax } from '../../context/TaxContext';
import { selectCashFlowSummary } from '../../core/selectors';
import { fmt } from '../../utils/formatters';

export function CashFlowCheck() {
  const { inputs, results } = useTax();
  // Pass a single state object to the selector
  const summary = selectCashFlowSummary({ results, inputs });

  if (!summary) return null;

  return (
    <div className="panel-card section">
      <div className="panel-card-title"><span className="panel-card-dot" />Cash Flow Check</div>
      <div style={{ overflowX: 'auto' }}>
        <div className="cashflow-grid">
          <div>
            <div className="cashflow-col-title">Cash Available</div>
            <div className="cashflow-item"><span className="cashflow-item-label">After-Tax Salary</span><span className="cashflow-item-value">{fmt(summary.afterTaxSalary)}</span></div>
            <div className="cashflow-item"><span className="cashflow-item-label">Interest Income</span><span className="cashflow-item-value">{fmt(summary.interestIncome)}</span></div>
            {summary.negativeGearingRefund > 0 && (
              <div className="cashflow-item">
                <span className="cashflow-item-label">Investment Tax Credits (50/50 Split)</span>
                <span className="cashflow-item-value highlight">+{fmt(summary.negativeGearingRefund)}</span>
              </div>
            )}
            <div className="cashflow-total"><span>Total Net Take-Home (Annual)</span><span style={{ color: '#4ade80' }}>{fmt(summary.totalCashAvailable)}</span></div>
          </div>
          <div className="cashflow-equals">=</div>
          <div>
            <div className="cashflow-col-title">Cash Required</div>
            <div className="cashflow-item"><span className="cashflow-item-label">Annual Living Expenses</span><span className="cashflow-item-value">{fmt(summary.monthlyLiving * 12)}</span></div>
            <div className="cashflow-item"><span className="cashflow-item-label">Annual Extra Repayments</span><span className="cashflow-item-value">{fmt(summary.monthlyRepayments * 12)}</span></div>
            <div className="cashflow-item"><span className="cashflow-item-label">New Property Holding Cost</span><span className="cashflow-item-value">{fmt(summary.monthlyDeductibleInvestmentLoss * 12)}</span></div>
            <div className="cashflow-total"><span>Total</span><span>{fmt(summary.requiredAnnualCash)}</span></div>
          </div>
        </div>
      </div>
      <div className={`surplus-banner ${summary.cashSurplusDeficit < 0 ? 'deficit' : ''}`}>
        <span className="surplus-label">{summary.cashSurplusDeficit >= 0 ? '✓ Annual Cash Surplus' : '⚠ Annual Cash Deficit'}</span>
        <span className={`surplus-value ${summary.cashSurplusDeficit >= 0 ? 'pos' : 'neg'}`}>
          {summary.cashSurplusDeficit >= 0 ? '+' : ''}{fmt(summary.cashSurplusDeficit)}
        </span>
      </div>
      <div style={{ fontSize: '0.65rem', color: 'var(--panel-text-dim)', marginTop: '0.8rem', textAlign: 'center' }}>
        Property Income is excluded from available cash as it is allocated to existing loan repayments.
      </div>
    </div>
  );
}
