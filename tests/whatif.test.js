import test from 'node:test';
import assert from 'node:assert/strict';
import { predictRisk } from '../src/lib/risk.js';
import { gridFor, riskCurve } from '../src/lib/whatif.js';
import { initialInput } from '../src/lib/profile.js';
import { realBundle, realSchema } from './helpers.js';

test('the sweep passes through the profile\'s own risk and keeps parity consistent', () => {
  const bundle = realBundle();
  const schema = realSchema();
  const input = initialInput(schema, 'parous');
  const field = schema.fields.find((f) => f.name === 'enr_bp_diastolic');
  const grid = gridFor(field, 40);
  assert.ok(grid.length >= 20 && grid[0] >= field.p01 && grid[grid.length - 1] <= field.p99);
  const curve = riskCurve(input, 'enr_bp_diastolic', [...grid, input.enr_bp_diastolic], bundle);
  assert.ok(Math.abs(curve[curve.length - 1].risk - predictRisk(input, bundle).risk) < 1e-15);
  const parity = riskCurve(input, 'number_of_previous_deliver', [0, 2], bundle);
  const nulli = predictRisk({ ...input, number_of_previous_deliver: 0, interpregnancy_cat: 'Nulliparous' }, bundle).risk;
  assert.ok(Math.abs(parity[0].risk - nulli) < 1e-15);
});

test('count variables sweep over whole numbers', () => {
  const field = realSchema().fields.find((f) => f.name === 'number_of_previous_deliver');
  assert.ok(gridFor(field, 40).every((v) => Number.isInteger(v)));
});

test('initialInput fills cohort-typical values and applies an example', () => {
  const schema = realSchema();
  const typical = initialInput(schema, null);
  assert.equal(Object.keys(typical).length, 19);
  assert.equal(initialInput(schema, 'parous').number_of_previous_deliver, 2);
  assert.equal(initialInput(schema, 'nulliparous').interpregnancy_cat, 'Nulliparous');
  assert.deepEqual(initialInput(schema, 'no-such-example'), typical);
});
