import { useTax } from '../../context/TaxContext';
import { selectHeroSummary } from '../../core/selectors';
import { fmt } from '../../utils/formatters';

export function Hero() {
  const { inputs, results } = useTax();
  // Pass a single state object to the selector
  const summary = selectHeroSummary({ results, inputs });

  if (!summary) return null;

  return (
    <div className="hero-card section">
      <div className="hero-eyebrow">Recommended Annual Salary</div>
      <div className="hero-amount"><span>{fmt(summary.recommendedSalary)}</span></div>
      {summary.maximiseSuper && summary.superContribution > 0 && (
        <div className="super-note">
          +&nbsp;<strong>{fmt(summary.superContribution)}</strong> employer super (SGC 11.5%) — deductible to company, not cash-in-hand
        </div>
      )}
      <div className="hero-sub">
        Net Business Profit (before salary):&nbsp;{fmt(summary.netBusinessProfit)}&nbsp;·&nbsp;Revenue ex-GST:&nbsp;{fmt(summary.businessRevenue)}
      </div>
    </div>
  );
}
