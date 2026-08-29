import React from 'react';

interface LayoutProps {
  currentTab: 'dashboard' | 'incidents' | 'machines';
  onSelectTab: (tab: 'dashboard' | 'incidents' | 'machines') => void;
  children: React.ReactNode;
  activeIncidentCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  children,
  activeIncidentCount = 1
}) => {
  return (
    <div className="app-container">
      <header className="navbar">
        <div className="brand">
          <div className="brand-logo">CO</div>
          <div>
            <div className="brand-title">Industrial CrisisOps</div>
            <div className="brand-subtitle">AI Incident Investigation & Response Platform</div>
          </div>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-button ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onSelectTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`nav-button ${currentTab === 'incidents' ? 'active' : ''}`}
            onClick={() => onSelectTab('incidents')}
          >
            Incidents {activeIncidentCount > 0 && <span style={{ marginLeft: '4px', padding: '1px 6px', background: '#ef4444', color: '#fff', borderRadius: '10px', fontSize: '0.7rem' }}>{activeIncidentCount}</span>}
          </button>
          <button
            className={`nav-button ${currentTab === 'machines' ? 'active' : ''}`}
            onClick={() => onSelectTab('machines')}
          >
            Machines & Telemetry
          </button>
        </nav>

        <div className="system-status">
          <span className="status-dot"></span>
          <span>SYSTEM ONLINE</span>
        </div>
      </header>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
