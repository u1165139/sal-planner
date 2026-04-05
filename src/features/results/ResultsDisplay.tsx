import { useTax } from '../../context/TaxContext';
import { Hero } from './Hero';
import { SummaryMetrics } from './SummaryMetrics';
import { StrategyAdvisor } from './StrategyAdvisor';
import { RevenueAllocation } from './RevenueAllocation';
import { CompanyTaxBreakdown } from './CompanyTaxBreakdown';
import { PersonalTaxBreakdown } from './PersonalTaxBreakdown';
import { DividendAnalysis } from './DividendAnalysis';
import { CashFlowCheck } from './CashFlowCheck';

export function ResultsDisplay() {
  const { results } = useTax();

  if (!results) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">$</div>
        <div className="empty-state-text">Enter your details to see results</div>
      </div>
    );
  }

  return (
    <>
      <Hero />
      <SummaryMetrics />
      <CashFlowCheck />
      <StrategyAdvisor />
      <RevenueAllocation />
      <div className="grid-2 section">
        <CompanyTaxBreakdown />
        <PersonalTaxBreakdown />
      </div>
      <DividendAnalysis />
      <div className="footer">
        <p>For informational purposes only — not financial or tax advice.</p>
        <p>Consult a registered tax agent for advice specific to your circumstances.</p>
        <p style={{ marginTop: '0.3rem', opacity: 0.4 }}>2025–26 · SBBRE 25% · SGC 12% · Super cap $30,000</p>
      </div>
    </>
  );
}
