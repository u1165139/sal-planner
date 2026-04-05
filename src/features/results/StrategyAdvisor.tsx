import { useMemo } from 'react';
import { useTax } from '../../context/TaxContext';
import { generateSuggestions } from '../../core/optimizer';
import { fmt } from '../../utils/formatters';

export function StrategyAdvisor() {
  const { inputs, results, setInputs } = useTax();

  const suggestions = useMemo(() => {
    if (!results) return [];
    return generateSuggestions(inputs, results);
  }, [inputs, results]);

  if (!results) return null;

  const apply = (toggles: Record<string, unknown>) => {
    setInputs(prev => ({ ...prev, ...toggles }));
  };

  if (suggestions.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        marginTop: '0.75rem', padding: '0.5rem 0.75rem',
        borderRadius: '6px', background: 'rgba(74,222,128,0.06)',
        border: '1px solid rgba(74,222,128,0.15)',
      }}>
        <span style={{ color: '#4ade80', fontSize: '0.8rem' }}>✓</span>
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
          Strategy is optimal — no changes would improve your outcome
        </span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.4rem',
      marginBottom: '0.75rem',
    }}>
      {suggestions.map((s, i) => {
        const savesTax = s.taxDelta < -200;
        const addsWealth = s.wealthDelta > 200;

        let highlightText = '';
        if (savesTax) highlightText = `saves ${fmt(Math.abs(s.taxDelta))} tax`;
        else if (addsWealth) highlightText = `+${fmt(s.wealthDelta)} wealth`;

        return (
          <div key={i} title={s.description} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.4rem 0.35rem 0.65rem',
            borderRadius: '20px',
            background: 'rgba(74,222,128,0.06)',
            border: '1px solid rgba(74,222,128,0.2)',
          }}>
            <span style={{ fontSize: '0.7rem', color: '#fff', whiteSpace: 'nowrap' }}>
              💡 {s.label}
              {highlightText && <span style={{ color: '#4ade80', fontWeight: 600, marginLeft: '0.3rem' }}>→ {highlightText}</span>}
            </span>
            <button
              onClick={() => apply(s.toggles as Record<string, unknown>)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '1.4rem',
                height: '1.4rem',
                borderRadius: '50%',
                background: 'rgba(74,222,128,0.15)',
                border: 'none',
                color: '#4ade80',
                fontSize: '0.75rem',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              ✓
            </button>
          </div>
        );
      })}
    </div>
  );
}
