import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Calculator, BarChart3, Layers, Info, Menu, X, Activity } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Risk Calculator', icon: Calculator },
  { to: '/performance', label: 'Model Performance', icon: BarChart3 },
  { to: '/predictors', label: 'Predictors', icon: Layers },
  { to: '/about', label: 'About', icon: Info },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      {/* Mobile header */}
      <header className="mobile-header">
        <button
          className="menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="mobile-brand">
          <Activity size={20} />
          <span>PreSev Study</span>
        </div>
      </header>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <nav className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`} role="navigation" aria-label="Main navigation">
        <div className="sidebar-brand">
          <Activity size={28} color="#0e9aa7" />
          <div>
            <h1 className="sidebar-title">PreSev Study</h1>
            <p className="sidebar-subtitle">Pre-eclampsia risk calculator</p>
          </div>
        </div>

        <ul className="nav-list">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-footer">
          <p>Lagos, Nigeria</p>
          <p className="sidebar-version">v2.0 &middot; Browser-only</p>
        </div>
      </nav>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
