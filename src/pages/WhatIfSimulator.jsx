import { useContext, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea, ReferenceLine } from 'recharts';
import { DataContext, ProfileContext } from '../context';
import { predictRisk, tierFor } from '../lib/risk';
import { applyConsistency, checkInput } from '../lib/validation';
import { gridFor, riskCurve } from '../lib/whatif';
import { num, pct } from '../lib/format';
import { niceTicks } from '../lib/ticks';
import RiskBadge from '../components/RiskBadge';
import ProfileField from '../components/ProfileField';

const same = (a, b) => (a ?? null) === (b ?? null);

function RiskCard({ title, result, tiers }) {
  const tier = result ? tierFor(result.risk, tiers) : null;
  return (
    <div className="compare-card" style={tier ? { borderTopColor: tier.color } : undefined}>
      <p className="metric-label">{title}</p>
      {result ? (
        <>
          <div className="result-risk" style={{ color: tier.color }}>{pct(result.risk)}</div>
          <RiskBadge tier={tier} />
        </>
      ) : <p className="card-note">Complete the highlighted values to see an estimate.</p>}
    </div>
  );
}

export default function WhatIfSimulator() {
  const { model, spec, schema, tiers } = useContext(DataContext);
  const { profile } = useContext(ProfileContext);
  const [modified, setModified] = useState(profile);
  const numeric = schema.fields.filter((f) => f.kind === 'number');
  const [sweep, setSweep] = useState('enr_bp_diastolic');
  const bundle = useMemo(() => ({ model, spec }), [model, spec]);
  const baseCheck = useMemo(() => checkInput(profile, schema), [profile, schema]);
  const modCheck = useMemo(() => checkInput(modified, schema), [modified, schema]);
  const base = baseCheck.errors.length ? null : predictRisk(profile, bundle);
  const mod = modCheck.errors.length ? null : predictRisk(modified, bundle);
  const field = numeric.find((f) => f.name === sweep);
  const modValid = modCheck.errors.length === 0;
  const curve = useMemo(() => {
    if (!modValid) return [];
    const f = schema.fields.find((x) => x.name === sweep);
    return riskCurve(modified, sweep, gridFor(f, 60), bundle).map((d) => ({ x: d.x, risk: 100 * d.risk }));
  }, [modValid, modified, sweep, schema, bundle]);
  const changed = schema.fields.filter((f) => !same(profile[f.name], modified[f.name]));
  const groups = [...new Set(schema.fields.map((f) => f.group))];
  const deliveries = modified.number_of_previous_deliver;
  const hasDeliveries = deliveries !== null && deliveries !== undefined && deliveries !== '';
  const set = (name, value) => setModified((prev) => applyConsistency({ ...prev, [name]: value }));
  const delta = base && mod ? 100 * (mod.risk - base.risk) : null;
  const yTop = Math.max(20, Math.ceil((Math.max(0, ...curve.map((d) => d.risk)) * 1.15) / 5) * 5);
  const [c1, c2] = tiers.cutoffs.map((c) => 100 * c);
  const xLo = curve.length ? curve[0].x : 0;
  const xHi = curve.length ? curve[curve.length - 1].x : 1;

  return (
    <div className="page page-whatif">
      <h1 className="page-title">What-If Simulator</h1>
      <p className="page-desc">
        Start from the profile in the <NavLink to="/">Risk Calculator</NavLink>, change any factor, and see how the
        model&apos;s estimate responds.
      </p>

      <div className="compare-row">
        <RiskCard title="Calculator profile" result={base} tiers={tiers} />
        <div className="compare-card change-card">
          <p className="metric-label">Change</p>
          <div className="delta-value">
            {delta === null ? 'NA' : `${delta > 0 ? '+' : ''}${num(delta, 1)} pp`}
          </div>
          <p className="card-note">
            {changed.length === 0 ? 'No factors changed yet' : `${changed.length} factor${changed.length > 1 ? 's' : ''} changed`}
          </p>
        </div>
        <RiskCard title="What-if profile" result={mod} tiers={tiers} />
      </div>
      <p className="model-note">
        This shows how the model&apos;s estimate responds to a different value. It does not show what would happen to a
        woman&apos;s risk if that factor were treated or changed.
      </p>
      {modCheck.errors.length > 0 && (
        <div className="warning-banner" role="alert">
          <AlertTriangle size={18} />
          <div>{modCheck.errors.map((e) => <p key={e.field}>{e.message}</p>)}</div>
        </div>
      )}

      <div className="calc-layout">
        <form className="calc-form" onSubmit={(e) => e.preventDefault()}>
          {groups.map((g) => (
            <fieldset className="field-group" key={g}>
              <legend>{g}</legend>
              <div className="fields-grid">
                {schema.fields.filter((f) => f.group === g).map((f) => (
                  <ProfileField
                    key={f.name}
                    idPrefix="w"
                    field={f}
                    value={modified[f.name]}
                    onChange={set}
                    slider
                    changed={!same(profile[f.name], modified[f.name])}
                    locked={f.name === 'interpregnancy_cat' && hasDeliveries && Number(deliveries) === 0}
                    parous={hasDeliveries && Number(deliveries) > 0}
                  />
                ))}
              </div>
            </fieldset>
          ))}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModified(profile)} disabled={changed.length === 0}>
              Reset to calculator profile
            </button>
          </div>
        </form>

        <div className="chart-card">
          <h2 className="section-title">How the estimate changes with one factor</h2>
          <label className="inline-label" htmlFor="sweep-var">Factor</label>
          <select id="sweep-var" className="form-input inline-select" value={sweep} onChange={(e) => setSweep(e.target.value)}>
            {numeric.map((f) => <option key={f.name} value={f.name}>{f.unit ? `${f.label} (${f.unit})` : f.label}</option>)}
          </select>
          {mod ? (
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={curve} margin={{ top: 24, right: 16, bottom: 24, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <ReferenceArea y1={0} y2={c1} fill={tiers.tiers[0].bg} fillOpacity={0.8} ifOverflow="hidden" />
                <ReferenceArea y1={c1} y2={c2} fill={tiers.tiers[1].bg} fillOpacity={0.8} ifOverflow="hidden" />
                <ReferenceArea y1={c2} y2={yTop} fill={tiers.tiers[2].bg} fillOpacity={0.8} ifOverflow="hidden" />
                <XAxis dataKey="x" type="number" domain={[xLo, xHi]} ticks={niceTicks(xLo, xHi, 7)}
                  label={{ value: field.unit ? `${field.label} (${field.unit})` : field.label, position: 'insideBottom', offset: -12 }} />
                <YAxis domain={[0, yTop]} ticks={niceTicks(0, yTop, 6)} allowDataOverflow tickFormatter={(v) => `${v}%`}
                  label={{ value: 'Predicted risk', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(v) => `${num(v, 1)}%`} labelFormatter={(v) => `${field.label} ${num(v, field.step < 1 ? 1 : 0)}`} />
                {modified[sweep] !== null && modified[sweep] !== undefined && (
                  <ReferenceLine x={modified[sweep]} stroke="#2c3e50" strokeDasharray="4 4" label={{ value: 'Current', position: 'top', fontSize: 11 }} />
                )}
                <Line dataKey="risk" stroke="#0072B2" strokeWidth={2.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="card-note">Complete the what-if profile to draw the curve.</p>}
          <p className="chart-caption">
            Every other factor is held at the what-if profile. The factor runs over the 1st to 99th percentile of the
            cohort; shading marks the risk groups (&lt;{c1}%, {c1}–{c2}%, ≥{c2}%).
          </p>
        </div>
      </div>
    </div>
  );
}
