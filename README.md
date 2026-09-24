# PreSev pre-eclampsia risk calculator

A browser-only calculator that estimates the risk of pre-eclampsia in the current pregnancy from information
recorded at the antenatal booking visit (14–20 weeks). It implements a random forest developed in the PreSev
prospective cohort at six antenatal clinics in Lagos, Nigeria, with a logistic recalibration estimated from
out-of-fold predictions.

**Live:** https://olatechie.github.io/EclampsiaML/

- **Pages:** Risk Calculator, Model Performance, Predictors, About.
- **Privacy:** all computation runs in the browser; nothing entered is sent anywhere.
- **Data:** the files in `public/data/` are the fitted model and aggregate performance summaries only. The app
  contains no participant-level data; `tests/fixtures/parity_profiles.json` holds synthetic profiles used to
  check that the browser matches the scikit-learn model.
- **Intended use:** to support, not replace, clinical assessment in settings similar to the development cohort.
  It is not a diagnostic tool and does not recommend management.

## Development

```bash
npm ci
npm test        # unit tests and the scikit-learn parity test
npm run build
```

Pushing to `main` runs the tests, builds the app and deploys it to GitHub Pages.

## Citation

[TO SUPPLY: citation on acceptance]
