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

  if (loading) return <LoadingSpinner message="Fetching live telemetry and incidents..." />;
  if (error) return <ErrorAlert message={error} onRetry={loadDashboardData} />;

  const criticalIncidents = incidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');
  const criticalMachineCount = machines.filter(m => m.status === 'CRITICAL' || m.status === 'WARNING').length;
  const latestM204Vibration = m204Telemetry.length > 0 ? m204Telemetry[0].vibration_mm_s : 0;

  return (
    <div>
      {/* Critical Alert Banner */}
      {criticalIncidents.length > 0 && (
        <div className="alert-banner">
          <div className="alert-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span className="badge badge-critical">CRITICAL INCIDENT DETECTED</span>
              <span className="mono" style={{ color: '#ef4444', fontSize: '0.85rem' }}>{criticalIncidents[0].id}</span>
            </div>
            <h3>{criticalIncidents[0].title}</h3>
            <p>{criticalIncidents[0].summary}</p>
          </div>
          <div>
            <button
              className="btn btn-primary"
              onClick={() => onNavigateToIncident(criticalIncidents[0].id)}
            >
              Investigate Incident
            </button>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-title">
            <span>Total Assets</span>
            <span style={{ color: 'var(--accent-cyan)' }}>Active</span>
          </div>
          <div className="metric-value">{machines.length}</div>
          <div className="metric-desc">Monitored Industrial Machines</div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Anomalous Assets</span>
            <span style={{ color: criticalMachineCount > 0 ? 'var(--status-critical)' : 'var(--status-normal)' }}>
              {criticalMachineCount > 0 ? 'Action Required' : 'Nominal'}
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
            <span style={{ color: 'var(--status-critical)' }}>Threshold Exceeded</span>
          </div>
          <div className="metric-value" style={{ color: 'var(--status-critical)' }}>
            {latestM204Vibration.toFixed(2)} <span style={{ fontSize: '1rem' }}>mm/s</span>
          </div>
          <div className="metric-desc">Baseline limit: 2.50 mm/s</div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Active Incidents</span>
            <span style={{ color: 'var(--status-warning)' }}>Investigation Open</span>
          </div>
          <div className="metric-value">{incidents.length}</div>
          <div className="metric-desc">Pending human operator action</div>
        </div>
      </div>

      {/* Machine Telemetry Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginTop: '1rem' }}>
        {/* Machine Status Table */}
        <div className="card">
          <div className="card-title">
            <span>Asset Telemetry Overview</span>
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
                    <td className="mono" style={{ fontWeight: 600 }}>{machine.id}</td>
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
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Incidents Panel */}
        <div className="card">
          <div className="card-title">
            <span>Recent Incidents</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {incidents.map((incident) => (
              <div
                key={incident.id}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '0.85rem',
                  cursor: 'pointer'
                }}
                onClick={() => onNavigateToIncident(incident.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>{incident.id}</span>
                  <span className={`badge badge-${incident.severity.toLowerCase()}`}>{incident.severity}</span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>
                  {incident.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Asset: {incident.machine_id} • Status: {incident.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
