import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Incident, SOPDocument } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';
import { AuditLedgerViewer } from '../components/AuditLedgerViewer';
import { ExplainabilityMap } from '../components/ExplainabilityMap';
import { ReplayPlayer } from '../components/ReplayPlayer';

interface IncidentsPageProps {
  selectedIncidentId?: string | null;
}

export const IncidentsPage: React.FC<IncidentsPageProps> = ({ selectedIncidentId }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [sop, setSop] = useState<SOPDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [approvedActionIds, setApprovedActionIds] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'workspace' | 'audit' | 'explainability' | 'replay'>('workspace');

  const fetchIncidentsData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
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
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentsData(true);

    const interval = setInterval(() => {
      fetchIncidentsData(false);
    }, 3000);

    const handleSimUpdate = () => fetchIncidentsData(false);
    window.addEventListener('simulation-updated', handleSimUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('simulation-updated', handleSimUpdate);
    };
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

  const [investigating, setInvestigating] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);

  const handleRunInvestigation = async (id: string) => {
    setInvestigating(true);
    setError(null);
    try {
      await apiService.triggerInvestigation(id);
      await fetchIncidentsData(false);
    } catch (err: any) {
      setError(err.message || 'Investigation pipeline failed.');
    } finally {
      setInvestigating(false);
    }
  };

  const handleApproveAction = async (actionId: string, incidentId: string) => {
    try {
      await apiService.approvePlan(incidentId, 'Lead Industrial Operator');
      setApprovedActionIds(prev => ({ ...prev, [actionId]: true }));
      await fetchIncidentsData(false);
    } catch (err: any) {
      setError(err.message || 'Approval failed.');
    }
  };

  const handleExecuteActuation = async (incidentId: string) => {
    setExecuting(true);
    setError(null);
    try {
      await apiService.executeActuation(incidentId);
      window.dispatchEvent(new Event('simulation-updated'));
      await fetchIncidentsData(false);
    } catch (err: any) {
      setError(err.message || 'Actuation execution failed.');
    } finally {
      setExecuting(false);
    }
  };

  if (loading && !activeIncident) return <LoadingSpinner message="Correlating telemetry signals & AI agent reasoning chain..." />;
  if (error) return <ErrorAlert message={error} onRetry={() => fetchIncidentsData(true)} />;

  return (
    <div className="page-container">
      {/* Workspace Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Incident Investigation & Root Cause Workspace</h1>
          <p className="page-subtitle">Multi-Agent AI Telemetry Correlation, Root Cause Hypothesis & Action Plan Verification</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {activeIncident && (
            <button
              className="btn btn-primary"
              disabled={investigating}
              onClick={() => handleRunInvestigation(activeIncident.id)}
              style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {investigating ? '🤖 Running Agents...' : '⚡ Run 4-Stage AI Pipeline'}
            </button>
          )}
          <button className="btn btn-outline" onClick={() => fetchIncidentsData(true)} style={{ fontSize: '0.8rem' }}>
            🔄 Refresh Agent Stream
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem' }}>
        {/* Left Side: Incident List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="card-header-label">Open Incidents ({incidents.length})</div>
          {incidents.map((incident) => {
            const isSelected = activeIncident?.id === incident.id;
            return (
              <div
                key={incident.id}
                className={`card ${isSelected ? 'ai-card-highlight' : ''}`}
                style={{
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--border-color)',
                  backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.05)' : 'var(--bg-surface)'
                }}
                onClick={() => selectIncident(incident.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>{incident.id}</span>
                  <span className={`badge badge-${incident.severity.toLowerCase()}`}>{incident.severity}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem', color: '#fff' }}>{incident.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Asset: <span className="mono">{incident.machine_id}</span> • Status: <strong style={{ color: incident.status === 'CONTAINED' ? 'var(--status-normal)' : 'var(--status-warning)' }}>{incident.status}</strong>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Incident Deep-Dive Workspace */}
        {activeIncident ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Sub-Navigation Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <button
                onClick={() => setActiveTab('workspace')}
                className={`btn ${activeTab === 'workspace' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.78rem' }}
              >
                🔬 Investigation Workspace
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.78rem' }}
              >
                🛡️ Decision Ledger (SHA-256)
              </button>
              <button
                onClick={() => setActiveTab('explainability')}
                className={`btn ${activeTab === 'explainability' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.78rem' }}
              >
                🧠 AI Explainability Map
              </button>
              <button
                onClick={() => setActiveTab('replay')}
                className={`btn ${activeTab === 'replay' ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.78rem' }}
              >
                ⏪ Time-Travel Replay
              </button>
            </div>

            {activeTab === 'audit' && <AuditLedgerViewer incidentId={activeIncident.id} />}
            {activeTab === 'explainability' && <ExplainabilityMap incidentId={activeIncident.id} />}
            {activeTab === 'replay' && <ReplayPlayer incidentId={activeIncident.id} />}

            {activeTab === 'workspace' && (
              <>
                {/* Pipeline Stage Status Bar */}
                <div className="card" style={{ padding: '0.9rem 1.25rem' }}>
                  <div className="pipeline-header">
                    <div className="pipeline-stage active">
                      <div className="stage-step">1</div>
                      <span>Signal Detection</span>
                    </div>
                    <div className="pipeline-stage active">
                      <div className="stage-step">2</div>
                      <span>Root Cause AI</span>
                    </div>
                    <div className="pipeline-stage active">
                      <div className="stage-step">3</div>
                      <span>Impact Analysis</span>
                    </div>
                    <div className="pipeline-stage active">
                      <div className="stage-step">4</div>
                      <span>SOP RAG Retrieval</span>
                    </div>
                    <div className={`pipeline-stage ${activeIncident.status === 'CONTAINED' ? 'active' : 'pending'}`}>
                      <div className="stage-step">5</div>
                      <span>Containment Executed</span>
                    </div>
                  </div>
                </div>

            {/* Header Details Card */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span className={`badge badge-${activeIncident.severity.toLowerCase()}`}>{activeIncident.severity}</span>
                    <span className="badge badge-normal" style={{ background: activeIncident.status === 'CONTAINED' ? 'rgba(34,197,94,0.15)' : 'rgba(59, 130, 246, 0.15)', color: activeIncident.status === 'CONTAINED' ? '#4ade80' : '#60a5fa', borderColor: activeIncident.status === 'CONTAINED' ? 'rgba(34,197,94,0.4)' : 'rgba(59, 130, 246, 0.4)' }}>
                      STATUS: {activeIncident.status}
                    </span>
                    <span className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{activeIncident.id}</span>
                  </div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff' }}>{activeIncident.title}</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Target Machine: <strong style={{ color: '#fff' }}>{activeIncident.machine_id}</strong> • Opened: {new Date(activeIncident.created_at).toLocaleString()}
                  </p>
                </div>
                {activeIncident.status === 'APPROVED' && (
                  <button
                    className="btn btn-primary"
                    disabled={executing}
                    onClick={() => handleExecuteActuation(activeIncident.id)}
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderColor: '#10b981', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}
                  >
                    {executing ? 'Executing Actuation...' : '⚡ Execute Containment Action'}
                  </button>
                )}
              </div>

              <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-cyan)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  🤖 MULTI-AGENT SYNTHESIZED INCIDENT SUMMARY
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-bright)', lineHeight: '1.5', margin: 0 }}>{activeIncident.summary || 'Click "Run 4-Stage AI Pipeline" to trigger complete agent correlation.'}</p>
              </div>
            </div>

            {/* Estimated Business Impact Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Est. Production Downtime</div>
                <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--status-warning)', marginTop: '0.25rem' }}>24.0 Hours</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>35% Plant Capacity Loss</div>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Est. Financial Risk</div>
                <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--status-critical)', marginTop: '0.25rem' }}>$45,000 USD</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Direct & Overhead Impact</div>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Safety Risk Rating</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span className="badge badge-critical" style={{ fontSize: '1.1rem', padding: '0.2rem 0.75rem' }}>HIGH RISK</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Thermal Isolation Required</div>
              </div>
            </div>

            {/* Evidence & Root Cause Analysis Grid */}
            <div className="card">
              <div className="card-title">
                <span>Correlated Telemetry & Maintenance Evidence</span>
                <span className="badge badge-normal" style={{ fontSize: '0.72rem' }}>
                  {activeIncident.evidence_items?.length || 0} Correlated Artifacts
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {activeIncident.evidence_items?.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.9rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                          {item.source_type}
                        </span>
                        <strong style={{ fontSize: '0.92rem', color: '#fff' }}>{item.title}</strong>
                      </div>
                      <span className="mono" style={{ fontSize: '0.8rem', color: 'var(--status-normal)', fontWeight: 600 }}>
                        {item.confidence_score.toFixed(1)}% Confidence
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{item.description}</p>
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
                  <span className="badge badge-critical" style={{ fontSize: '0.7rem' }}>HUMAN-IN-THE-LOOP GATE</span>
                </div>
                {activeIncident.action_recommendations?.map((act) => {
                  const isApproved = approvedActionIds[act.id] || act.human_approved || activeIncident.status === 'APPROVED' || activeIncident.status === 'CONTAINED';
                  return (
                    <div key={act.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ background: isApproved ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)', border: `1px solid ${isApproved ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff', marginBottom: '0.35rem' }}>
                          {act.action_title}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.85rem', lineHeight: '1.4' }}>
                          {act.description}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isApproved ? 'var(--status-normal)' : 'var(--status-warning)' }}>
                            Status: {isApproved ? '✅ HUMAN APPROVED' : '⏳ AWAITING OPERATOR APPROVAL'}
                          </span>
                          <button
                            className={`btn ${isApproved ? 'btn-outline' : 'btn-primary'}`}
                            style={{ fontSize: '0.78rem', padding: '0.38rem 0.85rem' }}
                            disabled={isApproved}
                            onClick={() => handleApproveAction(act.id, activeIncident.id)}
                          >
                            {isApproved ? 'Authorized ✓' : 'Approve Plan'}
                          </button>
                        </div>
                      </div>

                      {isApproved && activeIncident.status !== 'CONTAINED' && (
                        <button
                          className="btn btn-primary"
                          disabled={executing}
                          onClick={() => handleExecuteActuation(activeIncident.id)}
                          style={{
                            marginTop: '0.5rem',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            borderColor: '#10b981',
                            boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                          }}
                        >
                          {executing ? 'Executing Actuation...' : '⚡ Execute Containment Action'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Retrieved SOP */}
              <div className="card">
                <div className="card-title">
                  <span>Matched SOP Protocol (RAG Engine)</span>
                  {sop && <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{sop.sop_code}</span>}
                </div>
                {sop ? (
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem', color: '#fff' }}>{sop.title}</h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      Target Component: <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{sop.target_component}</span>
                    </div>
                    <pre style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.78rem',
                      color: 'var(--text-bright)',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {sop.content_markdown}
                    </pre>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No matching SOP protocol currently loaded.</p>
                )}
              </div>
            </div>
            </>
            )}
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

