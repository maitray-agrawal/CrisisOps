import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Machine, Incident, TelemetryRecord } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';

interface DashboardPageProps {
  onNavigateToIncident: (incidentId: string) => void;
  onNavigateToMachine: (machineId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToIncident,
  onNavigateToMachine
}) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [m204Telemetry, setM204Telemetry] = useState<TelemetryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [machinesData, incidentsData, telemetryData] = await Promise.all([
        apiService.getMachines(),
        apiService.getIncidents(),
        apiService.getMachineTelemetry('M-204', 5)
      ]);
      setMachines(machinesData);
      setIncidents(incidentsData);
      setM204Telemetry(telemetryData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) return <LoadingSpinner message="Connecting to industrial telemetry pipeline & AI agent stream..." />;
  if (error) return <ErrorAlert message={error} onRetry={loadDashboardData} />;

  const criticalIncidents = incidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');
  const criticalMachineCount = machines.filter(m => m.status === 'CRITICAL' || m.status === 'WARNING').length;
  const latestM204Vibration = m204Telemetry.length > 0 ? m204Telemetry[0].vibration_mm_s : 5.82;
  const latestM204Temp = m204Telemetry.length > 0 ? m204Telemetry[0].temp_celsius : 82.4;

  return (
    <div className="page-container">
      {/* Top Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Operations Command Center</h1>
          <p className="page-subtitle">Real-time Telemetry, Statistical Anomaly Detection & AI Incident Response</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last synced: Just now</span>
          <button className="btn btn-outline" onClick={loadDashboardData} style={{ fontSize: '0.8rem' }}>
            🔄 Refresh Pipeline
          </button>
        </div>
      </div>

      {/* Critical Incident Spotlight Card */}
      {criticalIncidents.length > 0 && (
        <div className="alert-banner spotlight-card">
          <div className="alert-info" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <span className="badge badge-critical">CRITICAL SPOTLIGHT</span>
              <span className="mono" style={{ color: 'var(--status-critical)', fontWeight: 700 }}>{criticalIncidents[0].id}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• Asset: Machine M-204</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: '0 0 0.4rem 0' }}>
              {criticalIncidents[0].title}
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.4' }}>
              {criticalIncidents[0].summary}
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.8rem' }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Vibration:</span> <strong className="mono" style={{ color: 'var(--status-critical)' }}>{latestM204Vibration.toFixed(2)} mm/s</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Bearing Temp:</span> <strong className="mono" style={{ color: 'var(--status-critical)' }}>{latestM204Temp.toFixed(1)}°C</strong></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Root Cause Confidence:</span> <strong style={{ color: 'var(--accent-cyan)' }}>89% (AI Agent)</strong></div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={() => onNavigateToIncident(criticalIncidents[0].id)}
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }}
            >
              🔍 Open AI Investigation Workflow
            </button>
            <button
              className="btn btn-outline"
              onClick={() => onNavigateToMachine('M-204')}
              style={{ fontSize: '0.8rem' }}
            >
              ⚡ View M-204 Live Telemetry
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-title">
            <span>Fleet Monitored Assets</span>
            <span className="badge badge-normal">3 Active</span>
          </div>
          <div className="metric-value">{machines.length} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>Units</span></div>
          <div className="metric-desc">Continuous telemetry stream online</div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Anomalous Assets</span>
            <span style={{ color: criticalMachineCount > 0 ? 'var(--status-critical)' : 'var(--status-normal)', fontWeight: 600 }}>
              {criticalMachineCount > 0 ? 'Critical Attention' : 'All Clear'}
            </span>
          </div>
          <div className="metric-value" style={{ color: criticalMachineCount > 0 ? 'var(--status-critical)' : 'var(--status-normal)' }}>
            {criticalMachineCount}
          </div>
          <div className="metric-desc">Machine M-204 bearing degradation</div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>M-204 Peak Vibration</span>
            <span className="badge badge-critical">+132.8%</span>
          </div>
          <div className="metric-value" style={{ color: 'var(--status-critical)' }}>
            {latestM204Vibration.toFixed(2)} <span style={{ fontSize: '1rem' }}>mm/s</span>
          </div>
          <div className="metric-desc">Baseline Limit: 2.50 mm/s</div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>AI Copilot Status</span>
            <span className="badge badge-ai">ACTIVE</span>
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-cyan)' }}>
            READY
          </div>
          <div className="metric-desc">4 Agents Standby for Action Plan</div>
        </div>
      </div>

      {/* Quick AI Action Prompt Bar */}
      <div className="card ai-card-highlight" style={{ marginTop: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>CrisisOps Copilot Shortcuts</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quick AI investigation prompts for shift operators</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" style={{ fontSize: '0.78rem', borderColor: 'rgba(6, 182, 212, 0.4)' }} onClick={() => onNavigateToIncident('INC-M204-001')}>
              ✨ Summarize M-204 Root Cause
            </button>
            <button className="btn btn-outline" style={{ fontSize: '0.78rem', borderColor: 'rgba(6, 182, 212, 0.4)' }} onClick={() => onNavigateToIncident('INC-M204-001')}>
              📖 Fetch Emergency SOP
            </button>
            <button className="btn btn-outline" style={{ fontSize: '0.78rem', borderColor: 'rgba(6, 182, 212, 0.4)' }} onClick={() => onNavigateToMachine('M-204')}>
              📈 Check Vibration Z-Score
            </button>
          </div>
        </div>
      </div>

      {/* Fleet Overview & Recent Incidents Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
        {/* Machine Status Table */}
        <div className="card">
          <div className="card-title">
            <span>Fleet Status Overview</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time Feed</span>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Machine ID</th>
                  <th>Name & Type</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((machine) => (
                  <tr key={machine.id}>
                    <td className="mono" style={{ fontWeight: 600, color: machine.id === 'M-204' ? 'var(--status-critical)' : 'inherit' }}>
                      {machine.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{machine.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{machine.type}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{machine.location}</td>
                    <td>
                      <span className={`badge badge-${machine.status.toLowerCase()}`}>
                        {machine.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => onNavigateToMachine(machine.id)}
                      >
                        Inspect Telemetry →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Incident List */}
        <div className="card">
          <div className="card-title">
            <span>Active Incidents</span>
            <span className="badge badge-critical">{incidents.length} Open</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {incidents.map((incident) => (
              <div
                key={incident.id}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.9rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease'
                }}
                onClick={() => onNavigateToIncident(incident.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>{incident.id}</span>
                  <span className={`badge badge-${incident.severity.toLowerCase()}`}>{incident.severity}</span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>
                  {incident.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Asset: {incident.machine_id}</span>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Investigate →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

