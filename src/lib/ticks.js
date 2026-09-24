/** The smallest 1, 2, 2.5 or 5 x 10^k step that is at least `raw`. */
export function niceStep(raw) {
  const e = 10 ** Math.floor(Math.log10(raw));
  const f = raw / e;
  const m = [1, 2, 2.5, 5, 10].find((c) => f <= c + 1e-9);
  return Number((m * e).toPrecision(12));
}

/** Round tick values inside [lo, hi], about `count` of them at most. */
export function niceTicks(lo, hi, count = 6) {
  const step = niceStep((hi - lo) / Math.max(1, count - 1));
  const out = [];
  for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) out.push(Number(v.toPrecision(12)));
  return out;
}
