import React from 'react';
import { InvestigationResult } from '../types';
import {
  CpuIcon,
  RefreshCwIcon,
  ZapIcon,
  TargetIcon,
  CheckCircleIcon,
  CheckIcon,
  XIcon
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
  const traces = investigationResult?.agent_runtime_trace;
  const verification = investigationResult?.verification_results;
  const goal = investigationResult?.goal || 'Resolve M-204 degradation and return the machine to a safe operating state.';

  // Fallback static capabilities if runtime trace has not yet run
  const fallbackSteps = [
    {
      id: 'signal',
      stepNumber: 1,
      title: 'Signal Correlation',
      toolSelected: 'get_recent_telemetry',
      toolCategory: 'Observation',
      evidenceObtained: investigationResult?.signal_analysis?.signal_summary || 'Vibration variance +7.82 mm/s (Z = +3.83 standard deviations over nominal baseline).',
      confidence: investigationResult?.signal_analysis ? `${(100 - (investigationResult.signal_analysis.used_fallback ? 15 : 0))}%` : '96%',
      status: 'SUCCESS' as const,
      adaptationEvent: 'Adaptive threshold calibrated to 4.5 mm/s limit'
    },
    {
      id: 'rca',
      stepNumber: 2,
      title: 'Root Cause Analysis',
      toolSelected: 'get_maintenance_history',
      toolCategory: 'Investigation',
      evidenceObtained: investigationResult?.root_cause_analysis?.hypothesis || 'Bearing replacement work order correlated with mechanical drive vibration spikes.',
      confidence: `${investigationResult?.root_cause_analysis?.confidence_score?.toFixed(0) || 89}%`,
      status: 'SUCCESS' as const,
      adaptationEvent: 'Cross-validated against historical maintenance logs (MR-204-01)'
    },
    {
      id: 'impact',
      stepNumber: 3,
      title: 'Impact Assessment',
      toolSelected: 'calculate_business_impact',
      toolCategory: 'Evaluation',
      evidenceObtained: investigationResult?.impact_assessment?.summary || 'Production loss modeled at $1,875/hr direct loss rate over 24.0h estimated downtime.',
      confidence: '94%',
      status: 'SUCCESS' as const,
      adaptationEvent: 'Dynamic escalation to High-Severity queue'
    },
    {
      id: 'sop',
      stepNumber: 4,
      title: 'SOP Response Engine',
      toolSelected: 'retrieve_relevant_sop',
      toolCategory: 'Action Formulation',
      evidenceObtained: investigationResult?.action_plan?.action_summary || 'Indexed SOP-M204-BEARING retrieved with matched auxiliary coolant flushing sequence.',
      confidence: '98%',
      status: 'SUCCESS' as const,
      adaptationEvent: 'Action bound to strict Human-in-the-Loop Operator Approval Gate'
    }
  ];

  return (
    <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
      {/* Header with Goal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ color: 'var(--accent-cyan)' }}><CpuIcon size={16} /></span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              AGENT RUNTIME EXECUTION TRACE
            </span>
            <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
              DYNAMIC RUNTIME
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'rgba(0,0,0,0.25)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--accent-cyan)', marginTop: '2px' }}><TargetIcon size={14} /></span>
            <div>
              <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                Operational Goal:
              </span>
              <span style={{ fontSize: '0.84rem', color: '#fff', fontWeight: 600 }}>
                {goal}
              </span>
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary"
          disabled={isInvestigating}
          onClick={onRunPipeline}
          style={{ fontSize: '0.8rem', padding: '0.45rem 0.95rem', display: 'flex', alignItems: 'center', gap: '0.45rem', alignSelf: 'center' }}
        >
          {isInvestigating ? (
            <>
              <RefreshCwIcon size={14} className="spin-slow" /> Executing Agent Loop...
            </>
          ) : (
            <>
              <ZapIcon size={14} /> Run Autonomous Agent Loop
            </>
          )}
        </button>
      </div>

      {/* Iteration Trace Flow */}
      {traces && traces.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
          {traces.map((trace) => {
            const isFailed = trace.status === 'FAILED';
            const isAdapted = trace.status === 'ADAPTED';

            const borderColor = isFailed
              ? 'rgba(239, 68, 68, 0.5)'
              : isAdapted
              ? 'rgba(6, 182, 212, 0.5)'
              : 'rgba(34, 197, 94, 0.35)';

            const badgeBg = isFailed
              ? 'rgba(239, 68, 68, 0.15)'
              : isAdapted
              ? 'rgba(6, 182, 212, 0.15)'
              : 'rgba(34, 197, 94, 0.15)';

            const badgeColor = isFailed
              ? '#ef4444'
              : isAdapted
              ? 'var(--accent-cyan)'
              : '#4ade80';

            return (
              <div
                key={trace.iteration}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: `1px solid ${borderColor}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Iteration Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                      ITERATION 0{trace.iteration}
                    </span>
                    <span
                      className="badge"
                      style={{
                        fontSize: '0.65rem',
                        padding: '0.15rem 0.4rem',
                        background: badgeBg,
                        color: badgeColor,
                        borderColor
                      }}
                    >
                      {trace.status}
                    </span>
                  </div>

                  {/* Tool Name & Category */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <div className="mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                      {trace.tool_name}
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      {trace.tool_category}
                    </span>
                  </div>

                  {/* Decision Rationale */}
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                    <strong style={{ color: 'var(--text-bright)' }}>Decision:</strong> {trace.decision_rationale}
                  </div>

                  {/* Result Summary */}
                  <div style={{
                    background: isFailed ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0,0,0,0.25)',
                    border: `1px solid ${isFailed ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem 0.65rem',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: isFailed ? '#ef4444' : 'var(--text-dim)', fontWeight: 700, marginBottom: '0.2rem' }}>
                      {isFailed ? 'Execution Failure' : 'Result & Observation'}
                    </div>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-bright)', lineHeight: '1.4', margin: 0 }}>
                      {trace.result_summary}
                    </p>
                  </div>

                  {/* Adaptation Note if present */}
                  {trace.adaptation_note && (
                    <div style={{
                      background: 'rgba(6, 182, 212, 0.08)',
                      borderLeft: '3px solid var(--accent-cyan)',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                      fontSize: '0.72rem',
                      color: 'var(--text-bright)',
                      marginBottom: '0.4rem'
                    }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Adaptation Triggered:
                      </div>
                      {trace.adaptation_note}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div style={{ marginTop: '0.5rem', paddingTop: '0.45rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Policy Gate:</span>
                  <span className="mono" style={{ color: 'var(--status-normal)', fontWeight: 600 }}>
                    AUTONOMOUS
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
          {fallbackSteps.map((step) => (
            <div
              key={step.id}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    CAPABILITY 0{step.stepNumber}
                  </span>
                  <span className="badge" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                    READY
                  </span>
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#fff', marginBottom: '0.2rem' }}>
                  {step.title}
                </div>
                <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>
                  {step.toolSelected}
                </div>
                <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.65rem', marginBottom: '0.5rem' }}>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-bright)', lineHeight: '1.4', margin: 0 }}>
                    {step.evidenceObtained}
                  </p>
                </div>
              </div>
              <div style={{ marginTop: '0.5rem', paddingTop: '0.45rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>Confidence:</span>
                <span className="mono" style={{ color: 'var(--status-normal)', fontWeight: 700 }}>{step.confidence}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goal Verification Matrix (Phase 5 requirement) */}
      {verification && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(34, 197, 94, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--status-normal)' }}><CheckCircleIcon size={16} /></span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                GOAL VERIFICATION MATRIX
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Outcome Evaluation:</span>
              <span className="badge" style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                background: verification.goal_achieved ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: verification.goal_achieved ? '#4ade80' : '#ef4444',
                borderColor: verification.goal_achieved ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
                padding: '0.2rem 0.6rem'
              }}>
                {verification.overall_status || (verification.goal_achieved ? 'GOAL ACHIEVED' : 'GOAL NOT ACHIEVED')}
              </span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', textAlign: 'left' }}>
                  <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>Metric</th>
                  <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>Target Threshold</th>
                  <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>Current Telemetry</th>
                  <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600, textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {verification.criteria.map((crit, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.45rem 0.5rem', fontWeight: 600, color: '#fff' }}>
                      {crit.metric}
                    </td>
                    <td className="mono" style={{ padding: '0.45rem 0.5rem', color: 'var(--text-muted)' }}>
                      {crit.target}
                    </td>
                    <td className="mono" style={{ padding: '0.45rem 0.5rem', color: 'var(--text-bright)', fontWeight: 600 }}>
                      {crit.current}
                    </td>
                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right' }}>
                      <span className="badge" style={{
                        fontSize: '0.65rem',
                        padding: '0.1rem 0.35rem',
                        background: crit.status === 'PASS' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: crit.status === 'PASS' ? '#4ade80' : '#ef4444',
                        borderColor: crit.status === 'PASS' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'
                      }}>
                        {crit.status === 'PASS' ? <CheckIcon size={11} style={{ marginRight: '3px', verticalAlign: 'middle' }} /> : <XIcon size={11} style={{ marginRight: '3px', verticalAlign: 'middle' }} />}
                        {crit.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
