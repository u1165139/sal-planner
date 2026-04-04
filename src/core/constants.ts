// ─── CONSTANTS: Australian Tax Rates 2025-26 ─────────────────────────────────

export const COMPANY_TAX_RATE = 0.25;
export const MEDICARE_THRESHOLD = 26000
export const MEDICARE_SHADING_RATE = 0.1;
export const MEDICARE_RATE = 0.02;
export const SUPER_CAP = 30000; // Concessional cap 2025-26
export const SUPER_RATE = 0.12; // 12.0% SGC from 1 July 2025

export const PERSONAL_BRACKETS: { min: number; max: number; rate: number }[] = [
  { min: 0,      max: 18200,    rate: 0    },
  { min: 18201,  max: 45000,    rate: 0.16 },
  { min: 45001,  max: 135000,   rate: 0.30 },
  { min: 135001, max: 190000,   rate: 0.37 },
  { min: 190001, max: Infinity, rate: 0.45 },
];
