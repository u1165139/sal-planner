import { useTax } from '../../context/TaxContext';
import { selectDividendAnalysis } from '../../core/selectors';
import { fmt } from '../../utils/formatters';

export function DividendAnalysis() {
  const { inputs, results } = useTax();
  const analysis = selectDividendAnalysis({ results, inputs });

  if (!analysis || !analysis.drawDividend) return null;

  return (
    <div className="panel-card">
      <div className="panel-card-title"><span className="panel-card-dot" />Dividend Analysis</div>
      <div className="tax-breakdown">
        <div className="tax-row"><span className="tax-row-label">Net Dividend Received</span><span className="tax-row-value">{fmt(analysis.netDividend)}</span></div>
        <div className="tax-row"><span className="tax-row-label">+ Franking Credit (Tax Paid by Co)</span><span className="tax-row-value positive">{fmt(analysis.frankingCredit)}</span></div>
        <div className="tax-row"><span className="tax-row-label">Grossed-up Dividend</span><span className="tax-row-value">{fmt(analysis.grossedUpDividend)}</span></div>
        <div className="tax-total">
          <span className="tax-total-label">
            {analysis.dividendTopUpTax < 0 ? 'Franking Credit Refund' : 'Dividend Top-Up Tax Owed'}
          </span>
          <span className={`tax-row-value ${analysis.dividendTopUpTax < 0 ? 'positive' : (analysis.dividendTopUpTax > 0 ? 'negative' : '')}`}>
            {analysis.dividendTopUpTax < 0 ? `+${fmt(Math.abs(analysis.dividendTopUpTax))}` : (analysis.dividendTopUpTax > 0 ? `−${fmt(analysis.dividendTopUpTax)}` : fmt(0))}
          </span>
        </div>
      </div>
    </div>
  );
}
