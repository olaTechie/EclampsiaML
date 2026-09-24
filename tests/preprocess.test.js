import test from 'node:test';
import assert from 'node:assert/strict';
import { preprocess } from '../src/lib/preprocess.js';

const spec = {
  numeric: { columns: ['a'], impute_median: [5], scale_mean: [4], scale_sd: [2] },
  categorical: { columns: ['b', 'c'], impute_mode: ['x', 'No'], levels: [['x', 'y', 'z'], ['No', 'Yes']], drop_idx: [null, 0] },
};

test('standardises numerics and one-hot encodes with the binary level dropped', () => {
  assert.deepEqual(Array.from(preprocess({ a: 8, b: 'y', c: 'Yes' }, spec).x), [2, 0, 1, 0, 1]);
});
test('missing values take the imputation values and are reported', () => {
  const r = preprocess({ a: null, b: '', c: undefined }, spec);
  assert.deepEqual(Array.from(r.x), [0.5, 1, 0, 0, 0]);
  assert.deepEqual(r.imputed, ['a', 'b', 'c']);
});
test('an unseen level encodes as all zeros', () => {
  assert.deepEqual(Array.from(preprocess({ a: 4, b: 'q', c: 'No' }, spec).x), [0, 0, 0, 0, 0]);
});
