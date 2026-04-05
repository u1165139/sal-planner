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
      flexDirection: 'column',
      gap: '0.5rem',
      marginBottom: '0.75rem',
    }}>
      {suggestions.map((s, i) => {
        const savesTax = s.taxDelta < -200;
        const addsWealth = s.wealthDelta > 200;

        return (
          <div key={i} style={{
            borderRadius: '8px',
            border: '1px solid rgba(74,222,128,0.25)',
            background: 'rgba(74,222,128,0.05)',
            padding: '0.65rem 0.85rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff', marginBottom: '0.2rem' }}>
                  💡 {s.label}
                </div>
                <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.45, marginBottom: '0.4rem' }}>
                  {s.description}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {savesTax && (
                    <span style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 600 }}>
                      Saves {fmt(Math.abs(s.taxDelta))} tax
                    </span>
                  )}
                  {addsWealth && (
                    <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: 600 }}>
                      +{fmt(s.wealthDelta)} total wealth
                    </span>
                  )}
                  {savesTax && !addsWealth && (
                    <span style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.3)' }}>wealth unchanged</span>
                  )}
                  {!savesTax && addsWealth && (
                    <span style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.3)' }}>slight tax increase</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => apply(s.toggles as Record<string, unknown>)}
                style={{
                  flexShrink: 0,
                  padding: '0.35rem 0.85rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(74,222,128,0.4)',
                  background: 'rgba(74,222,128,0.12)',
                  color: '#4ade80',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Apply
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
