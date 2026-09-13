import React from 'react';
import { AlertOctagonIcon, RefreshCwIcon } from './Icons';

interface ErrorAlertProps {
  message: string;
  service?: string;
  statusCode?: string | number;
  onRetry?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  service = 'CrisisOps API',
  statusCode,
  onRetry
}) => {
  // Extract status if encoded in message (e.g. "HTTP Error 404...")
  let displayStatus = statusCode ? String(statusCode) : 'Unavailable';
  const statusMatch = message.match(/HTTP (?:Error )?(\d{3})/i);
  if (statusMatch) {
    displayStatus = statusMatch[1];
  }

  // Clean user-facing text without raw stack traces
  const cleanMessage = message.split('\n')[0].replace(/Traceback.*$/i, '').trim();

  return (
    <div
      className="card"
      style={{
        border: '1px solid rgba(239, 68, 68, 0.4)',
        background: 'rgba(239, 68, 68, 0.06)',
        padding: '1.5rem',
        margin: '1.5rem auto',
        maxWidth: '800px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ color: 'var(--status-critical)', marginTop: '2px' }}>
          <AlertOctagonIcon size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444', letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
              SYSTEM COMMUNICATION ERROR
            </h3>
            <span
              className="badge"
              style={{
                fontSize: '0.68rem',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.4)'
              }}
            >
              Status: {displayStatus}
            </span>
          </div>

          <p style={{ fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '0.85rem', lineHeight: '1.4' }}>
            {cleanMessage || 'Unable to retrieve incident or telemetry data from upstream backend service.'}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '0.75rem',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}
          >
            <div>
              <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '0.68rem' }}>Service</span>
              <div className="mono" style={{ color: '#fff', fontWeight: 600, marginTop: '2px' }}>{service}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '0.68rem' }}>Endpoint State</span>
              <div className="mono" style={{ color: '#f59e0b', fontWeight: 600, marginTop: '2px' }}>{displayStatus}</div>
            </div>
          </div>
        </div>
      </div>

      {onRetry && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
            onClick={onRetry}
          >
            <RefreshCwIcon size={14} /> Retry Request
          </button>
        </div>
      )}
    </div>
  );
};
