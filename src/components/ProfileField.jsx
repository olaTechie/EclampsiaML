/** One input of the woman's profile. Numbers can show a slider over the cohort 1st-99th percentile; `changed`
 * highlights a value that differs from the calculator profile (What-If Simulator). */
export default function ProfileField({ field, value, onChange, locked, parous, slider = false, changed = false, idPrefix = 'f' }) {
  const id = `${idPrefix}-${field.name}`;
  const label = field.unit ? `${field.label} (${field.unit})` : field.label;
  const cls = `form-group${changed ? ' field-changed' : ''}`;
  if (field.kind === 'number') {
    const number = (
      <input
        id={id}
        className="form-input"
        type="number"
        step={field.step}
        min={field.hard_min}
        max={field.hard_max}
        value={value ?? ''}
        placeholder="Unknown"
        onChange={(e) => onChange(field.name, e.target.value === '' ? null : Number(e.target.value))}
      />
    );
    if (!slider) {
      return <div className={cls}><label htmlFor={id}>{label}</label>{number}</div>;
    }
    const lo = Math.min(field.p01, value ?? field.p01);
    const hi = Math.max(field.p99, value ?? field.p99);
    return (
      <div className={cls}>
        <label htmlFor={id}>{label}</label>
        <div className="slider-row">
          <input
            type="range"
            aria-label={`${label} slider`}
            min={lo}
            max={hi}
            step={field.step}
            value={value ?? field.default}
            onChange={(e) => onChange(field.name, Number(e.target.value))}
          />
          {number}
        </div>
      </div>
    );
  }
  const levels = field.name === 'interpregnancy_cat' && parous
    ? field.levels.filter((l) => l.value !== 'Nulliparous')
    : field.levels;
  return (
    <div className={cls}>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        className="form-input"
        value={value ?? ''}
        disabled={locked}
        onChange={(e) => onChange(field.name, e.target.value === '' ? null : e.target.value)}
      >
        {!locked && <option value="">Unknown</option>}
        {levels.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
      </select>
    </div>
  );
}
