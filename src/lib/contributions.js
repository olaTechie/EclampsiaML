import { predictRisk } from './risk.js';

const JOINT = [['number_of_previous_deliver', 'interpregnancy_cat', 'Parity and interpregnancy interval']];

/** Change in calibrated risk when each factor is set to its cohort-typical value (a property of the model, not a
 * causal effect). Parity and interpregnancy interval are replaced together so the profile stays consistent. */
export function contributions(input, bundle, schema) {
  const base = predictRisk(input, bundle).risk;
  const defaults = Object.fromEntries(schema.fields.map((f) => [f.name, f.default]));
  const labels = Object.fromEntries(schema.fields.map((f) => [f.name, f.label]));
  const groups = [];
  const seen = new Set();
  for (const [a, b, label] of JOINT) {
    groups.push({ names: [a, b], label });
    seen.add(a);
    seen.add(b);
  }
  for (const f of schema.fields) if (!seen.has(f.name)) groups.push({ names: [f.name], label: labels[f.name] });
  const out = groups.map(({ names, label }) => {
    const replaced = { ...input };
    names.forEach((n) => {
      replaced[n] = defaults[n];
    });
    return { variable: names.join('+'), label, delta: base - predictRisk(replaced, bundle).risk };
  });
  return out.sort((p, q) => Math.abs(q.delta) - Math.abs(p.delta));
}
