import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { ReplayTimeline, ReplayStep } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';

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
    <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-cyan-400">⏪</span> Time-Travel Incident Replay Engine
          </h3>
          <p className="text-xs text-slate-400">
            Interactive temporal synthesis combining telemetry streams, AI agent interventions, and human approvals.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg">
          <span className="text-xs text-slate-400">Timeline Progress:</span>
          <span className="text-xs font-mono font-bold text-cyan-400">
            Step {currentStepIdx + 1} / {timeline.total_steps}
          </span>
        </div>
      </div>

      {/* Telemetry Gauge Display */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-center">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Vibration</div>
          <div className={`text-xl font-bold font-mono ${currentStep.vibration_mm_s > 4.5 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {currentStep.vibration_mm_s.toFixed(2)} mm/s
          </div>
        </div>
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-center">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Temperature</div>
          <div className={`text-xl font-bold font-mono ${currentStep.temp_celsius > 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {currentStep.temp_celsius.toFixed(1)} °C
          </div>
        </div>
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-center">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Output Flow</div>
          <div className="text-xl font-bold font-mono text-cyan-400">
            {currentStep.output_units_min.toFixed(0)} units/min
          </div>
        </div>
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-center">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Machine State</div>
          <div className="text-xs font-bold font-mono text-white mt-1">
            <span className={`px-2 py-0.5 rounded ${
              currentStep.machine_status === 'CRITICAL' ? 'bg-rose-950 border border-rose-600 text-rose-300' :
              currentStep.machine_status === 'CONTAINED' ? 'bg-emerald-950 border border-emerald-600 text-emerald-300' :
              'bg-slate-800 text-slate-300'
            }`}>
              {currentStep.machine_status}
            </span>
          </div>
        </div>
      </div>

      {/* Scrubbing Control Bar */}
      <div className="space-y-3 bg-slate-950/40 p-4 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg transition shadow flex items-center gap-1.5"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play Replay'}
          </button>
          <button
            onClick={() => { setIsPlaying(false); setCurrentStepIdx(0); }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
          >
            ⏮ Reset
          </button>
          <div className="flex-1 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={timeline.total_steps - 1}
              value={currentStepIdx}
              onChange={handleSliderChange}
              className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Speed:</span>
            {[
              { label: '1x', speed: 1000 },
              { label: '2x', speed: 500 },
              { label: '5x', speed: 200 }
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => setPlaybackSpeed(s.speed)}
                className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                  playbackSpeed === s.speed
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step Event Inspector */}
      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
            Event Log Detail ({currentStep.event_actor || 'System'})
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {new Date(currentStep.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="text-sm font-bold text-white">{currentStep.event_title}</div>
        {currentStep.details && (
          <pre className="text-[11px] bg-slate-900 border border-slate-800 p-2.5 rounded text-slate-300 font-mono overflow-x-auto">
            {JSON.stringify(currentStep.details, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
