import React, { useState, useEffect } from 'react';

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
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    const parsed = parseFloat(localValue);
    if (parsed !== value && !(isNaN(parsed) && value === 0)) {
      setLocalValue(String(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (/^\d*\.?\d*$/.test(rawValue)) {
      setLocalValue(rawValue);
      const numericValue = parseFloat(rawValue);
      onChange(isNaN(numericValue) ? 0 : numericValue);
    }
  };

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
          value={localValue}
          onChange={handleChange}
          onBlur={() => setLocalValue(String(value))}
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
