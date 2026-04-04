import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTax } from '../../context/TaxContext';
import InputField from '../../components/InputField';

export function WizardInput() {
  const { inputs, set } = useTax();

  const [hasExistingProperty, setHasExistingProperty] = useState(true);
  const [hasNewProperty, setHasNewProperty] = useState(true);
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
          value={Number(inputs[key]) || ''}
          onChange={e => set(key)(parseFloat(e.target.value) || 0)}
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
        <div className="section-label">
          <div className="section-label-title">Your business</div>
          <div className="section-label-sub">Revenue and expenses before your pay</div>
        </div>
        {renderInput('Annual revenue (inc. GST)', 'The total on your invoices for the year', 'businessIncomeGST', '/ yr')}
        {renderInput('Business expenses', "What you spend to run the business — not your pay or super", 'deductibleExpenses', '/ yr')}
      </div>

      {/* ── Lifestyle ── */}
      <div className="form-section">
        <div className="section-label">
          <div className="section-label-title">Lifestyle costs</div>
          <div className="section-label-sub">What your salary needs to cover each month</div>
        </div>
        {renderInput('Monthly living expenses', 'Rent or mortgage interest, food, utilities, transport, subscriptions', 'monthlyLiving', '/ mo')}
        {renderInput('Monthly loan repayments', 'Principal repayments on your home loan — leave as 0 if none', 'monthlyRepayments', '/ mo')}
      </div>

      {/* ── Existing properties ── */}
      <div className="form-section">
        <div className="section-label">
          <div className="section-label-title">Existing investment properties</div>
          <div className="section-label-sub">Income from properties you currently own</div>
        </div>
        <div className="yn-row">
          <button
            className={`yn-btn${hasExistingProperty ? ' sel' : ''}`}
            onClick={() => setHasExistingProperty(true)}
          >Yes</button>
          <button
            className={`yn-btn${!hasExistingProperty ? ' sel' : ''}`}
            onClick={() => { setHasExistingProperty(false); set('propertyIncome')(0); }}
          >No</button>
        </div>
        {hasExistingProperty && (
          <>
            {renderInput('Total annual rental income', 'Gross rent received across all your current properties', 'propertyIncome', '/ yr')}
            <div className="info-box">
              This rental income is taxable and increases your personal tax bill — but since the cash goes straight to repayments, it's not counted as money you can spend.
            </div>
          </>
        )}
      </div>

      {/* ── New property scenario ── */}
      <div className="form-section">
        <div className="section-label">
          <div className="section-label-title">New property scenario</div>
          <div className="section-label-sub">Model the impact of a potential new purchase</div>
        </div>
        <div className="yn-row">
          <button
            className={`yn-btn${hasNewProperty ? ' sel' : ''}`}
            onClick={() => setHasNewProperty(true)}
          >Yes — model it</button>
          <button
            className={`yn-btn${!hasNewProperty ? ' sel' : ''}`}
            onClick={() => { setHasNewProperty(false); set('monthlyDeductibleInvestmentLoss')(0); set('jointOwnership')(false); }}
          >No, skip</button>
        </div>
        {hasNewProperty && (
          <>
            {renderInput('Expected monthly shortfall', 'Net cost per month after rent: interest + rates + insurance + depreciation − rent received', 'monthlyDeductibleInvestmentLoss', '/ mo')}
            <div className="info-box">
              This shortfall is a deductible loss — it reduces your taxable income and generates a tax refund, which reduces the salary you need to draw.
            </div>
          </>
        )}
      </div>

      {/* ── Spouse & family ── */}
      <div className="form-section">
        <div className="section-label">
          <div className="section-label-title">Spouse &amp; family</div>
          <div className="section-label-sub">Model the impact of your spouse's income on family tax</div>
        </div>

        <div
          className="toggle-row"
          style={{ marginBottom: '0.75rem', cursor: 'pointer' }}
          onClick={() => {
            const next = !inputs.hasSpouse;
            set('hasSpouse')(next);
            if (!next) {
              set('optimiseFamilyTax')(false);
              set('spouseOtherIncome')(0);
              set('spouseExternalSuperContribution')(0);
              set('jointOwnership')(false);
            }
          }}
        >
          <div>
            <div className="toggle-label">I have a spouse or partner</div>
            <div className="toggle-sublabel">Shows spouse tax position and enables family tax optimisation</div>
          </div>
          <div className={`toggle-switch ${inputs.hasSpouse ? 'on' : ''}`} />
        </div>

        {inputs.hasSpouse && (
          <>
            {renderInput("Spouse's employment income", 'Their salary or wages from their regular job', 'spouseOtherIncome', '/ yr')}

            {hasNewProperty && (
              <div
                className="toggle-row"
                style={{ marginTop: '0.5rem', cursor: 'pointer' }}
                onClick={() => set('jointOwnership')(!inputs.jointOwnership)}
              >
                <div>
                  <div className="toggle-label">Would the new property be jointly owned?</div>
                  <div className="toggle-sublabel">Splits the deductible loss 50/50 on your tax returns</div>
                </div>
                <div className={`toggle-switch ${inputs.jointOwnership ? 'on' : ''}`} />
              </div>
            )}

            {inputs.maximiseSuper && inputs.hasSpouse && (
              <>
                <InputField
                  label="Spouse's employer super (annual)"
                  sublabel="SGC already paid by their regular employer"
                  value={inputs.spouseExternalSuperContribution > 0 ? inputs.spouseExternalSuperContribution : Math.round((inputs.spouseOtherIncome || 0) * 0.12)}
                  onChange={set('spouseExternalSuperContribution')}
                />
                <div className="info-box" style={{ marginTop: '0.4rem', marginBottom: '0.5rem' }}>
                  We estimate this as 12% of your spouse's employment income. Only override if their employer pays a different rate.
                </div>
              </>
            )}

            <div
              className="toggle-row"
              style={{ padding: '0.4rem 0.6rem', marginTop: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}
              onClick={() => set('optimiseFamilyTax')(!inputs.optimiseFamilyTax)}
            >
              <div>
                <div className="toggle-label">Pay spouse to reduce family tax</div>
                <div className="toggle-sublabel">If your tax bracket is higher than your spouse's, suggests an optimal extra salary to pay them from company profit</div>
              </div>
              <div className={`toggle-switch ${inputs.optimiseFamilyTax ? 'on' : ''}`} />
            </div>

            {inputs.jointOwnership && (
              <div className="info-box" style={{ marginTop: '0.5rem' }}>
                Joint property ownership is on — the investment loss and rental income are split 50/50 on your tax returns.
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Other income & strategy ── */}
      <div className="form-section">
        <div className="section-label">
          <div className="section-label-title">Other income &amp; strategy</div>
          <div className="section-label-sub">Optional — skip anything that doesn't apply</div>
        </div>

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
          'Pay maximum super this year',
          'Caps concessional contributions at $30,000 — reduces company tax',
          inputs.maximiseSuper,
          () => set('maximiseSuper')(!inputs.maximiseSuper),
          <span style={{ fontSize: '0.67rem', color: 'var(--text-dim)', lineHeight: 1.5, display: 'block' }}>
            Your salary will be set so the company can contribute the full $30,000 concessional limit. Note: the mandatory 12% SGC always applies regardless of this setting.
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
