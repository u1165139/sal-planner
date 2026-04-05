import { useTax } from '../../context/TaxContext';
import { fmt } from '../../utils/formatters';
import { SUPER_CONTRIBUTIONS_TAX } from '../../core/constants';

export function RevenueAllocation() {
  const { results } = useTax();

  if (!results) return null;

  const total = results.netBusinessProfit;
  if (total <= 0) return null;

  const lifestyle = results.requiredAnnualCash;
  const superAfterTax = results.superContribution * (1 - SUPER_CONTRIBUTIONS_TAX);
  const taxPaid = results.personalTaxTotal + results.companyTax - results.negativeGearingRefund;
  const retained = results.companyAfterTaxProfit;

  const segments = [
    { label: 'Lifestyle costs',     value: lifestyle,    color: '#4ade80' },
    { label: 'Tax paid',            value: taxPaid,      color: '#f87171' },
    { label: 'Built in super',      value: superAfterTax, color: '#a78bfa' },
    { label: 'Retained in company', value: retained,     color: '#60a5fa' },
  ];

  const pct = (v: number) => `${Math.round((v / total) * 100)}%`;

  return (
    <div className="panel-card section">
      <div className="panel-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="panel-card-dot" />
          Where your revenue went
        </div>
        <span style={{ fontSize: '0.67rem', color: 'var(--panel-text-dim)' }}>
          Net profit {fmt(total)}
        </span>
      </div>

      <div style={{ width: '100%', height: '32px', borderRadius: '6px', overflow: 'hidden', display: 'flex', marginBottom: '1rem' }}>
        {segments.map(s => (
          <div
            key={s.label}
            style={{ width: pct(s.value), height: '100%', background: s.color, opacity: 0.85 }}
          />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem' }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--panel-text-mid)', flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--panel-text)' }}>{fmt(s.value)}</span>
            <span style={{ fontSize: '0.67rem', color: 'var(--panel-text-dim)', minWidth: '2.5rem', textAlign: 'right' }}>{pct(s.value)}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '0.63rem', color: 'var(--panel-text-dim)', lineHeight: 1.5, marginTop: '0.85rem', borderTop: '1px solid var(--panel-border)', paddingTop: '0.65rem' }}>
        {results.negativeGearingRefund > 0 && (
          <>Tax shown net of <strong style={{ color: 'var(--panel-text-mid)' }}>{fmt(results.negativeGearingRefund)} NG refund</strong>. </>
        )}
        Super shown after 15% contributions tax. Company profit stays in the business — extract later via dividend or salary.
      </div>
    </div>
  );
}
