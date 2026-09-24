const bad = (v) => v === null || v === undefined || Number.isNaN(v);
export const pct = (v, d = 1) => (bad(v) ? 'NA' : `${(100 * v).toFixed(d)}%`);
export const num = (v, d = 2) => (bad(v) ? 'NA' : Number(v).toFixed(d));
export const ci = (v, lo, hi, d = 2) => `${num(v, d)} (${num(lo, d)}–${num(hi, d)})`;
