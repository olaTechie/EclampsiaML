import test from 'node:test';
import assert from 'node:assert/strict';
import { contributions } from '../src/lib/contributions.js';
import { EXAMPLES } from '../src/lib/examples.js';
import { applyConsistency } from '../src/lib/validation.js';
import { realBundle, realSchema } from './helpers.js';

const schema = realSchema();
const base = Object.fromEntries(schema.fields.map((f) => [f.name, f.default]));

test('a cohort-typical woman has zero contributions', () => {
  assert.ok(contributions(base, realBundle(), schema).every((c) => Math.abs(c.delta) < 1e-12));
});
test('parity and interpregnancy interval move together and results are sorted by size', () => {
  const input = applyConsistency({ ...base, ...EXAMPLES.parous });
  const out = contributions(input, realBundle(), schema);
  const joint = out.find((c) => c.variable === 'number_of_previous_deliver+interpregnancy_cat');
  assert.ok(joint && joint.label === 'Parity and interpregnancy interval');
  assert.ok(!out.some((c) => c.variable === 'interpregnancy_cat'));
  for (let i = 1; i < out.length; i += 1) assert.ok(Math.abs(out[i - 1].delta) >= Math.abs(out[i].delta));
});
