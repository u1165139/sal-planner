import { TaxProvider } from './context/TaxProvider';
import { ResultsDisplay } from './features/results/ResultsDisplay';
import { InputTabs } from './features/calculator/InputTabs';

export default function App() {
  return (
    <TaxProvider>
      <div className="app-shell">

        {/* ══════════════ LEFT PANEL — Inputs ══════════════ */}
        <div className="left-panel">

          <div className="header">
            <div className="header-eyebrow">AU · 2025–26 Tax Year</div>
            <h1>Salary vs <span>Dividends</span> Optimisation</h1>
            <div className="header-sub">Small Business Base Rate Entity · Company Tax 25%</div>
          </div>

          <InputTabs />

        </div>

        {/* ══════════════ RIGHT PANEL — Results ══════════════ */}
        <div className="right-panel">
          <ResultsDisplay />
        </div>

      </div>
    </TaxProvider>
  );
}
