import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ErrorBar, Legend } from 'recharts';
import { num, pct } from '../lib/format';
import { niceStep } from '../lib/ticks';

/** Women per group (bars, left axis) and observed incidence of pre-eclampsia with its 95% CI (points, right axis).
 * Suppressed cells (fewer than the minimum number of women) are left out. */
export default function IncidenceChart({ rows, xLabel, height = 300 }) {
  const data = rows.filter((r) => !r.suppressed).map((r) => ({
    group: r.group, n: r.n, cases: r.cases, inc: 100 * r.incidence,
    err: [100 * (r.incidence - r.inc_lo), 100 * (r.inc_hi - r.incidence)],
  }));
  const step = niceStep(Math.max(10, ...data.map((d) => d.inc + d.err[1])) / 4);
  const top = step * Math.ceil(Math.max(10, ...data.map((d) => d.inc + d.err[1])) / step);
  const incTicks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => Number((i * step).toPrecision(12)));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="group" interval={0} angle={-25} textAnchor="end" height={62} tick={{ fontSize: 11 }}
          label={{ value: xLabel, position: 'insideBottom', offset: 0 }} />
        <YAxis yAxisId="n" allowDecimals={false} label={{ value: 'Women', angle: -90, position: 'insideLeft' }} />
        <YAxis yAxisId="inc" orientation="right" domain={[0, top]} ticks={incTicks} tickFormatter={(v) => `${v}%`}
          label={{ value: 'Incidence', angle: 90, position: 'insideRight' }} />
        <Tooltip formatter={(v, name, item) => (name === 'Incidence'
          ? [`${pct(item.payload.inc / 100)} (${item.payload.cases}/${item.payload.n}; 95% CI ${num(item.payload.inc - item.payload.err[0], 1)}–${num(item.payload.inc + item.payload.err[1], 1)}%)`, name]
          : [v, name])} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
        <Bar yAxisId="n" dataKey="n" name="Women" fill="#9ecae1" isAnimationActive={false} />
        <Line yAxisId="inc" dataKey="inc" name="Incidence" stroke="#c62828" strokeWidth={0} dot={{ r: 4, fill: '#c62828' }} isAnimationActive={false}>
          <ErrorBar dataKey="err" direction="y" stroke="#c62828" width={6} isAnimationActive={false} />
        </Line>
      </ComposedChart>
    </ResponsiveContainer>
  );
}
