import { useContext } from 'react';
import { DataContext } from '../context';
import { ci, num, pct } from '../lib/format';

const STATEMENT = 'The prespecified primary clinical outcome was pre-eclampsia with severe features. However, the low number of severe events (n=28) limited the precision and stability of prediction modelling. We therefore evaluated prediction of any pre-eclampsia (n=62) as the principal modelling endpoint, while retaining pre-eclampsia with severe features as a clinically important secondary analysis.';

export default function About() {
  const { model, performance: P, tiers } = useContext(DataContext);
  const h = P.headline;
  const sub = Object.fromEntries(P.subgroups.map((s) => [s.group, s]));
  return (
    <div className="page page-about">
      <h1 className="page-title">About</h1>
      <div className="card">
        <h2 className="section-title">The study</h2>
        <p>
          Prospective cohort at six antenatal clinics in Lagos, Nigeria. Women were enrolled at the booking visit
          (14–20 weeks) and followed to delivery; {tiers.cohort.n} had a delivery outcome and {tiers.cohort.cases}{' '}
          ({pct(tiers.cohort.incidence)}) developed pre-eclampsia.
        </p>
        <p>{STATEMENT}</p>
      </div>
      <div className="card">
        <h2 className="section-title">The model</h2>
        <p>
          A random forest using 19 routine booking-visit variables, with no biomarkers or Doppler measurements, selected
          from ten algorithms by a prespecified nested cross-validation procedure. Its predictions are recalibrated with
          a logistic recalibration estimated from out-of-fold predictions. Nested cross-validated C statistic{' '}
          {ci(h.rf.c, h.rf.c_lo, h.rf.c_hi)}; penalised logistic regression {ci(h.reference.c, h.reference.c_lo, h.reference.c_hi)}.
        </p>
      </div>
      <div className="card">
        <h2 className="section-title">Intended use</h2>
        <p>
          To support, not replace, clinical assessment of pre-eclampsia risk at the antenatal booking visit in settings
          similar to the development cohort. Do not use it: outside Lagos antenatal care without local recalibration; to
          diagnose established pre-eclampsia; for women outside 14–20 weeks at booking; or without clinician review.
        </p>
      </div>
      <div className="card card-warning">
        <h2 className="section-title">Limitations</h2>
        <ul className="findings-list">
          <li>
            Discrimination is lower in nulliparous women (C {num(sub.Nulliparous?.auc)}) than in parous women
            (C {num(sub.Parous?.auc)}); clinical judgement must override for first pregnancies.
          </li>
          <li>
            Pooled across sites, the C statistic was {ci(h.loso.c, h.loso.c_lo, h.loso.c_hi)} with a 95% prediction
            interval of {num(h.loso.pi_lo)}–{num(h.loso.pi_hi)}; performance in a new setting may differ.
          </li>
          <li>At the held-out site the model over-predicted (observed:expected {num(h.limh.oe)}); local recalibration may be needed.</li>
          <li>
            The cohort ({h.events} cases) is smaller than recommended for a model of this size; the model has not yet
            been validated in an independent population.
          </li>
          <li>Risk groups and decision curves use the same out-of-fold predictions on which the recalibration was fitted and are apparent values.</li>
        </ul>
      </div>
      <div className="card">
        <h2 className="section-title">Privacy</h2>
        <p>All computation runs in your browser. Nothing you enter is sent anywhere. The app contains no participant-level data.</p>
      </div>
      <div className="card">
        <h2 className="section-title">Version and citation</h2>
        <p>Model: random forest ({model.n_trees} trees, no class-imbalance correction), fitted {String(model.fitted_at).slice(0, 10)}; analysis commit {model.git_sha}.</p>
        <p>Citation: [TO SUPPLY: citation on acceptance]</p>
      </div>
    </div>
  );
}
