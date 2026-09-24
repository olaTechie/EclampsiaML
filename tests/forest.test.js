import test from 'node:test';
import assert from 'node:assert/strict';
import { predictTree, predictForest } from '../src/lib/forest.js';

const tree = { left: [1, -1, -1], right: [2, -1, -1], feature: [0, -2, -2], threshold: [0.5, -2, -2], p1: [0.5, 0.1, 0.9] };

test('traverses left when x <= threshold', () => {
  assert.equal(predictTree([0.5], tree), 0.1);
  assert.equal(predictTree([0.6], tree), 0.9);
});
test('casts to float32 before comparing, as scikit-learn does', () => {
  assert.equal(predictTree([0.50000001], tree), 0.1); // float32(0.50000001) == 0.5
});
test('forest averages leaf probabilities', () => {
  assert.equal(predictForest([0.6], { trees: [tree, tree], feature_names: ['a'] }), 0.9);
});
