import React, { useState } from 'react';
import { Layout, NavigationTab } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { MachinesPage } from './pages/MachinesPage';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>('INC-M204-001');
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>('M-204');

  const handleNavigateToIncident = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
    setCurrentTab('incidents');
  };

  const handleNavigateToMachine = (machineId: string) => {
    setSelectedMachineId(machineId);
    setCurrentTab('machines');
  };

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      activeIncidentCount={1}
    >
      {currentTab === 'dashboard' && (
        <DashboardPage
          onNavigateToIncident={handleNavigateToIncident}
          onNavigateToMachine={handleNavigateToMachine}
        />
      )}
      {currentTab === 'incidents' && (
        <IncidentsPage
          selectedIncidentId={selectedIncidentId}
        />
      )}
      {currentTab === 'machines' && (
        <MachinesPage
          selectedMachineId={selectedMachineId}
        />
      )}
      {currentTab === 'sops' && (
        <div className="page-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">SOP Knowledge Retrieval Library</h1>
              <p className="page-subtitle">Indexed Standard Operating Procedures & Engineering Manuals</p>
            </div>
          </div>
          <div className="card">
            <div className="card-header-label">SOP Index (In-Memory Vector DB)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>SOP-M204-BEARING</span>
                  <span className="badge badge-normal">INDEXED</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginTop: '0.4rem' }}>Hydraulic Drive & Bearing Failure Emergency Containment</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Covers vibration spikes &gt;4.5 mm/s, bearing temperature exceeding 75°C, and auxiliary coolant flush procedures.</p>
              </div>
              <div style={{ padding: '1rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>SOP-COOLING-PUMP</span>
                  <span className="badge badge-normal">INDEXED</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginTop: '0.4rem' }}>Secondary Auxiliary Coolant Pump Failure Response</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Covers coolant loop pressure drop below 2.0 bar and emergency bypass valve actuation.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      {currentTab === 'analytics' && (
        <div className="page-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">Predictive Anomaly & Fleet Analytics</h1>
              <p className="page-subtitle">Z-Score & EWMA Anomaly Trend Analysis</p>
            </div>
          </div>
          <div className="card">
            <div className="card-header-label">Telemetry Predictive Graph</div>
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
              <h3>Continuous Statistical Anomaly Engine</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>Monitoring Machine M-204, M-101, M-305 at 1-second interval sampling rate.</p>
            </div>
          </div>
        </div>
      )}
      {(currentTab === 'alerts' || currentTab === 'settings') && (
        <div className="page-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">{currentTab.toUpperCase()} Module</h1>
              <p className="page-subtitle">Industrial AI Command Center Configuration</p>
            </div>
          </div>
          <div className="card">
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <h3>System Operational</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>All services bound to local FastAPI backend engine.</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;

