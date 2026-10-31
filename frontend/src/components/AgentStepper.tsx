import React from 'react';
import { InvestigationResult } from '../types';

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
      grounding: 'Multi-Sensor Telemetry Stream',
      data: investigationResult?.signal_analysis,
      summary: investigationResult?.signal_analysis?.signal_summary || 'Analyzes sensor vibration, temperature & throughput metrics for anomalous variance.',
      usedFallback: investigationResult?.signal_analysis?.used_fallback
    },
    {
      id: 'rca',
      stepNumber: 2,
      title: 'Root Cause Analysis Agent',
      agentClass: 'RootCauseAnalysisAgent',
      grounding: 'Historical Maintenance Logs & Physics Models',
      data: investigationResult?.root_cause_analysis,
      summary: investigationResult?.root_cause_analysis?.hypothesis || 'Correlates anomaly signature with bearing degradation maintenance history.',
      usedFallback: investigationResult?.root_cause_analysis?.used_fallback
    },
    {
      id: 'impact',
      stepNumber: 3,
      title: 'Impact Assessment Agent',
      agentClass: 'ImpactAssessmentAgent',
      grounding: 'Refinery Loss Model ($1,875/hr)',
      data: investigationResult?.impact_assessment,
      summary: investigationResult?.impact_assessment?.summary || 'Quantifies financial risk, downtime hours, and unit capacity reduction.',
      usedFallback: investigationResult?.impact_assessment?.used_fallback
    },
    {
      id: 'sop',
      stepNumber: 4,
      title: 'SOP Response Engine',
      agentClass: 'SOPResponseAgent',
      grounding: investigationResult?.action_plan?.sop_code ? `SOP Markdown Index (${investigationResult.action_plan.sop_code})` : 'SOP Vector Grounding',
      data: investigationResult?.action_plan,
      summary: investigationResult?.action_plan?.action_summary || 'Retrieves verified SOP containment protocol & constructs action plan.',
      usedFallback: investigationResult?.action_plan?.used_fallback
    }
  ];

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🤖 EXPLAINABLE MULTI-AGENT EXECUTION PIPELINE
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Sequential 4-Stage AI Pipeline: Telemetry Correlation $\rightarrow$ Root Cause $\rightarrow$ Impact $\rightarrow$ Grounded SOP RAG
          </p>
        </div>
        <button
          className="btn btn-primary"
          disabled={isInvestigating}
          onClick={onRunPipeline}
          style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          {isInvestigating ? '⚡ Running 4-Agent Chain...' : '⚡ Trigger AI Pipeline'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem' }}>
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
                boxShadow: stepStatus === 'RUNNING' ? '0 0 12px rgba(6, 182, 212, 0.25)' : 'none'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
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
                    {stepStatus === 'RUNNING' ? '⚡ RUNNING' : stepStatus === 'COMPLETE' ? '✓ COMPLETE' : stepStatus === 'FALLBACK' ? '⚠️ FALLBACK' : 'IDLE'}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '0.2rem' }}>
                  {step.title}
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {step.agentClass}
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-bright)', lineHeight: '1.45', margin: 0, minHeight: '40px' }}>
                  {step.summary}
                </p>
              </div>

              <div style={{ marginTop: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Grounding: <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{step.grounding}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
