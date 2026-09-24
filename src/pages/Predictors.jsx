import { useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ErrorBar, CartesianGrid } from 'recharts';
import { DataContext } from '../context';
import { num } from '../lib/format';

const BASE = import.meta.env.BASE_URL;

export default function Predictors() {
  const { predictors: D } = useContext(DataContext);
  const perm = D.permutation.map((r) => ({
    label: r.label, drop: r.mean_drop, err: [Math.max(0, r.mean_drop - r.lo), Math.max(0, r.hi - r.mean_drop)],
  }));
  const shap = D.shap.map((r) => ({ label: r.label, value: r.mean_abs_shap }));
  return (
    <div className="page page-predictors">
      <h1 className="page-title">Predictors</h1>
      <p className="page-desc">
        Which booking-visit variables the random forest relies on, and a paper nomogram of the penalised regression.
      </p>
      <div className="charts-grid">
        <div className="chart-card">
          <h2 className="section-title">Permutation importance</h2>
          <ResponsiveContainer width="100%" height={Math.max(320, perm.length * 30)}>
            <BarChart data={perm} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(v) => v.toFixed(2)} />
              <YAxis type="category" dataKey="label" width={230} interval={0} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, name) => (name === 'drop' ? num(v, 3) : v)} />
              <Bar dataKey="drop" fill="#0072B2" isAnimationActive={false}>
                <ErrorBar dataKey="err" direction="x" stroke="#2c3e50" strokeWidth={1.5} width={6} isAnimationActive={false} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="chart-caption">
            Mean drop in C statistic when a predictor is randomly permuted in the held-out fold; whiskers are the
            2.5th–97.5th percentiles of single-fold drops (about six cases per fold).
          </p>
        </div>
        <div className="chart-card">
          <h2 className="section-title">SHAP importance</h2>
          <ResponsiveContainer width="100%" height={Math.max(320, shap.length * 30)}>
            <BarChart data={shap} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(v) => v.toFixed(3)} />
              <YAxis type="category" dataKey="label" width={230} interval={0} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => num(v, 4)} />
              <Bar dataKey="value" fill="#009E73" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
          <p className="chart-caption">Mean absolute SHAP value of the final random forest, summed over each predictor&apos;s levels.</p>
        </div>
      </div>
      <h2 className="section-title">Nomogram (penalised logistic regression)</h2>
      <img className="nomogram-img" src={`${BASE}${D.nomogram.image}`} alt="Nomogram for any pre-eclampsia from the penalised logistic regression" />
      <p className="chart-caption">{D.nomogram.legend}</p>
    </div>
  );
}
