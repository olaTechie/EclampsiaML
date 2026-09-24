import { preprocess } from './preprocess.js';
import { predictForest } from './forest.js';

const EPS = 1e-6; // same clip as final_analysis/src/evaluation.py::logit

export function logit(p) {
  const q = Math.min(Math.max(p, EPS), 1 - EPS);
  return Math.log(q / (1 - q));
}

export function recalibrate(p, { a, b }) {
  return 1 / (1 + Math.exp(-(a + b * logit(p))));
}

export function predictRisk(input, { model, spec }) {
  const { x, imputed } = preprocess(input, spec);
  if (x.length !== model.feature_names.length) {
    throw new Error(`feature vector has ${x.length} columns, model expects ${model.feature_names.length}`);
  }
  const raw = predictForest(x, model);
  return { raw, risk: recalibrate(raw, model.recalibrator), imputed };
}

export function tierFor(risk, doc) {
  const idx = doc.cutoffs.filter((c) => risk >= c).length;
  return doc.tiers[idx];
}
