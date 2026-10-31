import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { ExplainabilityReport } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';
import { Brain, TrendingUp, Wrench, BookOpen } from 'lucide-react';

interface ExplainabilityMapProps {
  incidentId: string;
}

export const ExplainabilityMap: React.FC<ExplainabilityMapProps> = ({ incidentId }) => {
  const [report, setReport] = useState<ExplainabilityReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExplainability = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getExplainabilityReport(incidentId);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load explainability breakdown');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (incidentId) {
      fetchExplainability();
    }
  }, [incidentId]);

  if (loading) return <LoadingSpinner message="Generating AI Explainability Matrix..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchExplainability} />;
  if (!report) return null;

  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Brain size={20} style={{ color: 'var(--accent-cyan)' }} />
            AI Root Cause Explainability Map
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Surfacing feature attribution weights, RAG SOP citations, and multi-agent reasoning evidence.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', padding: '0.35rem 0.75rem', borderRadius: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence Score:</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--status-normal)' }}>{report.confidence_score}%</span>
        </div>
      </div>

      {/* Hypothesis & Reasoning Summary */}
      <div style={{ padding: '1rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
          PRIMARY RCA HYPOTHESIS
        </div>
        <p style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600, margin: '0 0 0.4rem 0' }}>{report.hypothesis}</p>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          {report.reasoning_summary}
        </div>
      </div>

      {/* Feature Attribution Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {/* Telemetry Anomalies */}
        <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--status-critical)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <TrendingUp size={14} />
            <span>Telemetry Anomaly Evidence</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {report.telemetry_features.map((feat, idx) => (
              <div key={idx} style={{ padding: '0.65rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.8rem', color: '#fff', marginBottom: '0.2rem' }}>
                  <span>{feat.title}</span>
                  <span className="mono" style={{ color: 'var(--status-critical)' }}>Weight: {(feat.confidence * 100).toFixed(0)}%</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.4rem 0' }}>{feat.description}</p>
                <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{ background: 'var(--status-critical)', height: '100%', borderRadius: '2px', width: `${feat.confidence * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance Correlation */}
        <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--status-warning)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Wrench size={14} />
            <span>Maintenance Log Attribution</span>
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {report.correlated_maintenance.map((maint, idx) => (
              <div key={idx} style={{ padding: '0.65rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.8rem', color: '#fff', marginBottom: '0.2rem' }}>
                  <span>{maint.title}</span>
                  <span className="mono" style={{ color: 'var(--status-warning)' }}>Weight: {(maint.confidence * 100).toFixed(0)}%</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.4rem 0' }}>{maint.description}</p>
                <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{ background: 'var(--status-warning)', height: '100%', borderRadius: '2px', width: `${maint.confidence * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cited SOP Citation Block */}
      {report.cited_sop && (
        <div style={{ padding: '1rem', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BookOpen size={14} />
              <span>Grounded SOP Citation ({report.cited_sop.code})</span>
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Component: {report.cited_sop.target_component}</span>
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>{report.cited_sop.title}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-bright)', fontStyle: 'italic', borderLeft: '2px solid var(--accent-cyan)', paddingLeft: '0.75rem', margin: 0 }}>
            "{report.cited_sop.snippet}"
          </p>
        </div>
      )}
    </div>
  );
};

export default ExplainabilityMap;
