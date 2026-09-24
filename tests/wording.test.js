import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './helpers.js';

// Framing rules (parent spec §1.3) plus the retired v1 framing: case-sensitive NICE, case-insensitive rest.
const BANNED_CS = /(?<![A-Za-z])NICE(?![a-z])/;
const BANNED_CI = /acog|uspstf|guideline[ _-]?rule|did not outperform|no detectable value|added nothing|better predictors rather than better algorithms|uninformative|cautionary|hypertensive risk profile|historical hypertensive/i;

function files(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

test('the guard regexes can fire', () => {
  assert.ok(BANNED_CS.test('NICE_strict') && BANNED_CS.test('NICE NG133') && !BANNED_CS.test('a nice chart'));
  assert.ok(BANNED_CI.test('Hypertensive Risk Profile') && BANNED_CI.test('USPSTF') && !BANNED_CI.test('Penalised logistic regression'));
});

test('no banned wording in the app source, page shell or exported data', () => {
  const targets = [join(root, 'index.html'), ...files(join(root, 'src')), ...files(join(root, 'public', 'data'))];
  const hits = targets.filter((p) => {
    const t = readFileSync(p, 'utf8');
    return BANNED_CS.test(t) || BANNED_CI.test(t);
  });
  assert.deepEqual(hits, []);
});
