import { useTax } from '../../context/TaxContext';
import { selectMetricsSummary } from '../../core/selectors';
import MetricCard from '../../components/MetricCard';
import { fmt, fmtPct } from '../../utils/formatters';

export function SummaryMetrics() {
  const { inputs, results } = useTax();
  // Pass a single state object to the selector
  const summary = selectMetricsSummary({ results, inputs });

  if (!summary) return null;

  return (
    <div className="grid-4 section">
      <MetricCard label="Total Tax Paid" value={fmt(summary.totalTax)} sub="Company + Personal" accent />
      <MetricCard label="Company Tax" value={fmt(summary.companyTax)} sub={`${fmtPct(summary.effectiveCompanyRate)} eff. rate`} />
      <MetricCard label="Personal Tax" value={fmt(summary.personalTaxTotal)} sub={`${fmtPct(summary.effectivePersonalRate)} eff. rate`} />
      {summary.negativeGearingRefund > 0
        ? <MetricCard label="NG Tax Refund" value={fmt(summary.negativeGearingRefund)} sub="Reduces salary needed" accent />
        : <MetricCard label="After-Tax Salary" value={fmt(summary.afterTaxSalary)} sub="Cash in hand" accent />
      }
    </div>
  );
}
