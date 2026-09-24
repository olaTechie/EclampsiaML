import { useContext, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, CartesianGrid, ErrorBar, LabelList } from 'recharts';
import { DataContext, ProfileContext } from '../context';
import { preprocess } from '../lib/preprocess';
import { recalibrate } from '../lib/risk';
import { checkInput } from '../lib/validation';
import { treeShap } from '../lib/treeshap';
import { predictorShap } from '../lib/features';
import { num, pct } from '../lib/format';
import { niceTicks } from '../lib/ticks';
import MetricCard from '../components/MetricCard';
import { useNarrow } from '../hooks/useNarrow';

const UP = '#c62828';
const DOWN = '#2e7d32';
const TOP = 10;
const pp = (v) => `${v > 0 ? '+' : ''}${num(100 * v, 1)} pp`;

function valueLabel(field, v) {
  if (v === null || v === undefined || v === '') return 'unknown';
  if (field.kind === 'number') return `${num(v, field.step < 1 ? 1 : 0)}${field.unit ? ` ${field.unit}` : ''}`;
  return field.levels.find((l) => l.value === String(v))?.label ?? String(v);
}

function currentBin(dep, field, v) {
  if (v === null || v === undefined || v === '') return -1;
  if (dep.kind === 'number') return dep.bins.findIndex((b) => (b.lo === null || v > b.lo) && (b.hi === null || v <= b.hi));
  return dep.bins.findIndex((b) => b.value === String(v));
}

export default function ShapExplorer() {
  const { model, spec, schema, shap: S } = useContext(DataContext);
  const { profile } = useContext(ProfileContext);
  const check = useMemo(() => checkInput(profile, schema), [profile, schema]);
  const explained = useMemo(() => {
    if (check.errors.length) return null;
    const agg = predictorShap(treeShap(preprocess(profile, spec).x, model), spec);
    return schema.fields.map((f) => ({ field: f, value: agg[f.name] })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }, [check, profile, spec, model, schema]);
  const [chosen, setChosen] = useState(null);
  const narrow = useNarrow();
  const pick = chosen ?? explained?.[0]?.field.name ?? 'enr_bp_diastolic';

  if (!explained) {
    return (
      <div className="page page-shap">
        <h1 className="page-title">SHAP Explorer</h1>
        <p className="card-warning">Complete the profile in the <NavLink to="/">Risk Calculator</NavLink> to see its explanation.</p>
      </div>
    );
  }

  const base = S.expected_value;
  const raw = explained.reduce((a, r) => a + r.value, base);
  const risk = recalibrate(raw, model.recalibrator);
  const shown = explained.slice(0, TOP);
  const rest = explained.slice(TOP);
  const rows = [...shown.map((r) => ({ label: `${r.field.label} = ${valueLabel(r.field, profile[r.field.name])}`, v: r.value })),
    ...(rest.length ? [{ label: `${rest.length} other predictors`, v: rest.reduce((a, r) => a + r.value, 0) }] : [])];
  let start = base;
  const water = rows.map((r) => {
    const end = start + r.v;
    const bar = { label: r.label, v: r.v, range: [100 * Math.min(start, end), 100 * Math.max(start, end)], text: pp(r.v) };
    start = end;
    return bar;
  });
  const lo = Math.min(...water.map((w) => w.range[0]), 100 * base);
  const hi = Math.max(...water.map((w) => w.range[1]), 100 * base);
  const pad = Math.max(0.5, (hi - lo) * 0.15);
  const dLo = Math.max(0, lo - pad);
  const dHi = hi + pad;

  const field = schema.fields.find((f) => f.name === pick);
  const dep = S.dependence[pick];
  const here = currentBin(dep, field, profile[pick]);
  const depData = dep.bins.filter((b) => !b.suppressed).map((b) => ({
    label: b.label, mean: 100 * b.mean, n: b.n, err: [100 * (b.mean - b.p25), 100 * (b.p75 - b.mean)],
    current: dep.bins.indexOf(b) === here,
  }));
  const hidden = dep.bins.filter((b) => b.suppressed).length;

  return (
    <div className="page page-shap">
      <h1 className="page-title">SHAP Explorer</h1>
      <p className="page-desc">
        How each factor moves the random forest&apos;s estimate for the profile in the{' '}
        <NavLink to="/">Risk Calculator</NavLink>, and how each factor acts across the cohort.
      </p>
      <div className="stats-strip">
        <MetricCard label="Cohort baseline" value={pct(base)} description="Average forest output in the development cohort" />
        <MetricCard label="This profile, forest output" value={pct(raw)} description="Baseline plus the SHAP values below" color="#0072B2" />
        <MetricCard label="This profile, predicted risk" value={pct(risk)} description="After the logistic recalibration shown in the calculator" />
      </div>

      <div className="chart-card">
        <h2 className="section-title">What moves this estimate</h2>
        <ResponsiveContainer width="100%" height={Math.max(260, water.length * (narrow ? 52 : 38) + 50)}>
          <BarChart data={water} layout="vertical" margin={{ left: 0, right: narrow ? 44 : 56, top: 24, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[dLo, dHi]} ticks={niceTicks(dLo, dHi, 6)} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="label" width={narrow ? 128 : 250} interval={0} tick={{ fontSize: narrow ? 10 : 11 }} />
            <Tooltip formatter={(_, __, item) => item.payload.text} labelFormatter={(l) => l} />
            <ReferenceLine x={100 * base} stroke="#5a6d80" strokeDasharray="4 4" label={{ value: 'Baseline', position: 'top', fontSize: 11 }} />
            <ReferenceLine x={100 * raw} stroke="#0072B2" label={{ value: 'This profile', position: 'top', fontSize: 11 }} />
            <Bar dataKey="range" isAnimationActive={false}>
              {water.map((w) => <Cell key={w.label} fill={w.v > 0 ? UP : DOWN} />)}
              <LabelList dataKey="text" position="right" fontSize={11} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="chart-caption">
          Exact SHAP values (TreeSHAP) computed in your browser, on the forest&apos;s probability scale before
          recalibration: starting from the cohort baseline, each bar adds one factor&apos;s contribution, ending at this
          profile&apos;s forest output. SHAP values describe the model, not causal effects. Global importance across the
          cohort is on the <NavLink to="/predictors">Predictors</NavLink> page.
        </p>
      </div>

      <div className="chart-card">
        <h2 className="section-title">How a factor acts across the cohort</h2>
        <label className="inline-label" htmlFor="dep-var">Factor</label>
        <select id="dep-var" className="form-input inline-select" value={pick} onChange={(e) => setChosen(e.target.value)}>
          {schema.fields.map((f) => <option key={f.name} value={f.name}>{f.unit ? `${f.label} (${f.unit})` : f.label}</option>)}
        </select>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={depData} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" interval={0} tick={{ fontSize: 11 }}
              label={{ value: field.unit ? `${field.label} (${field.unit})` : field.label, position: 'insideBottom', offset: -14 }} />
            <YAxis tickFormatter={(v) => `${num(v, 1)}`} label={{ value: 'Mean SHAP (pp)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(v, name, item) => (name === 'mean' ? [`${num(v, 2)} pp (${item.payload.n} women)`, 'Mean SHAP'] : v)} />
            <ReferenceLine y={0} stroke="#5a6d80" />
            <Bar dataKey="mean" isAnimationActive={false}>
              {depData.map((d) => <Cell key={d.label} fill={d.mean > 0 ? UP : DOWN} fillOpacity={d.current ? 1 : 0.45}
                stroke={d.current ? '#2c3e50' : 'none'} strokeWidth={d.current ? 2 : 0} />)}
              <ErrorBar dataKey="err" direction="y" stroke="#2c3e50" width={6} isAnimationActive={false} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="chart-caption">
          Mean SHAP value of the cohort&apos;s women in each band, in percentage points; whiskers are interquartile
          ranges. Every band holds at least {S.min_cell} women{hidden ? `; ${hidden} level${hidden > 1 ? 's' : ''} with fewer women ${hidden > 1 ? 'are' : 'is'} not shown` : ''}.
          {here >= 0 && ' The outlined bar holds this profile\'s value.'}
          {dep.missing && !dep.missing.suppressed && ` Women with no recorded value (${dep.missing.n}) were given the cohort-typical value: mean SHAP ${num(100 * dep.missing.mean, 2)} pp.`}
        </p>
      </div>
    </div>
  );
}
