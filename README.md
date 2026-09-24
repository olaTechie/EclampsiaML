# PreSev pre-eclampsia risk calculator

A browser-only calculator that estimates the risk of pre-eclampsia in the current pregnancy from information
recorded at the antenatal booking visit (14–20 weeks). It implements a random forest developed in the PreSev
prospective cohort at six antenatal clinics in Lagos, Nigeria, with a logistic recalibration estimated from
out-of-fold predictions.

**Live:** https://olatechie.github.io/EclampsiaML/

- **Pages:** Risk Calculator, What-If Simulator, SHAP Explorer (exact TreeSHAP computed in the browser), Population,
  Model Performance, Predictors, About.
- **Privacy:** all computation runs in the browser; nothing entered is sent anywhere.
- **Data:** the files in `public/data/` are the fitted model and aggregate summaries only (performance, SHAP
  dependence bands of at least 10 women, population counts with cells of fewer than 5 women merged or suppressed).
  The app contains no participant-level data; `tests/fixtures/` holds synthetic profiles used to check that the
  browser matches the scikit-learn model and `shap.TreeExplainer`.
- **Intended use:** to support, not replace, clinical assessment in settings similar to the development cohort.
  It is not a diagnostic tool and does not recommend management.

## Development

```bash
npm ci
npm test        # unit tests and the scikit-learn and SHAP parity tests
npm run build
```

Pushing to `main` runs the tests, builds the app and deploys it to GitHub Pages.

## Citation

[TO SUPPLY: citation on acceptance]
