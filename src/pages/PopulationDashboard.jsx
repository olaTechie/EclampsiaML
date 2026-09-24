import { useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { DataContext } from '../context';
import MetricCard from '../components/MetricCard';
import IncidenceChart from '../components/IncidenceChart';
import { ci, pct } from '../lib/format';

const DIMENSIONS = { parity: 'Parity', age_band: 'Age', bmi30: 'Body mass index', education: 'Education', site: 'Site' };

function rateCell(r) {
  return r.suppressed ? 'Fewer than 5 women' : `${r.cases}/${r.n}: ${pct(r.incidence)} (${pct(r.inc_lo)}–${pct(r.inc_hi)})`;
}

export default function PopulationDashboard() {
  const { population: P, tiers } = useContext(DataContext);
  const c = P.cohort;
  const [q1, med, q3] = P.risk_distribution.quartiles;
  const siteRows = P.sites.map((s) => ({ ...s, group: s.members.length > 1 ? s.members.join(' + ') : s.group }));
  const hist = P.risk_distribution.bins.map((b) => ({
    label: b.hi >= 1 ? `≥${Math.round(100 * b.lo)}` : `${Math.round(100 * b.lo)}–${Math.round(100 * b.hi)}`,
    n: b.n, tier: tiers.cutoffs.filter((cut) => b.lo >= cut - 1e-9).length,
  }));
  const high = P.risk_distribution.bins.filter((b) => b.lo >= tiers.cutoffs[1] - 1e-9).reduce((a, b) => a + b.n, 0);

  return (
    <div className="page page-population">
      <h1 className="page-title">Population</h1>
      <p className="page-desc">
        The development cohort: {c.n} women with a delivery outcome, enrolled at the booking visit at {c.n_sites} antenatal
        clinics in Lagos, Nigeria. All figures are aggregate counts; cells with fewer than {P.min_cell} women are merged
        with a neighbouring band or not shown.
      </p>
      <div className="stats-strip">
        <MetricCard label="Women with a delivery outcome" value={c.n} description={`Enrolled at ${c.n_sites} antenatal clinics`} />
        <MetricCard label="Pre-eclampsia" value={`${c.cases} (${pct(c.incidence)})`} description={`95% CI ${pct(c.inc_lo)}–${pct(c.inc_hi)}`} color="#c62828" />
        <MetricCard label="Median predicted risk" value={pct(med)} description={`Interquartile range ${pct(q1)}–${pct(q3)}`} color="#0072B2" />
        <MetricCard label={`Predicted risk ≥${pct(tiers.cutoffs[1], 0)}`} value={`${high} (${pct(high / c.n)})`} description="Women in the higher-risk group" />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h2 className="section-title">Enrolment and incidence by site</h2>
          <IncidenceChart rows={siteRows} xLabel="Site" />
        </div>
        <div className="chart-card">
          <h2 className="section-title">Distribution of predicted risk</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hist} margin={{ top: 8, right: 8, bottom: 24, left: 0 }} barCategoryGap={1}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" interval="preserveStartEnd" tick={{ fontSize: 10 }}
                label={{ value: 'Predicted risk (%)', position: 'insideBottom', offset: -14 }} />
              <YAxis allowDecimals={false} label={{ value: 'Women', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(v) => [v, 'Women']} labelFormatter={(l) => `Predicted risk ${l}%`} />
              <Bar dataKey="n" isAnimationActive={false}>
                {hist.map((h) => <Cell key={h.label} fill={tiers.tiers[h.tier].color} fillOpacity={0.75} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="chart-caption">
            Recalibrated out-of-fold predictions of the random forest, in bands of one percentage point (sparse bands
            merged); colours mark the risk groups (&lt;5%, 5–10%, ≥10%). Observed incidence in
            each group is on the Model Performance page.
          </p>
        </div>
        {Object.entries(P.distributions).map(([key, d]) => (
          <div className="chart-card" key={key}>
            <h2 className="section-title">By {d.label.replace(/ \(.*\)$/, '').toLowerCase()}</h2>
            <IncidenceChart rows={d.rows} xLabel={d.label} />
          </div>
        ))}
      </div>

      <h2 className="section-title">Risk factors recorded at booking</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Factor</th><th>With the factor: cases/women, incidence (95% CI)</th><th>Without</th></tr></thead>
          <tbody>
            {P.risk_factors.map((f) => (
              <tr key={f.variable}><td>{f.label}</td><td>{rateCell(f.with)}</td><td>{rateCell(f.without)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section-title">Discrimination by subgroup</h2>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Subgroup</th><th>Group</th><th>Women</th><th>Cases</th><th>C statistic (95% CI)</th></tr></thead>
          <tbody>
            {P.subgroups.map((s) => (
              <tr key={`${s.dimension}-${s.group}`}>
                <td>{DIMENSIONS[s.dimension] ?? s.dimension}</td><td>{s.group.replace('>=', '≥')}</td><td>{s.n}</td><td>{s.events}</td>
                <td>{s.auc === null ? 'Too few cases' : ci(s.auc, s.auc_lo, s.auc_hi)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="chart-caption">
        Random forest, recalibrated out-of-fold predictions; C statistics are not estimated for groups with fewer than
        five cases.
      </p>
    </div>
  );
}
