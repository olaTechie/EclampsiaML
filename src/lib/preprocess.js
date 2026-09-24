/** Mirror of the scikit-learn ColumnTransformer (median/mode imputation, z-score, one-hot with drop="if_binary",
 * handle_unknown="ignore"). Column order = model.feature_names. */
export function isMissing(v) {
  return v === null || v === undefined || v === '' || (typeof v === 'number' && Number.isNaN(v));
}

export function preprocess(input, spec) {
  const x = [];
  const imputed = [];
  const { numeric, categorical } = spec;
  numeric.columns.forEach((col, i) => {
    let v = input[col];
    if (isMissing(v)) {
      v = numeric.impute_median[i];
      imputed.push(col);
    }
    x.push((Number(v) - numeric.scale_mean[i]) / numeric.scale_sd[i]);
  });
  categorical.columns.forEach((col, j) => {
    let v = input[col];
    if (isMissing(v)) {
      v = categorical.impute_mode[j];
      imputed.push(col);
    }
    const value = String(v);
    categorical.levels[j].forEach((level, k) => {
      if (k !== categorical.drop_idx[j]) x.push(level === value ? 1 : 0);
    });
  });
  return { x: Float64Array.from(x), imputed };
}
