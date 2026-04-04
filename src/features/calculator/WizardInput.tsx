import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTax } from '../../context/TaxContext';

export function WizardInput() {
  const { inputs, set } = useTax();

  const [hasExistingProperty, setHasExistingProperty] = useState(true);
  const [hasNewProperty, setHasNewProperty] = useState(true);
  const [existingJoint, setExistingJoint] = useState(false);
  const [newJoint, setNewJoint] = useState(false);
  const [interestOn, setInterestOn] = useState(inputs.interestIncome > 0);

  const renderInput = (label: string, sublabel: string, key: keyof typeof inputs, suffix = '/ yr') => (
    <div className="input-group">
      <label className="input-label">{label}</label>
      {sublabel && <span className="input-sublabel">{sublabel}</span>}
      <div className="input-wrapper">
        <span className="input-prefix">$</span>
        <input
          type="number"
          className="input-field"
          value={(inputs as any)[key] || ''}
          onChange={e => set(key as any)(parseFloat(e.target.value) || 0)}
          placeholder="0"
        />
        <span className="input-suffix">{suffix}</span>
      </div>
    </div>
  );

  const renderToggleCard = (
    label: string,
    sublabel: string,
    isOn: boolean,
    onToggle: () => void,
    body?: ReactNode
  ) => (
    <div className="toggle-card" onClick={onToggle}>
      <div className="toggle-card-row">
        <div>
          <div className="toggle-card-label">{label}</div>
          <div className="toggle-card-sublabel">{sublabel}</div>
        </div>
        <div className={`toggle-switch ${isOn ? 'on' : ''}`} />
      </div>
      {isOn && body && (
        <div className="toggle-body" onClick={e => e.stopPropagation()}>
          {body}
        </div>
      )}
    </div>
  );

  return (
    <div className="single-form">

      {/* ── Business ── */}
      <div className="form-section">
        <div className="section-label">Your business</div>
        <div className="step-hint">Use the total your clients pay you — including GST. We'll strip the GST out automatically.</div>
        {renderInput('Annual revenue (inc. GST)', 'The total on your invoices for the year', 'businessIncomeGST', '/ yr')}
        {renderInput('Business expenses', "What you spend to run the business — not your pay or super", 'deductibleExpenses', '/ yr')}
      </div>

      {/* ── Lifestyle ── */}
      <div className="form-section">
        <div className="section-label">Lifestyle costs</div>
        <div className="step-hint">This is what the calculator will make sure your salary covers after tax.</div>
        {renderInput('Monthly living expenses', 'Rent or mortgage interest, food, utilities, transport, subscriptions', 'monthlyLiving', '/ mo')}
        {renderInput('Monthly loan repayments', 'Principal repayments on your home loan — leave as 0 if none', 'monthlyRepayments', '/ mo')}
      </div>

      {/* ── Existing properties ── */}
      <div className="form-section">
        <div className="section-label">Existing investment properties</div>
        <div className="step-hint">Income from properties you currently own — this affects your tax position today.</div>
        <div className="yn-row">
          <button
            className={`yn-btn${hasExistingProperty ? ' sel' : ''}`}
            onClick={() => setHasExistingProperty(true)}
          >Yes</button>
          <button
            className={`yn-btn${!hasExistingProperty ? ' sel' : ''}`}
            onClick={() => { setHasExistingProperty(false); set('propertyIncome')(0); setExistingJoint(false); set('jointOwnership')(newJoint); }}
          >No</button>
        </div>
        {hasExistingProperty && (
          <>
            {renderInput('Total annual rental income', 'Gross rent received across all your current properties', 'propertyIncome', '/ yr')}
            <div className="info-box">
              This rental income is taxable and increases your personal tax bill — but since the cash goes straight to repayments, it's not counted as money you can spend.
            </div>
            {renderToggleCard(
              'Any properties owned jointly with your spouse?',
              'Splits the rental income and tax deductions 50/50',
              existingJoint,
              () => {
                const next = !existingJoint;
                setExistingJoint(next);
                const turningOn = next || newJoint;
                set('jointOwnership')(turningOn);
                if (turningOn && (inputs.spouseOtherIncome === 0 || inputs.spouseOtherIncome === undefined)) {
                  set('spouseOtherIncome')(100000);
                }
              },
              <span style={{ fontSize: '0.67rem', color: 'var(--text-dim)', lineHeight: 1.5, display: 'block' }}>
                Both the rental income and any deductible losses will be split equally between you and your spouse on your respective tax returns.
              </span>
            )}
          </>
        )}
      </div>

      {/* ── New property scenario ── */}
      <div className="form-section">
        <div className="section-label">New property scenario</div>
        <div className="step-hint">Model the tax and cash flow impact of a potential new purchase — skip this if it doesn't apply.</div>
        <div className="yn-row">
          <button
            className={`yn-btn${hasNewProperty ? ' sel' : ''}`}
            onClick={() => setHasNewProperty(true)}
          >Yes — model it</button>
          <button
            className={`yn-btn${!hasNewProperty ? ' sel' : ''}`}
            onClick={() => { setHasNewProperty(false); set('monthlyDeductibleInvestmentLoss')(0); setNewJoint(false); set('jointOwnership')(existingJoint); }}
          >No, skip</button>
        </div>
        {hasNewProperty && (
          <>
            {renderInput('Expected monthly shortfall', 'Net cost per month after rent: interest + rates + insurance + depreciation − rent received', 'monthlyDeductibleInvestmentLoss', '/ mo')}
            <div className="info-box">
              This shortfall is a deductible loss — it reduces your taxable income and generates a tax refund, which reduces the salary you need to draw.
            </div>
            {renderToggleCard(
              'Would this property be jointly owned with your spouse?',
              'Splits the deductible loss 50/50 between you',
              newJoint,
              () => {
                const next = !newJoint;
                setNewJoint(next);
                const turningOn = existingJoint || next;
                set('jointOwnership')(turningOn);
                if (turningOn && (inputs.spouseOtherIncome === 0 || inputs.spouseOtherIncome === undefined)) {
                  set('spouseOtherIncome')(100000);
                }
              },
              <span style={{ fontSize: '0.67rem', color: 'var(--text-dim)', lineHeight: 1.5, display: 'block' }}>
                Each person claims half the deductible loss, which may reduce the total tax refund depending on your spouse's marginal rate.
              </span>
            )}
          </>
        )}
      </div>

      {/* ── Other income & strategy ── */}
      <div className="form-section">
        <div className="section-label">Other income &amp; strategy</div>
        <div className="step-hint">All of these are optional — skip anything that doesn't apply to you.</div>

        {renderToggleCard(
          'I earn interest on savings',
          'Bank or term deposit interest — this is spendable cash',
          interestOn,
          () => {
            const next = !interestOn;
            setInterestOn(next);
            if (!next) set('interestIncome')(0);
          },
          renderInput('Annual interest income', '', 'interestIncome', '/ yr')
        )}

        {renderToggleCard(
          'Split salary with my spouse',
          'Optimizer distributes salary between you both to minimize total family tax',
          inputs.enableSpouseSplitting,
          () => set('enableSpouseSplitting')(!inputs.enableSpouseSplitting)
        )}

        {(inputs.enableSpouseSplitting || inputs.jointOwnership) && (
          <>
            {renderInput("Spouse's Employment Income (Annual)", 'Their salary or wages from their regular job — before any income from your company', 'spouseOtherIncome', '/ yr')}
            <div className="info-box" style={{ marginTop: '0.6rem', marginBottom: '1rem' }}>
              The optimizer will fill your spouse's lower tax brackets first (starting with the $18,200 tax-free threshold) to maximize your family's savings.
            </div>

            {renderToggleCard(
              'Minimise bracket tax',
              'Pay your spouse an additional salary from company profit to move income out of your higher tax bracket — only if it reduces total family tax.',
              inputs.optimiseFamilyTax,
              () => set('optimiseFamilyTax')(!inputs.optimiseFamilyTax)
            )}
          </>
        )}

        {renderToggleCard(
          'Pay maximum super this year',
          'Caps concessional contributions at $30,000 — reduces company tax',
          inputs.maximiseSuper,
          () => set('maximiseSuper')(!inputs.maximiseSuper),
          <span style={{ fontSize: '0.67rem', color: 'var(--text-dim)', lineHeight: 1.5, display: 'block' }}>
            Your salary will be set so the company can contribute the full $30,000 concessional limit. Note: the mandatory 11.5% SGC always applies regardless of this setting.
          </span>
        )}

        {renderToggleCard(
          'Show dividend scenario',
          'What if you drew remaining company profit as a franked dividend?',
          inputs.drawDividend,
          () => set('drawDividend')(!inputs.drawDividend),
          <span style={{ fontSize: '0.67rem', color: 'var(--text-dim)', lineHeight: 1.5, display: 'block' }}>
            Models drawing all after-tax company profit as a fully franked dividend — shows the top-up tax you'd owe (or the refund you'd receive) via your personal return.
          </span>
        )}
      </div>

    </div>
  );
}
