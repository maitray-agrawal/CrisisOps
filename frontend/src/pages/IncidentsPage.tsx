import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Incident, SOPDocument } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';

interface IncidentsPageProps {
  selectedIncidentId?: string | null;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({ selectedIncidentId }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [sop, setSop] = useState<SOPDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidentsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getIncidents();
      setIncidents(data);

      const targetId = selectedIncidentId || (data.length > 0 ? data[0].id : null);
      if (targetId) {
        const detail = await apiService.getIncidentDetail(targetId);
        setActiveIncident(detail);

        if (detail.action_recommendations && detail.action_recommendations.length > 0) {
          const actionSopId = detail.action_recommendations[0].sop_id;
          if (actionSopId) {
            try {
              const sopDetail = await apiService.getSOPDetail(actionSopId);
              setSop(sopDetail);
            } catch {
              // SOP optional fallback
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch incident details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentsData();
  }, [selectedIncidentId]);

  const selectIncident = async (id: string) => {
    setLoading(true);
    try {
      const detail = await apiService.getIncidentDetail(id);
      setActiveIncident(detail);
      setSop(null);
      if (detail.action_recommendations && detail.action_recommendations.length > 0) {
        const actionSopId = detail.action_recommendations[0].sop_id;
        if (actionSopId) {
          try {
            const sopDetail = await apiService.getSOPDetail(actionSopId);
            setSop(sopDetail);
          } catch {
            // silent
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !activeIncident) return <LoadingSpinner message="Loading active incidents..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchIncidentsData} />;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Incident Investigation & Response</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Correlated signals, telemetry anomalies, maintenance logs, and SOP action plans
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem' }}>
        {/* Left Side: Incident List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="card-title">All Incidents ({incidents.length})</div>
          {incidents.map((incident) => {
            const isSelected = activeIncident?.id === incident.id;
            return (
              <div
                key={incident.id}
                className="card"
                style={{
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--border-color)',
                  backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.05)' : 'var(--bg-card)',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => selectIncident(incident.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>{incident.id}</span>
                  <span className={`badge badge-${incident.severity.toLowerCase()}`}>{incident.severity}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem' }}>{incident.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Asset: <span className="mono">{incident.machine_id}</span> • Status: {incident.status}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Incident Deep-Dive Workspace */}
        {activeIncident ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header Details Card */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span className={`badge badge-${activeIncident.severity.toLowerCase()}`}>{activeIncident.severity}</span>
                    <span className="badge badge-normal" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.4)' }}>
                      STATUS: {activeIncident.status}
                    </span>
                    <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{activeIncident.id}</span>
                  </div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{activeIncident.title}</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Target Machine: <strong style={{ color: '#fff' }}>{activeIncident.machine_id}</strong> • Incident Opened: {new Date(activeIncident.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '6px', borderLeft: '3px solid var(--accent-cyan)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>INCIDENT SUMMARY</div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{activeIncident.summary}</p>
              </div>
            </div>

            {/* Evidence & Root Cause Analysis Grid */}
            <div className="card">
              <div className="card-title">
                <span>Correlated Evidence & Signals</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {activeIncident.evidence_items?.length || 0} Evidence Artifacts
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activeIncident.evidence_items?.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', background: 'rgba(59,130,246,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          {item.source_type}
                        </span>
                        <strong style={{ fontSize: '0.9rem' }}>{item.title}</strong>
                      </div>
                      <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--status-normal)', fontWeight: 600 }}>
                        {item.confidence_score.toFixed(1)}% Confidence
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Recommendations & Recommended SOP */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {/* Action Recommendations */}
              <div className="card">
                <div className="card-title">
                  <span>Recommended Action Plan</span>
                  <span className="badge badge-critical" style={{ fontSize: '0.7rem' }}>Human-In-The-Loop</span>
                </div>
                {activeIncident.action_recommendations?.map((act) => (
                  <div key={act.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.85rem', borderRadius: '6px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', marginBottom: '0.35rem' }}>
                        {act.action_title}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        {act.description}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--status-warning)' }}>
                          Status: {act.human_approved ? 'APPROVED' : 'AWAITING APPROVAL'}
                        </span>
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                          disabled={act.human_approved}
                        >
                          {act.human_approved ? 'Action Authorized' : 'Approve & Execute Plan'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Retrieved SOP */}
              <div className="card">
                <div className="card-title">
                  <span>Retrieved SOP Protocol</span>
                  {sop && <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{sop.sop_code}</span>}
                </div>
                {sop ? (
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>{sop.title}</h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      Target Component: <span className="mono">{sop.target_component}</span>
                    </div>
                    <pre style={{
                      background: 'rgba(0,0,0,0.4)',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      color: '#d1d5db',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '220px',
                      overflowY: 'auto'
                    }}>
                      {sop.content_markdown}
                    </pre>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>No SOP loaded for this incident.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
            <p style={{ color: 'var(--text-muted)' }}>Select an incident to view investigation data.</p>
          </div>
        )}
      </div>
    </div>
  );
};
