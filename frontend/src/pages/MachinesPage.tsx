import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Machine, MachineDetail } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';

interface MachinesPageProps {
  selectedMachineId?: string | null;
}

export const MachinesPage: React.FC<MachinesPageProps> = ({ selectedMachineId }) => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [activeMachine, setActiveMachine] = useState<MachineDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMachines = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getMachines();
      setMachines(data);
      const targetId = selectedMachineId || (data.length > 0 ? data[0].id : null);
      if (targetId) {
        const detail = await apiService.getMachineDetail(targetId);
        setActiveMachine(detail);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch machines telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, [selectedMachineId]);

  const selectMachine = async (id: string) => {
    setLoading(true);
    try {
      const detail = await apiService.getMachineDetail(id);
      setActiveMachine(detail);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !activeMachine) return <LoadingSpinner message="Polling sensor registers & stream history..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchMachines} />;

  return (
    <div className="page-container">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Machine Asset Telemetry & Maintenance Inspector</h1>
          <p className="page-subtitle">High-Frequency Telemetry Stream, Statistical Z-Scores & Maintenance Record Timeline</p>
        </div>
        <div>
          <button className="btn btn-outline" onClick={fetchMachines} style={{ fontSize: '0.8rem' }}>
            🔄 Refresh Sensor Data
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.25rem' }}>
        {/* Left Side: Asset Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="card-header-label">Fleet Monitored Assets ({machines.length})</div>
          {machines.map((machine) => {
            const isSelected = activeMachine?.id === machine.id;
            return (
              <div
                key={machine.id}
                className={`card ${isSelected ? 'ai-card-highlight' : ''}`}
                style={{
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--border-color)',
                  backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.05)' : 'var(--bg-surface)'
                }}
                onClick={() => selectMachine(machine.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{machine.id}</span>
                  <span className={`badge badge-${machine.status.toLowerCase()}`}>{machine.status}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{machine.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Location: {machine.location}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Machine Telemetry & Maintenance View */}
        {activeMachine ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Machine Header */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="mono" style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>{activeMachine.id}</span>
                    <span className={`badge badge-${activeMachine.status.toLowerCase()}`}>{activeMachine.status}</span>
                  </div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff' }}>{activeMachine.name}</h2>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <div>Type: <strong style={{ color: '#fff' }}>{activeMachine.type}</strong></div>
                  <div>Location: <strong style={{ color: '#fff' }}>{activeMachine.location}</strong></div>
                </div>
              </div>
              {activeMachine.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', margin: 0 }}>
                  {activeMachine.description}
                </p>
              )}
            </div>

            {/* Live Telemetry Stream */}
            <div className="card">
              <div className="card-title">
                <span>Recent Telemetry Registers</span>
                <span className="badge badge-normal" style={{ fontSize: '0.72rem' }}>
                  {activeMachine.recent_telemetry.length} Records Loaded
                </span>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Vibration (mm/s)</th>
                      <th>Temperature (°C)</th>
                      <th>Output Rate</th>
                      <th>Anomaly Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeMachine.recent_telemetry.map((t) => (
                      <tr key={t.id} style={{ background: t.is_anomaly ? 'rgba(239, 68, 68, 0.08)' : 'transparent' }}>
                        <td className="mono" style={{ fontSize: '0.8rem' }}>
                          {new Date(t.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="mono" style={{ fontWeight: 600, color: t.vibration_mm_s > 4.0 ? 'var(--status-critical)' : 'inherit' }}>
                          {t.vibration_mm_s.toFixed(2)} mm/s
                        </td>
                        <td className="mono" style={{ color: t.temp_celsius > 80.0 ? 'var(--status-warning)' : 'inherit' }}>
                          {t.temp_celsius.toFixed(1)} °C
                        </td>
                        <td className="mono">{t.output_units_min.toFixed(1)} units/min</td>
                        <td>
                          {t.is_anomaly ? (
                            <span className="badge badge-critical" style={{ fontSize: '0.68rem' }}>⚠️ ANOMALY DETECTED</span>
                          ) : (
                            <span className="badge badge-normal" style={{ fontSize: '0.68rem' }}>NOMINAL</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Maintenance History */}
            <div className="card">
              <div className="card-title">
                <span>Historical Maintenance Logs</span>
                <span className="badge badge-normal" style={{ fontSize: '0.72rem' }}>
                  {activeMachine.maintenance_records.length} History Logs
                </span>
              </div>
              {activeMachine.maintenance_records.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {activeMachine.maintenance_records.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.9rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>{m.id}</span>
                          <strong style={{ fontSize: '0.92rem', color: '#fff' }}>{m.component}</strong>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Technician: <strong style={{ color: '#fff' }}>{m.technician}</strong> • {new Date(m.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--accent-blue)', fontWeight: 600, marginBottom: '0.25rem' }}>
                        Action: {m.action_taken}
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>{m.notes}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No maintenance records found for this asset.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
            <p style={{ color: 'var(--text-muted)' }}>Select an asset to view telemetry details.</p>
          </div>
        )}
      </div>
    </div>
  );
};

