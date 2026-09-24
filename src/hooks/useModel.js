import { useState, useEffect } from 'react';

const BASE = import.meta.env.BASE_URL;

const FILES = {
  model: 'model.json',
  spec: 'preprocess.json',
  schema: 'input_schema.json',
  tiers: 'risk_tiers.json',
  performance: 'performance.json',
  predictors: 'predictors.json',
};

/**
 * Loads the exported model data (final_analysis/scripts/17_export_webapp.py) on mount.
 * Returns { model, spec, schema, tiers, performance, predictors, loading, error }.
 */
export function useModel() {
  const [data, setData] = useState({
    model: null, spec: null, schema: null, tiers: null, performance: null, predictors: null, loading: true, error: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      try {
        const entries = Object.entries(FILES);
        const results = await Promise.all(entries.map(([, file]) =>
          fetch(`${BASE}data/${file}`).then((r) => {
            if (!r.ok) throw new Error(`Failed to load ${file}: ${r.status}`);
            return r.json();
          })));
        if (cancelled) return;
        const loaded = Object.fromEntries(entries.map(([key], i) => [key, results[i]]));
        setData({ ...loaded, loading: false, error: null });
      } catch (err) {
        if (!cancelled) setData((prev) => ({ ...prev, loading: false, error: err.message }));
      }
    }
    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
