import { isMissing } from './preprocess.js';

/** Keep parity and interpregnancy interval consistent: no deliveries means "Nulliparous"; a parous woman cannot
 * be "Nulliparous" (the field becomes unknown until chosen). */
export function applyConsistency(input) {
  const d = input.number_of_previous_deliver;
  if (!isMissing(d) && Number(d) === 0) return { ...input, interpregnancy_cat: 'Nulliparous' };
  if (!isMissing(d) && Number(d) > 0 && input.interpregnancy_cat === 'Nulliparous') return { ...input, interpregnancy_cat: null };
  return input;
}

/** Hard bounds are errors (no risk shown); values outside the cohort 1st-99th percentile and gestational age
 * outside 14-20 weeks are warnings; nulliparity triggers the override banner. */
export function checkInput(input, schema) {
  const errors = [];
  const warnings = [];
  for (const f of schema.fields) {
    const v = input[f.name];
    if (f.kind !== 'number' || isMissing(v)) continue;
    const n = Number(v);
    const unit = f.unit ? ` ${f.unit}` : '';
    if (!Number.isFinite(n) || n < f.hard_min || n > f.hard_max) {
      errors.push({ field: f.name, message: `${f.label} must be between ${f.hard_min} and ${f.hard_max}${unit}.` });
    } else if (n < f.p01 || n > f.p99) {
      warnings.push({ field: f.name, message: `${f.label} ${n}${unit} is outside the range seen in the development cohort (${f.p01}–${f.p99}${unit}).` });
    }
  }
  const ga = input.gestational_age_at_enrolme;
  if (!isMissing(ga) && (Number(ga) < 14 || Number(ga) > 20)) {
    warnings.push({ field: 'gestational_age_at_enrolme', message: 'The model was developed for booking visits at 14–20 weeks.' });
  }
  const d = input.number_of_previous_deliver;
  return { errors, warnings, nulliparous: !isMissing(d) && Number(d) === 0 };
}
