import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { ExplainabilityReport } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';
import {
  BrainIcon,
  TrendingUpIcon,
  WrenchIcon,
  BookOpenIcon
} from './Icons';

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
    <div className="card" style={{ padding: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ color: 'var(--accent-cyan)' }}><BrainIcon size={18} /></span>
            AI Root Cause Explainability Map
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Surfacing feature attribution weights, RAG SOP citations, and multi-agent reasoning evidence.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence Score:</span>
          <span className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--status-normal)' }}>{report.confidence_score}%</span>
        </div>
      </div>

      {/* Hypothesis & Reasoning Summary */}
      <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
          Primary RCA Hypothesis
        </div>
        <div style={{ fontSize: '0.92rem', color: '#fff', fontWeight: 600, marginBottom: '0.4rem' }}>
          {report.hypothesis}
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
          {report.reasoning_summary}
        </p>
      </div>

      {/* Feature Attribution Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        {/* Telemetry Anomalies */}
        <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <TrendingUpIcon size={14} color="#f87171" /> Telemetry Anomaly Evidence
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {report.telemetry_features.map((feat, idx) => (
              <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', padding: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{feat.title}</span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>Weight: {(feat.confidence * 100).toFixed(0)}%</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.4rem 0' }}>{feat.description}</p>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${feat.confidence * 100}%`, height: '100%', background: '#ef4444', borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance Correlation */}
        <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <WrenchIcon size={14} color="#fbbf24" /> Maintenance Log Attribution
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {report.correlated_maintenance.map((maint, idx) => (
              <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', padding: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{maint.title}</span>
                  <span className="mono" style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600 }}>Weight: {(maint.confidence * 100).toFixed(0)}%</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.4rem 0' }}>{maint.description}</p>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${maint.confidence * 100}%`, height: '100%', background: '#f59e0b', borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cited SOP Citation Block */}
      {report.cited_sop && (
        <div style={{ padding: '1rem', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BookOpenIcon size={14} /> Grounded SOP Citation ({report.cited_sop.code})
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Component: {report.cited_sop.target_component}</span>
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>{report.cited_sop.title}</div>
          <p style={{ fontSize: '0.82rem', color: '#cbd5e1', fontStyle: 'italic', borderLeft: '2px solid var(--accent-cyan)', paddingLeft: '0.75rem', margin: 0 }}>
            "{report.cited_sop.snippet}"
          </p>
        </div>
      )}
    </div>
  );
};
