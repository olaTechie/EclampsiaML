import test from 'node:test';
import assert from 'node:assert/strict';
import { preprocess } from '../src/lib/preprocess.js';
import { predictForest } from '../src/lib/forest.js';
import { expectedValue, treeShap } from '../src/lib/treeshap.js';
import { loadJson, realBundle } from './helpers.js';

test('browser TreeSHAP equals shap.TreeExplainer on the synthetic profiles', () => {
  const { model, spec } = realBundle();
  const fx = loadJson('tests/fixtures/shap_profiles.json');
  assert.ok(fx.profiles.length >= 200);
  assert.deepEqual(fx.feature_names, model.feature_names);
  assert.ok(Math.abs(expectedValue(model) - fx.expected_value) <= 1e-9);
  let worst = 0;
  for (const p of fx.profiles) {
    const phi = treeShap(preprocess(p.input, spec).x, model);
    p.shap.forEach((v, i) => {
      worst = Math.max(worst, Math.abs(phi[i] - v));
    });
  }
  assert.ok(worst <= 1e-9, `max SHAP difference ${worst}`);
});

test('SHAP values add up from the baseline to the forest output', () => {
  const { model, spec } = realBundle();
  const { profiles } = loadJson('tests/fixtures/parity_profiles.json');
  const base = expectedValue(model);
  for (const p of profiles.slice(0, 50)) {
    const { x } = preprocess(p.input, spec);
    const total = treeShap(x, model).reduce((a, b) => a + b, base);
    assert.ok(Math.abs(total - predictForest(x, model)) <= 1e-9);
  }
});
