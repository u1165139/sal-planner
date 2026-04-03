import React from 'react';

interface InputFieldProps {
  label: string;
  sublabel?: string;
  value: number;
  onChange: (val: number) => void;
  prefix?: string;
  monthly?: boolean;
  error?: string;
}

export default function InputField({
  label,
  sublabel,
  value,
  onChange,
  prefix = '$',
  monthly = false,
  error,
}: InputFieldProps) {

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseFloat(rawValue);
    
    // Always call onChange with a valid number, defaulting to 0 for empty/invalid inputs.
    onChange(Number.isFinite(numericValue) ? numericValue : 0);
  };

  // The input's display value is now directly controlled by the parent's `value` prop.
  // We show an empty string if the value is 0, for a better user experience.
  const displayValue = Number.isFinite(value) && value === 0 ? '' : String(value);

  return (
    <div className="input-group">
      <label className="input-label">
        {label}
        {sublabel && <span className="input-sublabel">{sublabel}</span>}
      </label>
      <div className={`input-wrapper ${error ? 'has-error' : ''}`}>
        <span className="input-prefix">{prefix}</span>
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={(e) => e.target.select()}
          className="input-field"
          placeholder="0"
        />
        {monthly && <span className="input-suffix">/mo</span>}
      </div>
      {error && <div className="input-error-message">{error}</div>}
    </div>
  );
}
