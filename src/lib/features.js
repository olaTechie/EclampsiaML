/** The predictor behind each model feature, in model.feature_names order (numeric columns, then the kept one-hot
 * levels of each categorical column), mirroring preprocess.js. */
export function featureOwners(spec) {
  const owners = [...spec.numeric.columns];
  spec.categorical.columns.forEach((col, j) => {
    spec.categorical.levels[j].forEach((_, k) => {
      if (k !== spec.categorical.drop_idx[j]) owners.push(col);
    });
  });
  return owners;
}

/** Feature-level SHAP values summed to predictors (as the analysis does for its importance table). */
export function predictorShap(phi, spec) {
  const out = {};
  featureOwners(spec).forEach((owner, i) => {
    out[owner] = (out[owner] ?? 0) + phi[i];
  });
  return out;
}
