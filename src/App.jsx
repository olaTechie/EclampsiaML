import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useModel } from './hooks/useModel';
import { DataContext } from './context';
import Layout from './components/Layout';
import ProfileProvider from './components/ProfileProvider';
import RiskCalculator from './pages/RiskCalculator';
import WhatIfSimulator from './pages/WhatIfSimulator';
import ShapExplorer from './pages/ShapExplorer';
import PopulationDashboard from './pages/PopulationDashboard';
import ModelPerformance from './pages/ModelPerformance';
import Predictors from './pages/Predictors';
import About from './pages/About';

export default function App() {
  const data = useModel();

  if (data.loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading the PreSev model…</p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="loading-screen">
        <p className="error-msg">Error loading data: {data.error}</p>
        <p>Please ensure the data files are in the <code>public/data/</code> folder.</p>
      </div>
    );
  }

  return (
    <DataContext.Provider value={data}>
      <HashRouter>
        <ProfileProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<RiskCalculator />} />
              <Route path="what-if" element={<WhatIfSimulator />} />
              <Route path="shap" element={<ShapExplorer />} />
              <Route path="population" element={<PopulationDashboard />} />
              <Route path="performance" element={<ModelPerformance />} />
              <Route path="predictors" element={<Predictors />} />
              <Route path="about" element={<About />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ProfileProvider>
      </HashRouter>
    </DataContext.Provider>
  );
}
