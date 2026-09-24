import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export function loadJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), 'utf8'));
}
export function realBundle() {
  return { model: loadJson('public/data/model.json'), spec: loadJson('public/data/preprocess.json') };
}
export function realSchema() {
  return loadJson('public/data/input_schema.json');
}
