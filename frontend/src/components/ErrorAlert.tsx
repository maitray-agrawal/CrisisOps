import React from 'react';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onRetry }) => {
  return (
    <div className="error-alert">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong style={{ fontSize: '0.95rem' }}>System Communication Error</strong>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', color: '#fca5a5' }}>{message}</p>
        </div>
        {onRetry && (
          <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={onRetry}>
            Retry Request
          </button>
        )}
      </div>
    </div>
  );
};
