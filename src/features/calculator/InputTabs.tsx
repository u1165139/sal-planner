import { useTax } from '../../context/TaxContext';
import InputField from '../../components/InputField';

export function InputTabs() {
  const { inputs, set, activeTab, setActiveTab, validationErrors } = useTax();

  const getError = (field: string) => {
    return validationErrors?.issues.find(e => e.path[0] === field)?.message;
  };

  return (
    <>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {(['business', 'personal'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '0.45rem 0',
              borderRadius: '7px',
              border: activeTab === tab ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: activeTab === tab ? 'var(--accent-dim)' : 'var(--surface2)',
              color: activeTab === tab ? 'var(--accent)' : 'var(--text-dim)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {tab === 'business' ? 'Business' : 'Personal'}
          </button>
        ))}
      </div>

      {/* Business Financials */}
      {activeTab === 'business' && (
        <div className="card section">
          <div className="card-title"><span className="card-title-dot" />Business Financials</div>
          <InputField
            label="Business Income incl. GST (Annual)"
            sublabel="Total revenue including GST received"
            value={inputs.businessIncomeGST}
            onChange={set('businessIncomeGST')}
            error={getError('businessIncomeGST')}
          />
          <InputField
            label="Deductible Expenses (Annual)"
            sublabel="Excluding owner's salary & super"
            value={inputs.deductibleExpenses}
            onChange={set('deductibleExpenses')}
            error={getError('deductibleExpenses')}
          />
        </div>
      )}

      {/* Personal Finances */}
      {activeTab === 'personal' && (
        <div className="card section">
          <div className="card-title"><span className="card-title-dot" />Personal Finances</div>
          <InputField
            label="Monthly Living Expenses"
            sublabel="Rent, food, utilities, transport, etc."
            value={inputs.monthlyLiving}
            onChange={set('monthlyLiving')}
            monthly
            error={getError('monthlyLiving')}
          />
          <InputField
            label="Monthly Extra Repayments"
            sublabel="Loan / mortgage repayments beyond interest"
            value={inputs.monthlyRepayments}
            onChange={set('monthlyRepayments')}
            monthly
            error={getError('monthlyRepayments')}
          />
          <InputField
            label="Monthly Deductible Investment Loss"
            sublabel="e.g., Interest or depreciation. This generates a personal tax refund."
            value={inputs.monthlyDeductibleInvestmentLoss}
            onChange={set('monthlyDeductibleInvestmentLoss')}
            monthly
            error={getError('monthlyDeductibleInvestmentLoss')}
          />
          <InputField
            label="Annual Interest Income"
            sublabel="Cash savings interest — spendable"
            value={inputs.interestIncome}
            onChange={set('interestIncome')}
            error={getError('interestIncome')}
          />
          <InputField
            label="Annual Property Income (Positively Geared)"
            sublabel="Taxable, but cash tied up in repayments"
            value={inputs.propertyIncome}
            onChange={set('propertyIncome')}
            error={getError('propertyIncome')}
          />
        </div>
      )}

      {/* Superannuation */}
      <div className="card section">
        <div className="card-title"><span className="card-title-dot" />Superannuation</div>
        <div
          className="toggle-row"
          onClick={() => set('maximiseSuper')(!inputs.maximiseSuper)}
        >
          <div>
            <div className="toggle-label">Maximise Concessional Contributions</div>
            <div className="toggle-sublabel">SGC 11.5% of salary · Capped at $30,000 · Deductible to company</div>
          </div>
          <div className={`toggle-switch ${inputs.maximiseSuper ? 'on' : ''}`} />
        </div>
      </div>

      {/* Distribution Strategy */}
      <div className="card section">
        <div className="card-title"><span className="card-title-dot" />Distribution Strategy</div>
        <div
          className="toggle-row"
          onClick={() => set('drawDividend')(!inputs.drawDividend)}
        >
          <div>
            <div className="toggle-label">Draw Remaining Profit as Dividend</div>
            <div className="toggle-sublabel">Models drawing all after-tax company profit as a franked dividend to see your total individual tax position.</div>
          </div>
          <div className={`toggle-switch ${inputs.drawDividend ? 'on' : ''}`} />
        </div>
      </div>

      {/* Spouse Income Splitting */}
      <div className="card section">
        <div className="card-title"><span className="card-title-dot" />Spouse Income Splitting</div>
        <div
          className="toggle-row"
          onClick={() => set('enableSpouseSplitting')(!inputs.enableSpouseSplitting)}
          style={{ marginBottom: inputs.enableSpouseSplitting ? '1rem' : 0 }}
        >
          <div>
            <div className="toggle-label">Enable Spouse Splitting</div>
            <div className="toggle-sublabel">The calculator will optimize salary distribution between you and your spouse to minimize total tax paid.</div>
          </div>
          <div className={`toggle-switch ${inputs.enableSpouseSplitting ? 'on' : ''}`} />
        </div>
        
        {inputs.enableSpouseSplitting && (
          <InputField
            label="Spouse's Other Annual Income"
            sublabel="Base income before any company salary"
            value={inputs.spouseOtherIncome}
            onChange={set('spouseOtherIncome')}
            error={getError('spouseOtherIncome')}
          />
        )}
      </div>
    </>
  );
}
