import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTax } from '../../context/TaxContext';

export function WizardInput() {
  const { inputs, set, wizardStep: step, setWizardStep: setStep } = useTax();

  const [hasExistingProperty, setHasExistingProperty] = useState(true);
  const [hasNewProperty, setHasNewProperty] = useState(true);
  const [existingJoint, setExistingJoint] = useState(false);
  const [newJoint, setNewJoint] = useState(false);
  const [interestOn, setInterestOn] = useState(inputs.interestIncome > 0);

  const totalSteps = 6;

  const renderProgress = (currentStep: number) => (
    <div className="wizard-progress">
      {Array.from({ length: totalSteps }, (_, i) => {
        let cls = 'pip';
        if (i < currentStep) cls += ' done';
        else if (i === currentStep) cls += ' active';
        return <div key={i} className={cls} />;
      })}
    </div>
  );

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

  const reviewRow = (label: string, value: string, accent = false) => (
    <div className="review-row">
      <span className="review-label">{label}</span>
      <span className={`review-val${accent ? ' accent' : ''}`}>{value}</span>
    </div>
  );

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString('en-AU');
  const fmtYr = (n: number) => fmt(n) + ' / yr';
  const fmtMo = (n: number) => fmt(n) + ' / mo';

  return (
    <>
      {/* ── Step 1: Business ── */}
      {step === 1 && (
        <>
          {renderProgress(1)}
          <div className="step-eyebrow">Step 1 of 6 · Your business</div>
          <div className="step-q">How much does your business bring in?</div>
          <div className="step-hint">Use the total your clients pay you — including GST. We'll strip the GST out automatically.</div>
          {renderInput('Annual revenue (inc. GST)', 'The total on your invoices for the year', 'businessIncomeGST', '/ yr')}
          {renderInput('Business expenses', "What you spend to run the business — not your pay or super", 'deductibleExpenses', '/ yr')}
          <div className="wizard-nav">
            <button className="btn-next" onClick={() => setStep(2)}>Next →</button>
          </div>
        </>
      )}

      {/* ── Step 2: Lifestyle ── */}
      {step === 2 && (
        <>
          {renderProgress(2)}
          <div className="step-eyebrow">Step 2 of 6 · Your lifestyle costs</div>
          <div className="step-q">How much do you need to live on each month?</div>
          <div className="step-hint">This is what the calculator will make sure your salary covers after tax.</div>
          {renderInput('Monthly living expenses', 'Rent or mortgage interest, food, utilities, transport, subscriptions', 'monthlyLiving', '/ mo')}
          {renderInput('Monthly loan repayments', 'Principal repayments on your home loan — leave as 0 if none', 'monthlyRepayments', '/ mo')}
          <div className="wizard-nav">
            <button className="btn-back" onClick={() => setStep(1)}>← Back</button>
            <button className="btn-next" onClick={() => setStep(3)}>Next →</button>
          </div>
        </>
      )}

      {/* ── Step 3: Existing properties ── */}
      {step === 3 && (
        <>
          {renderProgress(3)}
          <div className="step-eyebrow">Step 3 of 6 · Existing investment properties</div>
          <div className="step-q">Do you already own investment properties?</div>
          <div className="step-hint">Income from properties you currently own — this affects your tax position today.</div>

          <div className="yn-row">
            <button
              className={`yn-btn${hasExistingProperty ? ' sel' : ''}`}
              onClick={() => setHasExistingProperty(true)}
            >Yes</button>
            <button
              className={`yn-btn${!hasExistingProperty ? ' sel' : ''}`}
              onClick={() => { setHasExistingProperty(false); set('propertyIncome')(0); setStep(4); }}
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
                  set('jointOwnership')(next || newJoint);
                },
                <span style={{ fontSize: '0.67rem', color: 'var(--text-dim)', lineHeight: 1.5, display: 'block' }}>
                  Both the rental income and any deductible losses will be split equally between you and your spouse on your respective tax returns.
                </span>
              )}
            </>
          )}

          <div className="wizard-nav">
            <button className="btn-back" onClick={() => setStep(2)}>← Back</button>
            <button className="btn-next" onClick={() => setStep(4)}>Next →</button>
          </div>
        </>
      )}

      {/* ── Step 4: New property scenario ── */}
      {step === 4 && (
        <>
          {renderProgress(4)}
          <div className="step-eyebrow">Step 4 of 6 · New property scenario</div>
          <div className="step-q">Thinking about buying another investment property?</div>
          <div className="step-hint">Model the tax and cash flow impact of a potential new purchase — skip this if it doesn't apply.</div>

          <div className="yn-row">
            <button
              className={`yn-btn${hasNewProperty ? ' sel' : ''}`}
              onClick={() => setHasNewProperty(true)}
            >Yes — model it</button>
            <button
              className={`yn-btn${!hasNewProperty ? ' sel' : ''}`}
              onClick={() => { setHasNewProperty(false); set('monthlyDeductibleInvestmentLoss')(0); setStep(5); }}
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
                  set('jointOwnership')(existingJoint || next);
                },
                <span style={{ fontSize: '0.67rem', color: 'var(--text-dim)', lineHeight: 1.5, display: 'block' }}>
                  Each person claims half the deductible loss, which may reduce the total tax refund depending on your spouse's marginal rate.
                </span>
              )}
            </>
          )}

          <div className="wizard-nav">
            <button className="btn-back" onClick={() => setStep(3)}>← Back</button>
            <button className="btn-next" onClick={() => setStep(5)}>Next →</button>
          </div>
        </>
      )}

      {/* ── Step 5: Other income & strategy ── */}
      {step === 5 && (
        <>
          {renderProgress(5)}
          <div className="step-eyebrow">Step 5 of 6 · Other income &amp; strategy</div>
          <div className="step-q">Anything else to factor in?</div>
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
            () => set('enableSpouseSplitting')(!inputs.enableSpouseSplitting),
            <>
              {renderInput("Spouse's other annual income", 'Their income before any salary from your company', 'spouseOtherIncome', '/ yr')}
              <div className="info-box" style={{ marginTop: '0.6rem', marginBottom: 0 }}>
                The optimizer will fill your spouse's lower tax brackets first (starting with the $18,200 tax-free threshold) to maximize your family's savings.
              </div>
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

          <div className="wizard-nav">
            <button className="btn-back" onClick={() => setStep(4)}>← Back</button>
            <button className="btn-next" onClick={() => setStep(6)}>Review →</button>
          </div>
        </>
      )}

      {/* ── Step 6: Review ── */}
      {step === 6 && (
        <>
          {renderProgress(6)}
          <div className="step-eyebrow">Step 6 of 6 · Review</div>
          <div className="step-q">Does everything look right?</div>
          <div className="step-hint">Go back to change anything — your results are updating live on the right.</div>

          <div className="review-section">
            <div className="review-header">Business</div>
            <div className="review-body">
              {reviewRow('Annual revenue (inc. GST)', fmtYr(inputs.businessIncomeGST))}
              {reviewRow('Business expenses', fmtYr(inputs.deductibleExpenses))}
              {reviewRow('Net profit (ex. GST)', fmtYr(inputs.businessIncomeGST / 1.1 - inputs.deductibleExpenses), true)}
            </div>
          </div>

          <div className="review-section">
            <div className="review-header">Lifestyle</div>
            <div className="review-body">
              {reviewRow('Monthly living expenses', fmtMo(inputs.monthlyLiving))}
              {reviewRow('Monthly loan repayments', fmtMo(inputs.monthlyRepayments))}
              {reviewRow('Cash needed per year', fmtYr((inputs.monthlyLiving + inputs.monthlyRepayments) * 12), true)}
            </div>
          </div>

          {hasExistingProperty && (
            <div className="review-section">
              <div className="review-header">Existing properties</div>
              <div className="review-body">
                {reviewRow('Annual rental income', fmtYr(inputs.propertyIncome))}
                {reviewRow('Jointly owned', existingJoint ? 'Yes — 50/50 split' : 'No')}
              </div>
            </div>
          )}

          {hasNewProperty && (
            <div className="review-section">
              <div className="review-header">New property scenario</div>
              <div className="review-body">
                {reviewRow('Monthly property shortfall', fmtMo(inputs.monthlyDeductibleInvestmentLoss))}
                {reviewRow('Jointly owned', newJoint ? 'Yes — 50/50 split' : 'No')}
              </div>
            </div>
          )}

          <div className="review-section">
            <div className="review-header">Other settings</div>
            <div className="review-body">
              {reviewRow('Interest income', fmtYr(inputs.interestIncome))}
              {reviewRow('Spouse salary splitting', inputs.enableSpouseSplitting ? `Yes (spouse income: ${fmt(inputs.spouseOtherIncome)})` : 'No')}
              {reviewRow('Maximise super ($30k cap)', inputs.maximiseSuper ? 'Yes' : 'No')}
              {reviewRow('Dividend scenario', inputs.drawDividend ? 'Yes' : 'No')}
            </div>
          </div>

          <button className="btn-calculate" onClick={() => {}}>
            Results updating live →
          </button>

          <div className="wizard-nav" style={{ marginTop: '0.75rem' }}>
            <button className="btn-back" style={{ flex: 1 }} onClick={() => setStep(5)}>← Edit inputs</button>
          </div>
        </>
      )}
    </>
  );
}
