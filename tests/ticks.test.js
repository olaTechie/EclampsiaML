import test from 'node:test';
import assert from 'node:assert/strict';
import { niceStep, niceTicks } from '../src/lib/ticks.js';

test('nice steps are 1, 2, 2.5 or 5 times a power of ten', () => {
  assert.equal(niceStep(10.4), 20);
  assert.equal(niceStep(9.7), 10);
  assert.equal(niceStep(3.48), 5);
  assert.equal(niceStep(0.21), 0.25);
});

test('ticks are round values inside the range', () => {
  assert.deepEqual(niceTicks(51, 103, 6), [60, 80, 100]);
  assert.deepEqual(niceTicks(51, 103, 8), [60, 70, 80, 90, 100]);
  assert.deepEqual(niceTicks(0, 35, 5), [0, 10, 20, 30]);
  assert.deepEqual(niceTicks(4.1, 21.5, 6), [5, 10, 15, 20]);
});
