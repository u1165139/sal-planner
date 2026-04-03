export const fmt = (n: number): string => {
    const safe = Number.isFinite(n) ? n : 0;
    return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(safe);
};

export const fmtPct = (n: number): string => {
    const safe = Number.isFinite(n) ? n : 0;
    return `${safe.toFixed(1)}%`;
};
