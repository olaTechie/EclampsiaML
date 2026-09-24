import { createContext } from 'react';

/** Exported model data: { model, spec, schema, tiers, performance, predictors, shap, population }. */
export const DataContext = createContext(null);

/** The profile shared by the Risk Calculator, What-If Simulator and SHAP Explorer: { profile, setProfile }. */
export const ProfileContext = createContext(null);
