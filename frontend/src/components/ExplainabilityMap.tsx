import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { ExplainabilityReport } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';

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
    <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-amber-400">🧠</span> AI Root Cause Explainability Map
          </h3>
          <p className="text-xs text-slate-400">
            Surfacing feature attribution weights, RAG SOP citations, and multi-agent reasoning evidence.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg">
          <span className="text-xs text-slate-400">Confidence Score:</span>
          <span className="text-sm font-extrabold text-emerald-400">{report.confidence_score}%</span>
        </div>
      </div>

      {/* Hypothesis & Reasoning Summary */}
      <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
        <div className="text-xs uppercase font-bold text-cyan-400 tracking-wider">Primary RCA Hypothesis</div>
        <p className="text-sm text-slate-200 font-semibold">{report.hypothesis}</p>
        <div className="text-xs text-slate-400 leading-relaxed pt-1">
          {report.reasoning_summary}
        </div>
      </div>

      {/* Feature Attribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Telemetry Anomalies */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <span>📈</span> Telemetry Anomaly Evidence
          </h4>
          <div className="space-y-2">
            {report.telemetry_features.map((feat, idx) => (
              <div key={idx} className="p-2.5 bg-slate-900 border border-slate-800 rounded text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>{feat.title}</span>
                  <span className="text-rose-400 font-mono">Weight: {(feat.confidence * 100).toFixed(0)}%</span>
                </div>
                <p className="text-slate-400">{feat.description}</p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-rose-500 h-full rounded-full"
                    style={{ width: `${feat.confidence * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance Correlation */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <span>🔧</span> Maintenance Log Attribution
          </h4>
          <div className="space-y-2">
            {report.correlated_maintenance.map((maint, idx) => (
              <div key={idx} className="p-2.5 bg-slate-900 border border-slate-800 rounded text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-300">
                  <span>{maint.title}</span>
                  <span className="text-amber-400 font-mono">Weight: {(maint.confidence * 100).toFixed(0)}%</span>
                </div>
                <p className="text-slate-400">{maint.description}</p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${maint.confidence * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cited SOP Citation Block */}
      {report.cited_sop && (
        <div className="p-4 bg-gradient-to-r from-cyan-950/30 to-teal-950/30 border border-cyan-500/30 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold text-cyan-400 flex items-center gap-1.5">
              <span>📚</span> Grounded SOP Citation ({report.cited_sop.code})
            </span>
            <span className="text-xs text-slate-400">Component: {report.cited_sop.target_component}</span>
          </div>
          <div className="text-sm font-bold text-white">{report.cited_sop.title}</div>
          <p className="text-xs text-slate-300 italic border-l-2 border-cyan-400 pl-3 py-1">
            "{report.cited_sop.snippet}"
          </p>
        </div>
      )}
    </div>
  );
};
