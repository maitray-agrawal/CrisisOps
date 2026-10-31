import React, { useState } from 'react';
import { apiService } from '../services/api';
import { DemoGuideModal } from './DemoGuideModal';

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
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState<boolean>(false);

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
            <span><span className="item-icon">📊</span> Overview</span>
          </button>

          <button
            className={`sidebar-item ${currentTab === 'incidents' ? 'active' : ''}`}
            onClick={() => onSelectTab('incidents')}
          >
            <span><span className="item-icon">🚨</span> Incidents</span>
            {activeIncidentCount > 0 && (
              <span className="sidebar-item-badge">{activeIncidentCount}</span>
            )}
          </button>

          <button
            className={`sidebar-item ${currentTab === 'machines' ? 'active' : ''}`}
            onClick={() => onSelectTab('machines')}
          >
            <span><span className="item-icon">⚡</span> Fleet & Telemetry</span>
          </button>

          <div className="nav-section-title">Intelligence & SOPs</div>

          <button
            className={`sidebar-item ${currentTab === 'sops' ? 'active' : ''}`}
            onClick={() => onSelectTab('sops')}
          >
            <span><span className="item-icon">📖</span> SOP Knowledge</span>
          </button>

          <button
            className={`sidebar-item ${currentTab === 'analytics' ? 'active' : ''}`}
            onClick={() => onSelectTab('analytics')}
          >
            <span><span className="item-icon">📈</span> Predictive Analytics</span>
          </button>

          <button
            className={`sidebar-item ${currentTab === 'alerts' ? 'active' : ''}`}
            onClick={() => onSelectTab('alerts')}
          >
            <span><span className="item-icon">🔔</span> Anomaly Feeds</span>
          </button>

          <div className="nav-section-title">System</div>

          <button
            className={`sidebar-item ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => onSelectTab('settings')}
          >
            <span><span className="item-icon">⚙️</span> Control Config</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div style={{ color: 'var(--text-bright)', fontWeight: 600 }}>Plant B — Main Line</div>
          <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>Mode: AI Human-in-the-Loop</div>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Header Bar */}
        <header className="top-header">
          <div className="search-box">
            <span>🔍</span>
            <input type="text" placeholder="Search machines, telemetry logs, or incidents..." readOnly />
            <span className="search-shortcut">⌘K</span>
          </div>

          <div className="top-header-actions">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginRight: '8px' }}>
              <button
                className="btn btn-primary"
                style={{ fontSize: '0.75rem', padding: '4px 12px', height: '32px', background: 'linear-gradient(135deg, #06b6d4, #0284c7)', color: '#fff', border: 'none', fontWeight: 700 }}
                onClick={() => setIsDemoGuideOpen(true)}
                title="Launch Judge Demo Walkthrough Guide (7-Act Crisis Flow)"
              >
                🎯 Demo Guide
              </button>

              <button
                className="btn btn-danger"
                style={{ fontSize: '0.75rem', padding: '4px 10px', height: '32px' }}
                onClick={async () => {
                  await apiService.triggerDegradation();
                  window.dispatchEvent(new Event('simulation-updated'));
                }}
                title="Trigger M-204 bearing degradation simulation scenario"
              >
                🔥 Trigger M-204 Failure
              </button>

              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 10px', height: '32px' }}
                onClick={async () => {
                  await apiService.triggerSimulationTick();
                  window.dispatchEvent(new Event('simulation-updated'));
                }}
                title="Advance telemetry simulation stream by 1 step"
              >
                ⏩ Step Tick
              </button>

              <button
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', padding: '4px 10px', height: '32px', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                onClick={async () => {
                  await apiService.resetSimulation();
                  window.dispatchEvent(new Event('simulation-updated'));
                }}
                title="Reset simulation and clear active incidents"
              >
                🔄 Reset Demo
              </button>
            </div>

            <div className="system-online-badge" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span className="pulsate-dot"></span>
              <span>SYSTEM ONLINE</span>
            </div>

            <div style={{
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              color: 'var(--accent-cyan)',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>🛡️ SHA-256 LEDGER ACTIVE</span>
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
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>

      {/* Demo Guide Walkthrough Modal */}
      <DemoGuideModal
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
        onNavigateToTab={(tab) => {
          onSelectTab(tab);
          // Allow tab navigation without closing modal if desired or auto-close
        }}
      />
    </div>
  );
};


