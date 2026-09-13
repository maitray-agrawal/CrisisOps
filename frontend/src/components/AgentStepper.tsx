import React from 'react';
import { InvestigationResult } from '../types';
import {
  CpuIcon,
  RefreshCwIcon,
  ZapIcon
} from './Icons';

interface AgentStepperProps {
  isInvestigating: boolean;
  investigationResult: InvestigationResult | null;
  onRunPipeline: () => void;
}

export const AgentStepper: React.FC<AgentStepperProps> = ({
  isInvestigating,
  investigationResult,
  onRunPipeline
}) => {
  const steps = [
    {
      id: 'signal',
      stepNumber: 1,
      title: 'Signal Correlator Agent',
      agentClass: 'SignalCorrelatorAgent',
      toolSelected: 'Telemetry Stream Inspector (10Hz Z-Score Engine)',
      toolCategory: 'Sensor Telemetry Ingestion',
      evidenceObtained: investigationResult?.signal_analysis?.signal_summary || 'Vibration variance +7.82 mm/s (Z = +3.83 standard deviations over nominal baseline).',
      confidence: investigationResult?.signal_analysis ? `${(100 - (investigationResult.signal_analysis.used_fallback ? 15 : 0))}%` : '96%',
      outcome: 'Multi-sensor anomaly signature detected in hydraulic drive axis.',
      adaptationEvent: investigationResult?.signal_analysis?.used_fallback ? 'Fallback heuristic applied for noisy sensor baseline' : 'Adaptive threshold calibrated to 4.5 mm/s limit',
      data: investigationResult?.signal_analysis,
      usedFallback: investigationResult?.signal_analysis?.used_fallback
    },
    {
      id: 'rca',
      stepNumber: 2,
      title: 'Root Cause Analysis Agent',
      agentClass: 'RootCauseAnalysisAgent',
      toolSelected: 'Maintenance History Correlator & Physics Model',
      toolCategory: 'Historical Log & Kinematic Attribution',
      evidenceObtained: investigationResult?.root_cause_analysis?.hypothesis || 'Bearing replacement work order correlated with mechanical drive vibration spikes.',
      confidence: `${investigationResult?.root_cause_analysis?.confidence_score?.toFixed(0) || 89}%`,
      outcome: 'High confidence attribution to bearing inner-race mechanical fatigue.',
      adaptationEvent: 'Cross-validated against historical maintenance logs (MR-204-01)',
      data: investigationResult?.root_cause_analysis,
      usedFallback: investigationResult?.root_cause_analysis?.used_fallback
    },
    {
      id: 'impact',
      stepNumber: 3,
      title: 'Impact Assessment Agent',
      agentClass: 'ImpactAssessmentAgent',
      toolSelected: 'Refinery Loss Model & Production Risk Calculator',
      toolCategory: 'Financial & Operational Risk Evaluation',
      evidenceObtained: investigationResult?.impact_assessment?.summary || 'Production loss modeled at $1,875/hr direct loss rate over 24.0h estimated downtime.',
      confidence: '94%',
      outcome: `$${investigationResult?.impact_assessment?.estimated_financial_loss_usd?.toLocaleString() || '45,000'} USD total financial exposure; 35% line capacity risk.`,
      adaptationEvent: 'Dynamic escalation to High-Severity queue due to financial threshold >$25k',
      data: investigationResult?.impact_assessment,
      usedFallback: investigationResult?.impact_assessment?.used_fallback
    },
    {
      id: 'sop',
      stepNumber: 4,
      title: 'SOP Response Engine',
      agentClass: 'SOPResponseAgent',
      toolSelected: 'Vector RAG SOP Search & Containment Synthesizer',
      toolCategory: 'SOP Knowledge Retrieval & Action Planning',
      evidenceObtained: investigationResult?.action_plan?.action_summary || 'Indexed SOP-M204-BEARING retrieved with matched auxiliary coolant flushing sequence.',
      confidence: '98%',
      outcome: 'Action plan synthesized: Auxiliary Coolant Flush & Hydraulic Drive Throttling.',
      adaptationEvent: 'Action bound to strict Human-in-the-Loop Operator Approval Gate',
      data: investigationResult?.action_plan,
      usedFallback: investigationResult?.action_plan?.used_fallback
    }
  ];

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ color: 'var(--accent-cyan)' }}><CpuIcon size={16} /></span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              EXPLAINABLE MULTI-AGENT EXECUTION PIPELINE
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Operational Goal:
            </span>
            <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>
              Mitigate M-204 bearing degradation & prevent emergency line trip
            </span>
          </div>
        </div>

        <button
          className="btn btn-primary"
          disabled={isInvestigating}
          onClick={onRunPipeline}
          style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
        >
          {isInvestigating ? (
            <>
              <RefreshCwIcon size={14} className="spin-slow" /> Running 4-Agent Chain...
            </>
          ) : (
            <>
              <ZapIcon size={14} /> Run 4-Stage AI Pipeline
            </>
          )}
        </button>
      </div>

      {/* Goal -> Observe -> Decide -> Tool Selection -> Action -> Evaluate -> Adapt -> Recommendation Flow */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
        {steps.map((step) => {
          let stepStatus: 'IDLE' | 'RUNNING' | 'COMPLETE' | 'FALLBACK' = 'IDLE';
          if (isInvestigating) {
            stepStatus = 'RUNNING';
          } else if (step.data) {
            stepStatus = step.usedFallback ? 'FALLBACK' : 'COMPLETE';
          }

          return (
            <div
              key={step.id}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: `1px solid ${
                  stepStatus === 'RUNNING'
                    ? 'var(--accent-cyan)'
                    : stepStatus === 'COMPLETE'
                    ? 'rgba(34, 197, 94, 0.4)'
                    : stepStatus === 'FALLBACK'
                    ? 'rgba(245, 158, 11, 0.4)'
                    : 'var(--border-color)'
                }`,
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                boxShadow: stepStatus === 'RUNNING' ? '0 0 12px rgba(6, 182, 212, 0.2)' : 'none'
              }}
            >
              <div>
                {/* Stage Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    STAGE 0{step.stepNumber}
                  </span>
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.65rem',
                      padding: '0.15rem 0.4rem',
                      background:
                        stepStatus === 'RUNNING'
                          ? 'rgba(6, 182, 212, 0.15)'
                          : stepStatus === 'COMPLETE'
                          ? 'rgba(34, 197, 94, 0.15)'
                          : stepStatus === 'FALLBACK'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(255,255,255,0.05)',
                      color:
                        stepStatus === 'RUNNING'
                          ? 'var(--accent-cyan)'
                          : stepStatus === 'COMPLETE'
                          ? '#4ade80'
                          : stepStatus === 'FALLBACK'
                          ? '#f59e0b'
                          : 'var(--text-muted)',
                      borderColor:
                        stepStatus === 'RUNNING'
                          ? 'rgba(6, 182, 212, 0.4)'
                          : stepStatus === 'COMPLETE'
                          ? 'rgba(34, 197, 94, 0.4)'
                          : stepStatus === 'FALLBACK'
                          ? 'rgba(245, 158, 11, 0.4)'
                          : 'var(--border-color)'
                    }}
                  >
                    {stepStatus === 'RUNNING' ? 'RUNNING' : stepStatus === 'COMPLETE' ? 'COMPLETE' : stepStatus === 'FALLBACK' ? 'FALLBACK' : 'IDLE'}
                  </span>
                </div>

                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', marginBottom: '0.15rem' }}>
                  {step.title}
                </div>

                {/* Tool Selected */}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                  Tool: <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{step.toolSelected}</span>
                </div>

                {/* Evidence & Outcome */}
                <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.65rem', marginBottom: '0.6rem' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.2rem' }}>
                    Evidence & Outcome
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-bright)', lineHeight: '1.4', margin: 0 }}>
                    {step.evidenceObtained}
                  </p>
                </div>

                {/* Evaluation & Adaptation */}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  <span style={{ color: 'var(--text-dim)', fontWeight: 600 }}>Adaptation:</span> {step.adaptationEvent}
                </div>
              </div>

              {/* Confidence Footer */}
              <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Confidence:</span>
                <span className="mono" style={{ color: 'var(--status-normal)', fontWeight: 700 }}>{step.confidence}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
