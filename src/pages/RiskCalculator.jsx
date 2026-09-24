import { useContext, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { AlertTriangle, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { DataContext, ProfileContext } from '../context';
import { predictRisk, tierFor } from '../lib/risk';
import { contributions } from '../lib/contributions';
import { applyConsistency, checkInput } from '../lib/validation';
import { initialInput } from '../lib/profile';
import { num, pct } from '../lib/format';
import RiskBadge from '../components/RiskBadge';
import ProfileField from '../components/ProfileField';

export default function RiskCalculator() {
  const { model, spec, schema, tiers, performance } = useContext(DataContext);
  const { profile: input, setProfile: setInput } = useContext(ProfileContext);
  const bundle = useMemo(() => ({ model, spec }), [model, spec]);
  const check = useMemo(() => checkInput(input, schema), [input, schema]);
  const result = useMemo(() => (check.errors.length ? null : predictRisk(input, bundle)), [check, input, bundle]);
  const drivers = useMemo(
    () => (result ? contributions(input, bundle, schema).filter((d) => Math.abs(d.delta) >= 5e-5).slice(0, 8) : []),
    [result, input, bundle, schema],
  );
  const tier = result ? tierFor(result.risk, tiers) : null;
  const sub = Object.fromEntries(performance.subgroups.map((s) => [s.group, s]));
  const groups = [...new Set(schema.fields.map((f) => f.group))];
  const deliveries = input.number_of_previous_deliver;
  const hasDeliveries = deliveries !== null && deliveries !== undefined && deliveries !== '';
  const set = (name, value) => setInput((prev) => applyConsistency({ ...prev, [name]: value }));

  return (
    <div className="page page-calculator">
      <h1 className="page-title">Pre-eclampsia Risk Calculator</h1>
      <p className="page-desc">
        Estimated risk of pre-eclampsia in the current pregnancy from information recorded at the booking visit
        (14–20 weeks). Developed in a prospective cohort of {tiers.cohort.n} women at six antenatal clinics in
        Lagos, Nigeria.
      </p>
      <div className="calc-layout">
        <form className="calc-form" onSubmit={(e) => e.preventDefault()}>
          {groups.map((g) => (
            <fieldset className="field-group" key={g}>
              <legend>{g}</legend>
              <div className="fields-grid">
                {schema.fields.filter((f) => f.group === g).map((f) => (
                  <ProfileField
                    key={f.name}
                    field={f}
                    value={input[f.name]}
                    onChange={set}
                    locked={f.name === 'interpregnancy_cat' && hasDeliveries && Number(deliveries) === 0}
                    parous={hasDeliveries && Number(deliveries) > 0}
                  />
                ))}
              </div>
            </fieldset>
          ))}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setInput(initialInput(schema, null))}>
              Reset to cohort-typical values
            </button>
          </div>
        </form>

        <div className="calc-results" aria-live="polite">
          {check.errors.length > 0 && (
            <div className="warning-banner" role="alert">
              <AlertTriangle size={18} />
              <div>{check.errors.map((e) => <p key={e.field}>{e.message}</p>)}</div>
            </div>
          )}
          {result && (
            <div className="result-card" style={{ borderTopColor: tier.color }}>
              <p className="metric-label">Predicted risk of pre-eclampsia</p>
              <div className="result-risk" style={{ color: tier.color }}>{pct(result.risk)}</div>
              <RiskBadge tier={tier} />
              <p className="result-tier">
                In the development cohort, {pct(tier.incidence)} ({tier.cases}/{tier.n}) of women in this risk group
                ({tier.range}) developed pre-eclampsia. Cohort average: {pct(tiers.cohort.incidence)}.
              </p>
              <p className="result-action">This tool does not recommend management; follow local antenatal protocols.</p>
              <p className="page-links">
                <NavLink to="/what-if">Try changes in the What-If Simulator</NavLink>
                <NavLink to="/shap">See the SHAP explanation</NavLink>
              </p>
              {result.imputed.length > 0 && (
                <p className="card-note">
                  {result.imputed.length} value{result.imputed.length > 1 ? 's were' : ' was'} unknown and filled in with
                  the cohort-typical value, as the model does.
                </p>
              )}
            </div>
          )}
          {check.nulliparous && sub.Nulliparous && sub.Parous && (
            <div className="warning-banner" role="note">
              <Info size={18} />
              <p>
                Discrimination is lower in first pregnancies (C {num(sub.Nulliparous.auc)} vs {num(sub.Parous.auc)} in
                parous women); clinical judgement must override.
              </p>
            </div>
          )}
          {check.warnings.map((w) => <p className="card-warning" key={w.field}>{w.message}</p>)}
          {result && drivers.length === 0 && (
            <p className="card-note">Every factor is at its cohort-typical value, so no single factor moves this estimate.</p>
          )}
          {result && drivers.length > 0 && (
            <div className="contrib-card">
              <h2 className="section-title">What drives this estimate</h2>
              <p className="contrib-desc">
                How the model&apos;s estimate would change, in percentage points, if each factor were typical for the
                cohort. This describes the model, not a causal effect.
              </p>
              <ResponsiveContainer width="100%" height={Math.max(220, drivers.length * 34)}>
                <BarChart
                  data={drivers.map((d) => ({ label: d.label, pp: +(100 * d.delta).toFixed(2), key: d.variable }))}
                  layout="vertical"
                  margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
                >
                  <XAxis type="number" unit=" pp" />
                  <YAxis type="category" dataKey="label" width={210} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `${v > 0 ? '+' : ''}${v} pp`} />
                  <ReferenceLine x={0} stroke="#5a6d80" />
                  <Bar dataKey="pp" isAnimationActive={false}>
                    {drivers.map((d) => <Cell key={d.variable} fill={d.delta > 0 ? '#c62828' : '#2e7d32'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
