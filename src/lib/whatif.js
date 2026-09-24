import { predictRisk } from './risk.js';
import { applyConsistency } from './validation.js';

/** Values to sweep a numeric field over: its cohort 1st to 99th percentile, whole numbers for whole-number fields. */
export function gridFor(field, n = 60) {
  const { p01: lo, p99: hi } = field;
  if (field.step >= 1) {
    const start = Math.ceil(lo);
    const end = Math.floor(hi);
    const stride = Math.max(1, Math.ceil((end - start) / n));
    const out = [];
    for (let v = start; v <= end; v += stride) out.push(v);
    return out;
  }
  return Array.from({ length: n }, (_, i) => Math.round((lo + ((hi - lo) * i) / (n - 1)) * 10) / 10);
}

/** Calibrated risk as one field varies and everything else stays as in `input`. */
export function riskCurve(input, variable, grid, bundle) {
  return grid.map((v) => ({ x: v, risk: predictRisk(applyConsistency({ ...input, [variable]: v }), bundle).risk }));
}
