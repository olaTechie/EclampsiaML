import test from 'node:test';
import assert from 'node:assert/strict';
import { applyConsistency, checkInput } from '../src/lib/validation.js';
import { realSchema } from './helpers.js';

test('nulliparity locks the interpregnancy interval', () => {
  assert.equal(applyConsistency({ number_of_previous_deliver: 0, interpregnancy_cat: '2-5 y' }).interpregnancy_cat, 'Nulliparous');
  assert.equal(applyConsistency({ number_of_previous_deliver: 2, interpregnancy_cat: 'Nulliparous' }).interpregnancy_cat, null);
  assert.equal(applyConsistency({ number_of_previous_deliver: 2, interpregnancy_cat: '<2 y' }).interpregnancy_cat, '<2 y');
});
test('hard bounds are errors; cohort range and gestational window are warnings', () => {
  const schema = realSchema();
  const base = Object.fromEntries(schema.fields.map((f) => [f.name, f.default]));
  assert.equal(checkInput({ ...base, enr_bp_systolic: 300 }, schema).errors.length, 1);
  const sbp = schema.fields.find((f) => f.name === 'enr_bp_systolic');
  assert.ok(checkInput({ ...base, enr_bp_systolic: sbp.p99 + 5 }, schema).warnings.some((w) => w.field === 'enr_bp_systolic'));
  assert.ok(checkInput({ ...base, gestational_age_at_enrolme: 22 }, schema).warnings.some((w) => w.field === 'gestational_age_at_enrolme'));
  assert.equal(checkInput({ ...base, number_of_previous_deliver: 0 }, schema).nulliparous, true);
  assert.equal(checkInput({ ...base, number_of_previous_deliver: 1 }, schema).nulliparous, false);
});
