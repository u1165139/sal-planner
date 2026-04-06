import React, { useState } from 'react';
import { useTax } from '../../context/TaxContext';
import { fmt, fmtPct } from '../../utils/formatters';
import { calcTotalPersonalTax } from '../../core/tax-engine';
import { SUPER_RATE, SUPER_CONTRIBUTIONS_TAX } from '../../core/constants';


function TaxRow({ label, value, type }: { label: string; value: string; type?: 'neg' | 'pos' | 'gold' }) {
  return (
    <div className="tax-row">
      <span className="tax-row-label">{label}</span>
      <span className={`tax-row-value ${type === 'neg' ? 'negative' : type === 'pos' ? 'positive' : type === 'gold' ? 'gold' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: '0.65rem 0 0.25rem' }}>
      {children}
    </div>
  );
}

interface PersonColumnProps {
  title: string;
  salary: number;
  otherIncome?: number;
  interestIncome?: number;
  propertyIncome?: number;
  grossedUpDiv?: number;
  showDiv?: boolean;
  investmentLoss: number;
  grossIncome: number;
  netTaxable: number;
  ngRefund: number;
  frankingCredit?: number;
  tax: number;
  effRate: number;
  afterTaxTotal: number;
  isSplit?: boolean;
  mandatorySuper?: number;
  voluntarySuper?: number;
  externalSGC?: number;
  afterTaxSalary?: number;
}

function PersonColumn({
  title, salary, otherIncome, interestIncome, propertyIncome, grossedUpDiv, showDiv,
  investmentLoss, grossIncome, netTaxable, ngRefund, frankingCredit, tax, effRate, afterTaxTotal, isSplit,
  mandatorySuper, voluntarySuper, externalSGC, afterTaxSalary
}: PersonColumnProps) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ color: 'var(--color-accent)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, borderBottom: '1px solid var(--color-accent-border)', paddingBottom: '0.4rem', marginBottom: '0.5rem' }}>
        {title}
      </div>
      <SectionLabel>Income</SectionLabel>
      <TaxRow label="Salary" value={fmt(salary)} />
      {otherIncome !== undefined && otherIncome > 0 && <TaxRow label="Other income" value={fmt(otherIncome)} />}
      {interestIncome !== undefined && interestIncome > 0 && <TaxRow label="Interest" value={fmt(interestIncome)} />}
      {propertyIncome !== undefined && propertyIncome > 0 && <TaxRow label="Rental income" value={fmt(propertyIncome)} />}
      {showDiv && grossedUpDiv !== undefined && grossedUpDiv > 0 && <TaxRow label="Grossed-up div." value={fmt(grossedUpDiv)} />}
      <TaxRow label="Gross taxable" value={fmt(grossIncome)} />

      <SectionLabel>Deductions & tax</SectionLabel>
      {investmentLoss > 0 && (
        <TaxRow label={`Investment loss ${isSplit ? '(50%)' : ''}`} value={`−${fmt(investmentLoss)}`} type="neg" />
      )}
      <TaxRow label="Net taxable" value={fmt(netTaxable)} />
      {ngRefund > 0 && <TaxRow label="NG refund" value={`+${fmt(ngRefund)}`} type="pos" />}
      {frankingCredit !== undefined && frankingCredit > 0 && <TaxRow label="Franking credit" value={`+${fmt(frankingCredit)}`} type="pos" />}
      <TaxRow label="Tax + Medicare" value={`−${fmt(tax)}`} type="neg" />

      <div style={{ background: 'var(--color-accent-dim)', borderRadius: '6px', border: '1px solid var(--color-accent-border)', padding: '0.5rem 0.6rem', marginTop: '0.65rem' }}>
        <TaxRow label="Effective rate" value={fmtPct(effRate)} type="gold" />
        {(mandatorySuper !== undefined && mandatorySuper > 0) && (() => {
          const totalSuper = mandatorySuper + (voluntarySuper || 0) + (externalSGC || 0);
          const superAfterTax = totalSuper * (1 - SUPER_CONTRIBUTIONS_TAX);
          return (
            <>
              <div className="tax-row" style={{ borderBottom: 'none', padding: '0.1rem 0' }}>
                <span className="tax-row-label">Super (SGC — guaranteed)</span>
                <span className="tax-row-value" style={{ color: 'var(--color-accent)' }}>{fmt(mandatorySuper)}</span>
              </div>
              {externalSGC !== undefined && externalSGC > 0 && (
                <div className="tax-row" style={{ borderBottom: 'none', padding: '0.1rem 0' }}>
                  <span className="tax-row-label">Super (SGC — regular employer)</span>
                  <span className="tax-row-value" style={{ color: 'var(--color-accent)' }}>{fmt(externalSGC)}</span>
                </div>
              )}
              {voluntarySuper !== undefined && voluntarySuper > 0 && (
                <div className="tax-row" style={{ borderBottom: 'none', padding: '0.1rem 0' }}>
                  <span className="tax-row-label">Super (voluntary top-up)</span>
                  <span className="tax-row-value" style={{ color: 'var(--color-accent)' }}>{fmt(voluntarySuper)}</span>
                </div>
              )}
              <div className="tax-row" style={{ borderBottom: 'none', padding: '0.1rem 0' }}>
                <span className="tax-row-label" style={{ paddingLeft: '0.75rem', fontSize: '0.72rem' }}>
                  Total after 15% contributions tax
                </span>
                <span className="tax-row-value" style={{ color: 'var(--color-accent)', fontSize: '0.72rem' }}>{fmt(superAfterTax)}</span>
              </div>
            </>
          );
        })()}

        {afterTaxSalary !== undefined && (
          <>
            <div className="tax-row" style={{ borderBottom: 'none', padding: '0.1rem 0', borderTop: '1px solid var(--color-accent-border)', marginTop: '0.25rem', paddingTop: '0.4rem' }}>
              <span className="tax-row-label" style={{ fontWeight: 600 }}>After-tax salary</span>
              <span className="tax-row-value positive" style={{ fontWeight: 600 }}>{fmt(afterTaxSalary)}</span>
            </div>
            {afterTaxTotal !== afterTaxSalary && (
              <div className="tax-row" style={{ borderBottom: 'none', padding: '0.05rem 0' }}>
                <span className="tax-row-label" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', paddingLeft: '0.5rem' }}>
                  incl. property &amp; NG effects
                </span>
                <span className="tax-row-value" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                  {fmt(afterTaxTotal)}
                </span>
              </div>
            )}
          </>
        )}
        {afterTaxSalary === undefined && (
          <div className="tax-row" style={{ borderBottom: 'none', padding: '0.1rem 0', borderTop: '1px solid var(--color-accent-border)', marginTop: '0.25rem', paddingTop: '0.4rem' }}>
            <span className="tax-row-label" style={{ fontWeight: 600 }}>After-tax income</span>
            <span className="tax-row-value positive" style={{ fontWeight: 600 }}>{fmt(afterTaxTotal)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function PersonalTaxBreakdown() {
  const { inputs, results } = useTax();
  const [view, setView] = useState<'summary' | 'detail'>('summary');

  if (!results) return null;

  const hasSpouse = inputs.hasSpouse;

  // Compute owner figures:
  const ownerGross = results.recommendedSalary + results.basePersonalTaxableIncome + (inputs.drawDividend ? results.grossedUpDividend : 0);
  const ownerNetTaxable = results.totalPersonalTaxableIncome;
  const ownerTax = results.personalTaxTotal;
  const ownerNgRefund = results.ownerNegativeGearingRefund;
  const ownerEffRate = results.effectivePersonalRate;
  const ownerAfterTaxTotal = ownerGross - ownerTax;

  // Compute spouse figures:
  const spouseOtherIncome = inputs.spouseOtherIncome || 0;
  const spouseGross = results.spouseSalary + spouseOtherIncome;
  const spouseLoss = inputs.jointOwnership ? results.annualDeductibleInvestmentLoss / 2 : 0;
  const spouseNetTaxable = Math.max(0, spouseGross - spouseLoss);
  const spouseTaxOnBase = calcTotalPersonalTax(spouseOtherIncome);
  const spouseTotalTax = results.spouseTax + spouseTaxOnBase;
  const spouseEffRate = spouseGross > 0 ? (spouseTotalTax / spouseGross) * 100 : 0;
  const spouseAfterTaxTotal = spouseGross - spouseTotalTax;

  return (
    <div className="panel-card">
      <div className="panel-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span className="panel-card-dot" />
          {hasSpouse ? 'Personal Tax — Owner & Spouse' : 'Personal Tax'}
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
        <>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>

            {/* Owner summary column */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'var(--color-accent)', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 700, borderBottom: '1px solid var(--color-accent-border)', paddingBottom: '0.35rem', marginBottom: '0.6rem' }}>Owner</div>

              <div className="tax-row"><span className="tax-row-label">Company salary</span><span className="tax-row-value">{fmt(results.recommendedSalary)}</span></div>

              <div className="tax-row">
                <div>
                  <div className="tax-row-label">Income tax + Medicare</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>{fmtPct(results.effectivePersonalRate)} effective rate</div>
                </div>
                <span className="tax-row-value negative">−{fmt(results.personalTaxTotal)}</span>
              </div>

              <div style={{ background: 'var(--color-positive-dim)', border: '1px solid var(--color-positive-border)', borderRadius: '6px', padding: '0.45rem 0.65rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff' }}>Cash in hand</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-positive)' }}>{fmt(results.recommendedSalary - results.personalTaxOnSalary)}</span>
              </div>

              {ownerNgRefund > 0 && (
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                  Investment property generates a{' '}
                  <span style={{ color: 'var(--color-positive)', fontWeight: 600 }}>
                    +{fmt(ownerNgRefund)} tax refund
                  </span>{' '}
                  — included in tax figure above.
                </div>
              )}
            </div>

            {hasSpouse && <div style={{ width: '1px', background: 'var(--panel-border)', alignSelf: 'stretch', flexShrink: 0 }} />}

            {/* Spouse summary column */}
            {hasSpouse && (() => {
              const spouseOtherIncome = inputs.spouseOtherIncome || 0;
              const spouseGross = results.spouseSalary + spouseOtherIncome;
              const spouseTaxOnBase = calcTotalPersonalTax(spouseOtherIncome);
              const spouseTotalTax = results.spouseTax + spouseTaxOnBase;
              const spouseEffRate = spouseGross > 0 ? (spouseTotalTax / spouseGross) * 100 : 0;
              const spouseAfterTaxTotal = spouseGross - spouseTotalTax;
              return (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--color-accent)', textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 700, borderBottom: '1px solid var(--color-accent-border)', paddingBottom: '0.35rem', marginBottom: '0.6rem' }}>Spouse</div>

                  <div className="tax-row"><span className="tax-row-label">Salary {spouseOtherIncome > 0 ? '(all sources)' : '(company)'}</span><span className="tax-row-value">{fmt(spouseGross)}</span></div>

                  <div className="tax-row">
                    <div>
                      <div className="tax-row-label">Income tax + Medicare</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>{fmtPct(spouseEffRate)} effective rate</div>
                    </div>
                    <span className="tax-row-value negative">−{fmt(spouseTotalTax)}</span>
                  </div>

                  <div style={{ background: 'var(--color-positive-dim)', border: '1px solid var(--color-positive-border)', borderRadius: '6px', padding: '0.45rem 0.65rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff' }}>Cash in hand</span>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-positive)' }}>{fmt(spouseAfterTaxTotal)}</span>
                    </div>
                    {results.spouseSalary > 0 && spouseOtherIncome > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.2rem' }}>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', paddingLeft: '0.5rem' }}>· from your company</span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(74,222,128,0.6)' }}>{fmt(results.afterTaxSpouseSalary)}</span>
                      </div>
                    )}
                  </div>

                  {results.spouseNgRefund > 0 && (
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                      Investment property generates a{' '}
                      <span style={{ color: 'var(--color-positive)', fontWeight: 600 }}>
                        +{fmt(results.spouseNgRefund)} tax refund
                      </span>{' '}
                      — included in tax figure above.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {hasSpouse && (() => {
            const spouseTaxOnBase = calcTotalPersonalTax(inputs.spouseOtherIncome || 0);
            const spouseTotalTax = results.spouseTax + spouseTaxOnBase;
            return (
              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(167,139,250,0.08)', border: '1px solid var(--color-accent-border)', borderRadius: '6px', padding: '0.5rem 0.75rem', marginTop: '0.85rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Total family personal tax</span>
                <span style={{ color: 'var(--color-negative)', fontWeight: 700, fontSize: '0.85rem' }}>−{fmt(ownerTax + spouseTotalTax)}</span>
              </div>
            );
          })()}

          {inputs.optimiseFamilyTax && results.familyOptimisationMessage && (
            <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', borderRadius: '6px', border: results.familyOptimisationActive ? '1px solid var(--color-positive-border)' : '1px solid rgba(255,255,255,0.1)', background: results.familyOptimisationActive ? 'var(--color-positive-dim)' : 'rgba(255,255,255,0.04)' }}>
              {results.familyOptimisationActive && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--panel-text-mid)' }}>Potential family tax saving</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-positive)' }}>+{fmt(results.familyTaxSaving)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--panel-text-mid)' }}>Suggested extra spouse salary</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--panel-text)' }}>{fmt(results.extraSpouseSalary)}</span>
                  </div>
                </>
              )}
              <p style={{ fontSize: '0.72rem', color: 'var(--panel-text-dim)', lineHeight: 1.55, margin: 0 }}>{results.familyOptimisationMessage}</p>
            </div>
          )}
        </>
      )}

      {view === 'detail' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'flex-start' }}>
        <PersonColumn
          title="Owner"
          salary={results.recommendedSalary}
          interestIncome={inputs.interestIncome}
          propertyIncome={inputs.propertyIncome}
          showDiv={inputs.drawDividend}
          grossedUpDiv={results.grossedUpDividend}
          grossIncome={ownerGross}
          investmentLoss={results.ownerDeductibleInvestmentLoss}
          isSplit={inputs.jointOwnership}
          netTaxable={ownerNetTaxable}
          ngRefund={ownerNgRefund}
          frankingCredit={inputs.drawDividend ? results.frankingCredit : undefined}
          tax={ownerTax}
          effRate={ownerEffRate}
          afterTaxTotal={ownerAfterTaxTotal}
          mandatorySuper={results.recommendedSalary * SUPER_RATE}
          voluntarySuper={results.ownerVoluntaryContribution}
          afterTaxSalary={results.recommendedSalary - results.personalTaxOnSalary}
        />

        {hasSpouse && (
          <>
            <div style={{ background: 'var(--panel-border)', alignSelf: 'stretch', width: '1px' }} />
            <PersonColumn
              title="Spouse"
              salary={results.spouseSalary}
              otherIncome={spouseOtherIncome}
              grossIncome={spouseGross}
              investmentLoss={spouseLoss}
              isSplit={inputs.jointOwnership}
              netTaxable={spouseNetTaxable}
              ngRefund={results.spouseNgRefund}
              tax={spouseTotalTax}
              effRate={spouseEffRate}
              afterTaxTotal={spouseAfterTaxTotal}
              mandatorySuper={results.spouseSalary * SUPER_RATE}
              voluntarySuper={results.spouseVoluntaryContribution}
              externalSGC={inputs.spouseExternalSuperContribution > 0 ? inputs.spouseExternalSuperContribution : (inputs.spouseOtherIncome || 0) * SUPER_RATE}
              afterTaxSalary={results.spouseSalary > 0 ? results.afterTaxSpouseSalary : undefined}
            />
          </>
        )}
      </div>

      {hasSpouse && (
        <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(167,139,250,0.08)', border: '1px solid var(--color-accent-border)', borderRadius: '6px', padding: '0.5rem 0.75rem', marginTop: '0.85rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Total family personal tax</span>
          <span style={{ color: 'var(--color-negative)', fontWeight: 700, fontSize: '0.85rem' }}>−{fmt(ownerTax + spouseTotalTax)}</span>
        </div>
      )}

      {inputs.optimiseFamilyTax && results.familyOptimisationMessage && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.65rem 0.85rem',
          borderRadius: '6px',
          border: results.familyOptimisationActive
            ? '1px solid var(--color-positive-border)'
            : '1px solid rgba(255,255,255,0.1)',
          background: results.familyOptimisationActive
            ? 'var(--color-positive-dim)'
            : 'rgba(255,255,255,0.04)',
        }}>
          {results.familyOptimisationActive && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.45rem',
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--panel-text-mid)' }}>
                Potential family tax saving
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-positive)' }}>
                +{fmt(results.familyTaxSaving)}
              </span>
            </div>
          )}
          {results.familyOptimisationActive && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.45rem',
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--panel-text-mid)' }}>
                Suggested extra spouse salary
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--panel-text)' }}>
                {fmt(results.extraSpouseSalary)}
              </span>
            </div>
          )}
            <p style={{
              fontSize: '0.67rem',
              color: 'var(--panel-text-dim)',
              lineHeight: 1.55,
              margin: 0,
            }}>
              {results.familyOptimisationMessage}
            </p>
          </div>
        )}
        </>
      )}
    </div>
  );
}
