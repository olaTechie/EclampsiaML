import test from 'node:test';
import assert from 'node:assert/strict';
import { featureOwners, predictorShap } from '../src/lib/features.js';
import { realBundle } from './helpers.js';

test('each model feature maps back to its predictor, in the model feature order', () => {
  const { model, spec } = realBundle();
  const owners = featureOwners(spec);
  assert.equal(owners.length, model.feature_names.length);
  model.feature_names.forEach((name, i) => {
    const bare = name.replace(/^(num|cat)__/, '');
    assert.ok(bare === owners[i] || bare.startsWith(`${owners[i]}_`), `${name} -> ${owners[i]}`);
  });
});

test('predictor SHAP sums the one-hot levels of each predictor', () => {
  const { spec } = realBundle();
  const owners = featureOwners(spec);
  const phi = owners.map((_, i) => (i + 1) / 1000);
  const agg = predictorShap(phi, spec);
  const occ = owners.map((o, i) => (o === 'occupation' ? phi[i] : 0)).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(agg.occupation - occ) < 1e-15);
  assert.equal(Object.keys(agg).length, 19);
  assert.ok(Math.abs(Object.values(agg).reduce((a, b) => a + b, 0) - phi.reduce((a, b) => a + b, 0)) < 1e-12);
});
