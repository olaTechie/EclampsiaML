import { useContext } from 'react';
import {
  ComposedChart, LineChart, Line, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { DataContext } from '../context';
import MetricCard from '../components/MetricCard';
import { ci, num, pct } from '../lib/format';

const RF = '#0072B2';
const LR = '#D55E00';
const MUTED = ['#7f8c8d', '#95a5a6', '#626567', '#a6acaf', '#839192', '#b3b6b7', '#566573', '#aab7b8'];

function algorithmColours(algorithms) {
  const colours = {};
  let muted = 0;
  for (const a of algorithms) {
    if (a.selected) colours[a.algorithm] = RF;
    else if (a.reference) colours[a.algorithm] = LR;
    else {
      colours[a.algorithm] = MUTED[muted % MUTED.length];
      muted += 1;
    }
  }
  return colours;
}

export default function ModelPerformance() {
  const { performance: P } = useContext(DataContext);
  const h = P.headline;
  const colours = algorithmColours(P.algorithms);
  const rocData = P.roc.grid.map((fpr, i) => ({
    fpr,
    ...Object.fromEntries(P.algorithms.map((a) => [a.algorithm, P.roc.curves[a.algorithm][i]])),
  }));
  const calData = P.calibration.grid.map((p, i) => ({ p, fit: P.calibration.fit[i], band: [P.calibration.lo[i], P.calibration.hi[i]] }));
  const calMax = P.calibration.grid[P.calibration.grid.length - 1];
  const dcaData = P.dca.thresholds.map((t, i) => ({
    t, rf: P.dca.curves.principal_ml.nb[i], ref: P.dca.curves.reference.nb[i], all: P.dca.treat_all[i],
  }));
  const calTicks = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4].filter((t) => t <= calMax + 1e-9);
  const dcaMax = Math.max(...dcaData.map((d) => Math.max(d.rf ?? 0, d.ref ?? 0, d.all ?? 0)));
  const dcaTop = Math.ceil((dcaMax * 1.2) / 0.01) * 0.01;
  const rfLabel = P.algorithms.find((a) => a.selected).label;
  const refLabel = P.algorithms.find((a) => a.reference).label;

  return (
    <div className="page page-performance">
      <h1 className="page-title">Model Performance</h1>
      <p className="page-desc">
        Internal validation by nested cross-validation (ten repeats of 10-fold) in {h.n} women with {h.events} cases of
        pre-eclampsia, plus geographic validation at one site held out from training.
      </p>
      <div className="stats-strip">
        <MetricCard label="Random forest C statistic" value={ci(h.rf.c, h.rf.c_lo, h.rf.c_hi)} description="95% CI, participant bootstrap" color={RF} />
        <MetricCard
          label="Penalised regression C statistic"
          value={ci(h.reference.c, h.reference.c_lo, h.reference.c_hi)}
          description={`Similar to the random forest (paired DeLong P = ${num(h.delong_p)})`}
          color={LR}
        />
        <MetricCard
          label="Calibration slope"
          value={`${num(h.rf.slope_avg)} / ${num(h.rf.slope_repeat)}`}
          description="Repeat-averaged predictions / mean of per-repeat slopes; before recalibration"
        />
        <MetricCard
          label="Geographic validation (LIMH)"
          value={ci(h.limh.c, h.limh.c_lo, h.limh.c_hi)}
          description={`Trained on five sites; observed:expected ${num(h.limh.oe)}`}
        />
        <MetricCard
          label="Pooled leave-one-site-out C"
          value={ci(h.loso.c, h.loso.c_lo, h.loso.c_hi)}
          description={`95% prediction interval ${num(h.loso.pi_lo)}–${num(h.loso.pi_hi)}`}
        />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h2 className="section-title">ROC curves, ten algorithms</h2>
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={rocData} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fpr" type="number" domain={[0, 1]} ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]} tickFormatter={(v) => v.toFixed(1)}
                label={{ value: '1 − specificity', position: 'insideBottom', offset: -12 }} />
              <YAxis type="number" domain={[0, 1]} ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]} tickFormatter={(v) => v.toFixed(1)}
                label={{ value: 'Sensitivity', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(v) => num(v)} labelFormatter={(v) => `1 − specificity ${num(v)}`} />
              <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="#999" strokeDasharray="4 4" />
              {P.algorithms.map((a) => (
                <Line key={a.algorithm} dataKey={a.algorithm} name={`${a.label} (C ${num(a.auc)})`} dot={false}
                  stroke={colours[a.algorithm]} strokeWidth={a.selected || a.reference ? 2.5 : 1} isAnimationActive={false} />
              ))}
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="chart-caption">Averaged over the ten cross-validation repeats.</p>
        </div>

        <div className="chart-card">
          <h2 className="section-title">Calibration ({rfLabel})</h2>
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart data={calData} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="p" type="number" domain={[0, calMax]} ticks={calTicks} tickFormatter={(v) => pct(v, 0)}
                label={{ value: 'Predicted risk', position: 'insideBottom', offset: -12 }} />
              <YAxis type="number" domain={[0, calMax]} ticks={calTicks} allowDataOverflow tickFormatter={(v) => pct(v, 0)}
                label={{ value: 'Observed', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(v) => (Array.isArray(v) ? `${pct(v[0])}–${pct(v[1])}` : pct(v))}
                labelFormatter={(v) => `Predicted ${pct(v)}`} />
              <ReferenceLine segment={[{ x: 0, y: 0 }, { x: calMax, y: calMax }]} stroke="#999" strokeDasharray="4 4" />
              <Area dataKey="band" stroke="none" fill={RF} fillOpacity={0.15} name="95% band" isAnimationActive={false} />
              <Line dataKey="fit" stroke={RF} strokeWidth={2.5} dot={false} name="Loess" isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="chart-caption">
            Out-of-fold predictions averaged over ten repeats, before recalibration (slope {num(P.calibration.slope)}).
          </p>
        </div>

        <div className="chart-card">
          <h2 className="section-title">Decision curves</h2>
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={dcaData} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" type="number" domain={[0, 0.3]} ticks={[0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3]} tickFormatter={(v) => pct(v, 0)}
                label={{ value: 'Threshold probability', position: 'insideBottom', offset: -12 }} />
              <YAxis domain={[-0.01, dcaTop]} allowDataOverflow tickFormatter={(v) => v.toFixed(2)}
                label={{ value: 'Net benefit', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(v) => num(v, 3)} labelFormatter={(v) => `Threshold ${pct(v)}`} />
              <ReferenceLine y={0} stroke="#333" />
              <Line dataKey="rf" name={rfLabel} stroke={RF} strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line dataKey="ref" name={refLabel} stroke={LR} strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line dataKey="all" name="Treat all" stroke="#7f8c8d" dot={false} isAnimationActive={false} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="chart-caption">Net benefit on recalibrated out-of-fold predictions (apparent values).</p>
        </div>
      </div>

      <h2 className="section-title">All ten algorithms</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Algorithm</th><th>C statistic (95% CI)</th><th>AUPRC</th><th>Brier</th><th>Sensitivity</th><th>Specificity</th><th>PPV</th><th>NPV</th></tr>
          </thead>
          <tbody>
            {P.algorithms.map((a) => (
              <tr key={a.algorithm} className={a.selected ? 'row-selected' : undefined}>
                <td>{a.label}{a.selected ? ' (selected model)' : a.reference ? ' (reference)' : ''}</td>
                <td>{ci(a.auc, a.auc_ci_lo, a.auc_ci_hi)}</td>
                <td>{num(a.ap, 3)}</td>
                <td>{num(a.brier, 3)}</td>
                <td>{pct(a.sensitivity)}</td>
                <td>{pct(a.specificity)}</td>
                <td>{pct(a.ppv)}</td>
                <td>{pct(a.npv)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="chart-caption">
        Classification columns: flagging the 20% of women at highest predicted risk in each repeat — a comparison
        device, not a clinical threshold.
      </p>

      <h2 className="section-title">Observed incidence by predicted-risk group</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Predicted risk</th><th>Women</th><th>Cases</th><th>Incidence (95% CI)</th><th>Risk ratio (95% CI)</th></tr></thead>
          <tbody>
            {P.tiers.map((t, i) => (
              <tr key={t.group}>
                <td>{t.group}</td>
                <td>{t.n}</td>
                <td>{t.cases}</td>
                <td>{pct(t.incidence)} ({pct(t.inc_lo)}–{pct(t.inc_hi)})</td>
                <td>{i === 0 ? '1 (reference)' : ci(t.rr, t.rr_lo, t.rr_hi, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="chart-caption">Groups use recalibrated out-of-fold predictions and are apparent values.</p>

      <h2 className="section-title">By parity</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Group</th><th>Women</th><th>Cases</th><th>C statistic (95% CI)</th></tr></thead>
          <tbody>
            {P.subgroups.map((s) => (
              <tr key={s.group}><td>{s.group}</td><td>{s.n}</td><td>{s.events}</td><td>{ci(s.auc, s.auc_lo, s.auc_hi)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
