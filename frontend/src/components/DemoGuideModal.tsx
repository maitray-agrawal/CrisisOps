import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface DemoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: 'dashboard' | 'incidents' | 'machines' | 'sops') => void;
}

interface DemoStep {
  act: number;
  title: string;
  subtitle: string;
  description: string;
  keyMetric: string;
  actionText?: string;
  actionType?: 'trigger' | 'tick' | 'reset' | 'navigate_incidents' | 'navigate_dashboard';
  targetTab?: 'dashboard' | 'incidents' | 'machines' | 'sops';
}

const DEMO_STEPS: DemoStep[] = [
  {
    act: 1,
    title: 'Act 1 — Normal Plant Operations',
    subtitle: 'Baseline Health & Asset Monitoring',
    description: 'Inspect the Operations Command Center. Monitored assets (M-204 Centrifugal Compressor, M-101 Water Pump, M-305 Turbine) are running in green NORMAL state.',
    keyMetric: 'M-204 Vibration: ~1.8 mm/s | Temp: ~52.0°C | Status: NORMAL',
    actionText: '🔄 Verify Baseline Operations',
    actionType: 'reset',
    targetTab: 'dashboard'
  },
  {
    act: 2,
    title: 'Act 2 — Inject M-204 Bearing Failure',
    subtitle: 'Simulate Industrial Degradation',
    description: 'Trigger the M-204 bearing degradation sequence. Mechanical degradation begins immediately across vibration, temperature, and output metrics.',
    keyMetric: 'M-204 Vibration: Spiking towards 7.82 mm/s | Temp: 88.4°C',
    actionText: '🔥 Trigger M-204 Failure',
    actionType: 'trigger',
    targetTab: 'dashboard'
  },
  {
    act: 3,
    title: 'Act 3 — Real-Time Anomaly & Incident Detection',
    subtitle: 'Statistical Threshold Breached',
    description: 'The Anomaly Detection Engine identifies critical vibration and temperature threshold breaches, automatically transitioning M-204 state to CRITICAL and opening incident ticket INC-2026-001.',
    keyMetric: 'Machine State: CRITICAL | Active Incidents: 1 (INC-2026-001)',
    actionText: '🚨 View Incidents Workspace',
    actionType: 'navigate_incidents',
    targetTab: 'incidents'
  },
  {
    act: 4,
    title: 'Act 4 — 4-Stage AI Agent Investigation',
    subtitle: 'Autonomous Multi-Agent Analysis',
    description: 'The 4-stage agent pipeline executes sequentially: Signal Correlator $\rightarrow$ Root Cause Analysis (92% confidence) $\rightarrow$ Business Impact ($45,000 risk) $\rightarrow$ SOP RAG Retrieval (SOP-COMP-001).',
    keyMetric: 'Hypothesis: Centrifugal Compressor Bearing Failure (92% Confidence)',
    actionText: '🔬 Inspect Investigation Pipeline',
    actionType: 'navigate_incidents',
    targetTab: 'incidents'
  },
  {
    act: 5,
    title: 'Act 5 — Human-in-the-Loop Approval Gate',
    subtitle: 'Industrial Safety Boundary Enforced',
    description: 'The platform prohibits autonomous physical actuation. The response plan is locked until the Shift Operator reviews evidence, verifies SOP-COMP-001, and toggles explicit authorization.',
    keyMetric: 'Gate Lock Status: REQUIRES OPERATOR APPROVAL',
    actionText: '🛡️ Review Approval Gate',
    actionType: 'navigate_incidents',
    targetTab: 'incidents'
  },
  {
    act: 6,
    title: 'Act 6 — Containment Actuation & System Recovery',
    subtitle: 'Software-Guided Containment Execution',
    description: 'Upon operator approval, execute the simulated containment action (Lockout & Lubrication Flush). Machine M-204 transitions to CONTAINED and telemetry graphs return to green baseline.',
    keyMetric: 'Machine State: CONTAINED | Vibration Restored: 1.8 mm/s',
    actionText: '⚡ Execute Containment Action',
    actionType: 'navigate_incidents',
    targetTab: 'incidents'
  },
  {
    act: 7,
    title: 'Act 7 — Cryptographic Ledger & Incident Replay',
    subtitle: 'SHA-256 Auditability & Explainability',
    description: 'Inspect the tamper-evident SHA-256 Decision Ledger, review the grounded RAG Explainability Map, and scrub step-by-step through the Incident Time-Travel Replay player.',
    keyMetric: 'Ledger Status: 100% SHA-256 VERIFIED | Cryptographic Chain Valid',
    actionText: '⏪ Open Decision Ledger & Replay',
    actionType: 'navigate_incidents',
    targetTab: 'incidents'
  }
];

export const DemoGuideModal: React.FC<DemoGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'walkthrough' | 'pitch'>('walkthrough');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowLeft') {
        setCurrentStepIndex((prev) => Math.max(0, prev - 1));
        return;
      }

      if (e.key === 'ArrowRight') {
        setCurrentStepIndex((prev) => Math.min(DEMO_STEPS.length - 1, prev + 1));
        return;
      }

      if (e.key >= '1' && e.key <= '7') {
        const actNum = parseInt(e.key, 10);
        setCurrentStepIndex(actNum - 1);
        setActiveTab('walkthrough');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentStep = DEMO_STEPS[currentStepIndex];

  const handleStepAction = async () => {
    setActionLoading(true);
    try {
      if (currentStep.actionType === 'reset') {
        await apiService.resetSimulation();
        window.dispatchEvent(new Event('simulation-updated'));
      } else if (currentStep.actionType === 'trigger') {
        await apiService.triggerDegradation();
        window.dispatchEvent(new Event('simulation-updated'));
      } else if (currentStep.actionType === 'tick') {
        await apiService.triggerSimulationTick();
        window.dispatchEvent(new Event('simulation-updated'));
      }

      if (currentStep.targetTab) {
        onNavigateToTab(currentStep.targetTab);
      }
    } catch (err) {
      console.error('Demo step action failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(5, 10, 20, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '700px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.15), rgba(15, 23, 42, 0.95))',
            padding: '1.15rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                background: 'var(--accent-cyan)',
                color: '#000',
                fontWeight: 800,
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '0.8rem'
              }}
            >
              ACT {currentStep.act} / 7
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 700 }}>
              Judge Demo Walkthrough Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '1.2rem',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher & Keyboard Hint */}
        <div
          style={{
            padding: '0.65rem 1.5rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('walkthrough')}
              className={`btn ${activeTab === 'walkthrough' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
            >
              🎬 7-Act Script
            </button>
            <button
              onClick={() => setActiveTab('pitch')}
              className={`btn ${activeTab === 'pitch' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
            >
              🏆 JUDGE PITCH & ARCHITECTURE
            </button>
          </div>

          <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
            ⌨️ Keys <strong style={{ color: '#fff' }}>[1–7]</strong> Act • <strong style={{ color: '#fff' }}>[←/→]</strong> Nav • <strong style={{ color: '#fff' }}>[Esc]</strong> Close
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem' }}>
          {activeTab === 'pitch' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Product Positioning */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  borderLeft: '4px solid var(--accent-cyan)',
                  borderRadius: '8px',
                  padding: '1.15rem'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  🎯 VALUE PROPOSITION & JUDGE PITCH
                </div>
                <p style={{ fontSize: '0.98rem', color: '#fff', lineHeight: '1.55', margin: 0, fontWeight: 500 }}>
                  "Industrial CrisisOps is the mission-control AI platform that transforms noisy plant telemetry into grounded incident response—guarded by human approval and cryptographic auditability."
                </p>
              </div>

              {/* End-to-End Architecture Flow */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '1.15rem'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
                  🏗️ END-TO-END SYSTEM ARCHITECTURE
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem'
                  }}
                >
                  <span style={{ background: 'rgba(6,182,212,0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(6,182,212,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
                    Sensor Signal
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                  <span style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
                    Anomaly Detection
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                  <span style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
                    Multi-Agent RCA
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                  <span style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
                    SOP Grounding
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                  <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
                    Human Approval
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                  <span style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
                    Actuation
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                  <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
                    SHA-256 Ledger
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                  <span style={{ background: 'rgba(236,72,153,0.15)', color: '#f472b6', border: '1px solid rgba(236,72,153,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
                    Incident Replay
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.25rem' }}>
                {currentStep.subtitle}
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff', margin: '0 0 1rem 0' }}>
                {currentStep.title}
              </h2>

              <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                {currentStep.description}
              </p>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-color)',
                  borderLeft: '4px solid var(--accent-cyan)',
                  borderRadius: '6px',
                  padding: '0.9rem 1.1rem',
                  marginBottom: '1.5rem',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  color: 'var(--accent-cyan)'
                }}
              >
                🎯 <strong>Key Demo Focus:</strong> {currentStep.keyMetric}
              </div>

              {/* Action Trigger Button */}
              {currentStep.actionText && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <button
                    className="btn btn-primary"
                    onClick={handleStepAction}
                    disabled={actionLoading}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1.25rem',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {actionLoading ? 'Executing Step Action...' : currentStep.actionText}
                  </button>
                </div>
              )}

              {/* Step Navigation Controls */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)'
                }}
              >
                <button
                  className="btn btn-outline"
                  disabled={currentStepIndex === 0}
                  onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                  style={{ opacity: currentStepIndex === 0 ? 0.4 : 1 }}
                >
                  ⬅️ Previous Act
                </button>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {DEMO_STEPS.map((_, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentStepIndex(idx)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        background: idx === currentStepIndex ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.1)',
                        color: idx === currentStepIndex ? '#000' : 'var(--text-muted)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: idx === currentStepIndex ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      {idx + 1}
                    </div>
                  ))}
                </div>

                <button
                  className="btn btn-primary"
                  disabled={currentStepIndex === DEMO_STEPS.length - 1}
                  onClick={() => setCurrentStepIndex((prev) => Math.min(DEMO_STEPS.length - 1, prev + 1))}
                  style={{ opacity: currentStepIndex === DEMO_STEPS.length - 1 ? 0.4 : 1 }}
                >
                  Next Act ➡️
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
