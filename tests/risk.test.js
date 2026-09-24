import test from 'node:test';
import assert from 'node:assert/strict';
import { recalibrate, tierFor } from '../src/lib/risk.js';

test('identity recalibration returns the input', () => {
  assert.ok(Math.abs(recalibrate(0.2, { a: 0, b: 1 }) - 0.2) < 1e-15);
});
test('logit is clipped at 1e-6 like the Python recalibrator', () => {
  assert.ok(Math.abs(recalibrate(0, { a: 0, b: 1 }) - 1e-6) < 1e-15);
});
test('tiers are left-closed at the cut-offs', () => {
  const doc = { cutoffs: [0.05, 0.1], tiers: [{ key: 't0' }, { key: 't1' }, { key: 't2' }] };
  assert.deepEqual([0.0499, 0.05, 0.0999, 0.1].map((r) => tierFor(r, doc).key), ['t0', 't1', 't1', 't2']);
});
