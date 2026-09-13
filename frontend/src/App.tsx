import React, { useState } from 'react';
import { Layout, NavigationTab } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { MachinesPage } from './pages/MachinesPage';
import { apiService } from './services/api';
import {
  TrendingUpIcon,
  SlidersIcon,
  PlayIcon,
  FastForwardIcon,
  RotateCcwIcon,
  BookOpenIcon,
  BellIcon,
  CheckCircleIcon
} from './components/Icons';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>('INC-M204-001');
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>('M-204');
  const [simActionNotice, setSimActionNotice] = useState<string | null>(null);

  const handleNavigateToIncident = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
    setCurrentTab('incidents');
  };

  const handleNavigateToMachine = (machineId: string) => {
    setSelectedMachineId(machineId);
    setCurrentTab('machines');
  };

  const showSimNotice = (msg: string) => {
    setSimActionNotice(msg);
    setTimeout(() => setSimActionNotice(null), 4000);
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
            <div className="card-header-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BookOpenIcon size={14} color="var(--accent-cyan)" /> SOP Vector Knowledge Base
              </span>
              <span className="badge badge-normal">2 SOPs Indexed</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>SOP-M204-BEARING</span>
                  <span className="badge badge-normal">INDEXED</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginTop: '0.4rem' }}>Hydraulic Drive & Bearing Failure Emergency Containment</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Covers vibration spikes &gt;4.5 mm/s, bearing temperature exceeding 75°C, and auxiliary coolant flush procedures.
                </p>
              </div>
              <div style={{ padding: '1rem', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>SOP-COOLING-PUMP</span>
                  <span className="badge badge-normal">INDEXED</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginTop: '0.4rem' }}>Secondary Auxiliary Coolant Pump Failure Response</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Covers coolant loop pressure drop below 2.0 bar and emergency bypass valve actuation.
                </p>
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
              <p className="page-subtitle">Z-Score & Statistical Anomaly Trend Analysis</p>
            </div>
          </div>
          <div className="card">
            <div className="card-header-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <TrendingUpIcon size={14} color="var(--accent-cyan)" /> Telemetry Predictive Signal Stream
              </span>
              <span className="badge badge-normal">1 Hz Sampling</span>
            </div>
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '50%', marginBottom: '1rem', color: 'var(--accent-cyan)' }}>
                <TrendingUpIcon size={32} />
              </div>
              <h3 style={{ color: '#fff', fontSize: '1.1rem' }}>Continuous Statistical Anomaly Engine</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.4rem', maxWidth: '500px', margin: '0.4rem auto 0' }}>
                Monitoring Machine M-204, M-101, M-305 at 1-second interval sampling rate with dynamic Z-score standard deviation thresholds.
              </p>
            </div>
          </div>
        </div>
      )}
      {currentTab === 'alerts' && (
        <div className="page-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">Anomaly Feeds & Alert History</h1>
              <p className="page-subtitle">High-Frequency Outlier Detection & Threshold Violations</p>
            </div>
          </div>
          <div className="card">
            <div className="card-header-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BellIcon size={14} color="var(--status-warning)" /> Active Threshold Feeds
              </span>
              <span className="badge badge-warning">1 Alert Active</span>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span className="mono" style={{ color: 'var(--status-critical)', fontWeight: 700 }}>ALT-M204-VIB-01</span>
                  <span className="badge badge-critical">CRITICAL VIOLATION</span>
                </div>
                <div style={{ fontWeight: 600, color: '#fff' }}>M-204 Vibration Sensor &gt; 4.5 mm/s (Z-Score &gt; +3.0)</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Source: Accelerometer CH-02 (Hydraulic Bearing Housing) • Correlated with Incident INC-M204-001
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {currentTab === 'settings' && (
        <div className="page-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">Control Configuration & Simulation Deck</h1>
              <p className="page-subtitle">Industrial AI Incident Response Parameters & Demonstration Scenario Controls</p>
            </div>
          </div>

          {/* SIMULATION CONTROLS SECTION (Relocated from top header) */}
          <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(6, 182, 212, 0.4)', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.04) 0%, rgba(15, 19, 29, 0.95) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.4)', marginBottom: '0.35rem' }}>
                  SIMULATION CONTROL
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0.2rem 0' }}>
                  Scenario: M-204 Bearing Degradation
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Controls telemetry injection, scenario fault triggers, and live demo state advancement.
                </p>
              </div>
              <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                Target Endpoint: /api/simulation
              </div>
            </div>

            {simActionNotice && (
              <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 'var(--radius-sm)', color: '#4ade80', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircleIcon size={14} /> {simActionNotice}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff', marginBottom: '0.25rem' }}>Trigger Failure</div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Injects 7.82 mm/s vibration spike and generates active incident ticket for M-204.
                </p>
                <button
                  className="btn"
                  style={{ width: '100%', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', fontSize: '0.8rem', padding: '0.5rem' }}
                  onClick={async () => {
                    try {
                      await apiService.triggerDegradation();
                      window.dispatchEvent(new Event('simulation-updated'));
                      showSimNotice('M-204 bearing degradation triggered. Active incident loaded.');
                    } catch (e: any) {
                      showSimNotice(`Error: ${e.message}`);
                    }
                  }}
                >
                  <PlayIcon size={14} /> Trigger Failure Scenario
                </button>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff', marginBottom: '0.25rem' }}>Advance Simulation</div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Advances telemetry stream clock by 1 discrete time step.
                </p>
                <button
                  className="btn btn-outline"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem', borderColor: 'var(--accent-blue)', color: '#60a5fa' }}
                  onClick={async () => {
                    try {
                      await apiService.triggerSimulationTick();
                      window.dispatchEvent(new Event('simulation-updated'));
                      showSimNotice('Telemetry stream advanced by 1 step.');
                    } catch (e: any) {
                      showSimNotice(`Error: ${e.message}`);
                    }
                  }}
                >
                  <FastForwardIcon size={14} /> Advance Simulation
                </button>
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff', marginBottom: '0.25rem' }}>Reset Scenario</div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Restores nominal sensor registers and resets scenario database state.
                </p>
                <button
                  className="btn btn-outline"
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                  onClick={async () => {
                    try {
                      await apiService.resetSimulation();
                      window.dispatchEvent(new Event('simulation-updated'));
                      showSimNotice('Simulation reset to nominal baseline state.');
                    } catch (e: any) {
                      showSimNotice(`Error: ${e.message}`);
                    }
                  }}
                >
                  <RotateCcwIcon size={14} /> Reset Scenario
                </button>
              </div>
            </div>
          </div>

          {/* Plant Parameters */}
          <div className="card">
            <div className="card-header-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <SlidersIcon size={14} /> Operational Governance Parameters
              </span>
              <span className="badge badge-normal">VERIFIED</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Human-in-the-Loop Approval Policy</div>
                <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>Strict Operator Authorization Gate</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--status-normal)', marginTop: '0.25rem' }}>Actuation blocked until cryptographic signoff</div>
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Decision Ledger Protocol</div>
                <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>SHA-256 Hash Chain Integrity</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginTop: '0.25rem' }}>Continuous parent-child hash verification</div>
              </div>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Agent Pipeline Architecture</div>
                <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>Sequential 4-Stage Multi-Agent System</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-bright)', marginTop: '0.25rem' }}>Signal Analysis → RCA → Impact → SOP RAG</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
