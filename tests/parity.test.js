import test from 'node:test';
import assert from 'node:assert/strict';
import { predictRisk } from '../src/lib/risk.js';
import { loadJson, realBundle } from './helpers.js';

test('browser risk equals scikit-learn on 1,000 synthetic profiles', () => {
  const bundle = realBundle();
  const { profiles } = loadJson('tests/fixtures/parity_profiles.json');
  assert.ok(profiles.length >= 1000);
  let raw = 0;
  let risk = 0;
  for (const p of profiles) {
    const r = predictRisk(p.input, bundle);
    raw = Math.max(raw, Math.abs(r.raw - p.p_raw));
    risk = Math.max(risk, Math.abs(r.risk - p.risk));
  }
  assert.ok(raw <= 1e-9, `max raw difference ${raw}`);
  assert.ok(risk <= 1e-9, `max risk difference ${risk}`);
});
