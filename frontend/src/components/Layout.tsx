import React from 'react';
import {
  Activity,
  AlertTriangle,
  Cpu,
  BookOpen,
  TrendingUp,
  Radio,
  Sliders,
  Search
} from 'lucide-react';

export type NavigationTab = 'dashboard' | 'incidents' | 'machines' | 'sops' | 'analytics' | 'alerts' | 'settings';

interface LayoutProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
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
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">CO</div>
          <div>
            <div className="sidebar-brand-title">CrisisOps</div>
            <div className="sidebar-brand-sub">AI Command Center</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Core Operations</div>
          
          <button
            className={`sidebar-item ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onSelectTab('dashboard')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Activity size={17} className="item-icon" />
              Overview
            </span>
          </button>

          <button
            className={`sidebar-item ${currentTab === 'incidents' ? 'active' : ''}`}
            onClick={() => onSelectTab('incidents')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AlertTriangle size={17} className="item-icon" />
              Incidents
            </span>
            {activeIncidentCount > 0 && (
              <span className="sidebar-item-badge">{activeIncidentCount}</span>
            )}
          </button>

          <button
            className={`sidebar-item ${currentTab === 'machines' ? 'active' : ''}`}
            onClick={() => onSelectTab('machines')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Cpu size={17} className="item-icon" />
              Fleet &amp; Telemetry
            </span>
          </button>

          <div className="nav-section-title">Intelligence &amp; SOPs</div>

          <button
            className={`sidebar-item ${currentTab === 'sops' ? 'active' : ''}`}
            onClick={() => onSelectTab('sops')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <BookOpen size={17} className="item-icon" />
              SOP Knowledge
            </span>
          </button>

          <button
            className={`sidebar-item ${currentTab === 'analytics' ? 'active' : ''}`}
            onClick={() => onSelectTab('analytics')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <TrendingUp size={17} className="item-icon" />
              Predictive Analytics
            </span>
          </button>

          <button
            className={`sidebar-item ${currentTab === 'alerts' ? 'active' : ''}`}
            onClick={() => onSelectTab('alerts')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Radio size={17} className="item-icon" />
              Anomaly Feeds
            </span>
          </button>

          <div className="nav-section-title">System</div>

          <button
            className={`sidebar-item ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => onSelectTab('settings')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Sliders size={17} className="item-icon" />
              Control Config
            </span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div style={{ color: 'var(--text-bright)', fontWeight: 600 }}>Plant B — Main Line</div>
          <div style={{ fontSize: '0.7rem', marginTop: '2px', color: 'var(--text-muted)' }}>Mode: AI Human-in-the-Loop</div>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Header Bar */}
        <header className="top-header">
          <div className="search-box">
            <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input type="text" placeholder="Search machines, incidents, telemetry" readOnly />
            <span className="search-shortcut">Ctrl+K</span>
          </div>

          <div className="top-header-actions">
            <div className="system-online-badge">
              <span className="pulsate-dot"></span>
              <span>SYSTEM ONLINE</span>
            </div>

            <div className="sha256-active-badge">
              <span className="pulsate-dot-cyan"></span>
              <span>SHA-256 LEDGER ACTIVE</span>
            </div>

            <div className="operator-profile">
              <div className="avatar-circle">OP</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#fff' }}>Shift Lead</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Site Operator #42</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page View Container */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
