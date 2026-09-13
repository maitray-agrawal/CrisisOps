import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { ReplayTimeline, ReplayStep } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';
import {
  RewindIcon,
  PlayIcon,
  PauseIcon,
  SkipBackIcon
} from './Icons';

interface ReplayPlayerProps {
  incidentId: string;
}

export const ReplayPlayer: React.FC<ReplayPlayerProps> = ({ incidentId }) => {
  const [timeline, setTimeline] = useState<ReplayTimeline | null>(null);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per step
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<any>(null);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getReplayTimeline(incidentId);
      setTimeline(data);
      setCurrentStepIdx(0);
    } catch (err: any) {
      setError(err.message || 'Failed to load incident replay timeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (incidentId) {
      fetchTimeline();
    }
  }, [incidentId]);

  useEffect(() => {
    if (isPlaying && timeline && timeline.steps.length > 0) {
      timerRef.current = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev >= timeline.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, timeline, playbackSpeed]);

  if (loading) return <LoadingSpinner message="Reconstructing Time-Travel Telemetry & Audit Sequence..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchTimeline} />;
  if (!timeline || timeline.steps.length === 0) return null;

  const currentStep: ReplayStep = timeline.steps[currentStepIdx];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false);
    setCurrentStepIdx(Number(e.target.value));
  };

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ color: 'var(--accent-cyan)' }}><RewindIcon size={18} /></span>
            Time-Travel Incident Replay Engine
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
            Interactive temporal synthesis combining telemetry streams, AI agent interventions, and human approvals.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Timeline Progress:</span>
          <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
            Step {currentStepIdx + 1} / {timeline.total_steps}
          </span>
        </div>
      </div>

      {/* Telemetry Gauge Display */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ padding: '0.85rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Vibration</div>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '0.2rem', color: currentStep.vibration_mm_s > 4.5 ? 'var(--status-critical)' : 'var(--status-normal)' }}>
            {currentStep.vibration_mm_s.toFixed(2)} mm/s
          </div>
        </div>

        <div style={{ padding: '0.85rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Bearing Temperature</div>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '0.2rem', color: currentStep.temp_celsius > 80 ? 'var(--status-warning)' : 'var(--status-normal)' }}>
            {currentStep.temp_celsius.toFixed(1)} °C
          </div>
        </div>

        <div style={{ padding: '0.85rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Throughput Flow</div>
          <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--accent-cyan)' }}>
            {currentStep.output_units_min.toFixed(0)} units/min
          </div>
        </div>

        <div style={{ padding: '0.85rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Machine State</div>
          <div style={{ marginTop: '0.35rem' }}>
            <span className={`badge badge-${currentStep.machine_status.toLowerCase()}`}>
              {currentStep.machine_status}
            </span>
          </div>
        </div>
      </div>

      {/* Scrubbing Control Bar */}
      <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {isPlaying ? (
              <>
                <PauseIcon size={14} /> Pause
              </>
            ) : (
              <>
                <PlayIcon size={14} /> Play Replay
              </>
            )}
          </button>
          <button
            onClick={() => { setIsPlaying(false); setCurrentStepIdx(0); }}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <SkipBackIcon size={14} /> Reset
          </button>

          <div style={{ flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center' }}>
            <input
              type="range"
              min={0}
              max={timeline.total_steps - 1}
              value={currentStepIdx}
              onChange={handleSliderChange}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Speed:</span>
            {[
              { label: '1x', speed: 1000 },
              { label: '2x', speed: 500 },
              { label: '5x', speed: 200 }
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => setPlaybackSpeed(s.speed)}
                className="mono"
                style={{
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: playbackSpeed === s.speed ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.05)',
                  color: playbackSpeed === s.speed ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  border: `1px solid ${playbackSpeed === s.speed ? 'rgba(6, 182, 212, 0.4)' : 'transparent'}`
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step Event Inspector */}
      <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--status-warning)', letterSpacing: '0.04em' }}>
            Event Log Detail ({currentStep.event_actor || 'System Engine'})
          </span>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {new Date(currentStep.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
          {currentStep.event_title}
        </div>
        {currentStep.details && (
          <pre style={{
            fontSize: '0.75rem',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-bright)',
            fontFamily: 'var(--font-mono)',
            overflowX: 'auto',
            margin: 0
          }}>
            {JSON.stringify(currentStep.details, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
