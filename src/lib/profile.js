import { EXAMPLES } from './examples.js';
import { applyConsistency } from './validation.js';

/** Cohort-typical values for every field, overlaid with a named worked example when one is given. */
export function initialInput(schema, example) {
  const defaults = Object.fromEntries(schema.fields.map((f) => [f.name, f.default]));
  return applyConsistency({ ...defaults, ...(EXAMPLES[example] || {}) });
}
