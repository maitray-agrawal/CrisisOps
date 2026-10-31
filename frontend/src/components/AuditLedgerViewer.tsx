import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { AuditLogEntry, AuditVerificationResponse } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';
import { HashVerifierModal } from './HashVerifierModal';

interface AuditLedgerViewerProps {
  incidentId: string;
}

export const AuditLedgerViewer: React.FC<AuditLedgerViewerProps> = ({ incidentId }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [verification, setVerification] = useState<AuditVerificationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Inspector modal state
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [parentLog, setParentLog] = useState<AuditLogEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAuditTrail(incidentId);
      setLogs(data);
      // Auto-trigger authoritative backend verification on load
      if (data.length > 0) {
        try {
          const res = await apiService.verifyAuditTrail(incidentId);
          setVerification(res);
        } catch {
          // silent fallback for verification state
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load audit ledger');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      setVerifying(true);
      const res = await apiService.verifyAuditTrail(incidentId);
      setVerification(res);
    } catch (err: any) {
      setError(err.message || 'Verification check failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleOpenInspector = (log: AuditLogEntry, index: number) => {
    setSelectedLog(log);
    const parent = index > 0 ? logs[index - 1] : null;
    setParentLog(parent);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (incidentId) {
      fetchLogs();
    }
  }, [incidentId]);

  if (loading) return <LoadingSpinner message="Loading SHA-256 Audit Ledger..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchLogs} />;

  // Derived Ledger Status Badge (Part 4)
  let ledgerStatusText = '🟡 VERIFICATION PENDING';
  let ledgerStatusBg = 'rgba(245, 158, 11, 0.15)';
  let ledgerStatusColor = '#f59e0b';
  let ledgerStatusBorder = 'rgba(245, 158, 11, 0.4)';

  if (verification) {
    if (verification.is_valid) {
      ledgerStatusText = '🟢 SHA-256 LEDGER VERIFIED';
      ledgerStatusBg = 'rgba(34, 197, 94, 0.15)';
      ledgerStatusColor = '#4ade80';
      ledgerStatusBorder = 'rgba(34, 197, 94, 0.4)';
    } else {
      ledgerStatusText = '🔴 LEDGER INTEGRITY FAILURE';
      ledgerStatusBg = 'rgba(239, 68, 68, 0.15)';
      ledgerStatusColor = '#ef4444';
      ledgerStatusBorder = 'rgba(239, 68, 68, 0.4)';
    }
  }

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      {/* Header & Verification Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ color: 'var(--accent-cyan)' }}>🛡️</span> SHA-256 Cryptographic Decision Ledger
            </h3>
            {/* Derived Ledger Status Badge */}
            <span
              className="badge mono"
              style={{
                fontSize: '0.7rem',
                padding: '0.2rem 0.6rem',
                background: ledgerStatusBg,
                color: ledgerStatusColor,
                borderColor: ledgerStatusBorder,
                fontWeight: 700
              }}
            >
              {ledgerStatusText}
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Immutable SHA-256 hash-chained audit log enforcing zero-trust operational compliance. Click any hash block to launch the cryptographic inspector.
          </p>
        </div>

        <button
          onClick={handleVerify}
          disabled={verifying || logs.length === 0}
          className="btn btn-primary"
          style={{
            fontSize: '0.8rem',
            padding: '0.5rem 1rem',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderColor: '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          {verifying ? '⚡ Verifying Chain...' : '🔒 Verify Ledger Integrity'}
        </button>
      </div>

      {/* Whole-Chain Verification Result Banner */}
      {verification && (
        <div
          style={{
            padding: '0.9rem 1.1rem',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${verification.is_valid ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            background: verification.is_valid ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.4rem' }}>{verification.is_valid ? '✅' : '🚨'}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: verification.is_valid ? '#4ade80' : '#ef4444' }}>
                {verification.is_valid ? 'AUTHORITATIVE SHA-256 HASH CHAIN VALIDATED' : 'TAMPER DETECTED IN AUDIT LEDGER'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-bright)', marginTop: '0.1rem' }}>
                {verification.message} ({verification.total_entries} blocks verified via backend)
              </div>
            </div>
          </div>
          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Cryptographic Engine: SHA-256
          </span>
        </div>
      )}

      {/* Audit Log Table */}
      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No audit entries recorded for this incident yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.6rem 0.5rem' }}>Block ID</th>
                <th style={{ padding: '0.6rem 0.5rem' }}>Timestamp</th>
                <th style={{ padding: '0.6rem 0.5rem' }}>Actor</th>
                <th style={{ padding: '0.6rem 0.5rem' }}>Action Type</th>
                <th style={{ padding: '0.6rem 0.5rem' }}>Previous Hash</th>
                <th style={{ padding: '0.6rem 0.5rem' }}>Current SHA-256</th>
                <th style={{ padding: '0.6rem 0.5rem', textAlign: 'right' }}>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => {
                const isGenesis = !log.previous_hash || log.previous_hash === '0'.repeat(64) || log.previous_hash.replace(/0/g, '') === '';
                const isTampered = verification?.tampered_entry_id === log.id;

                return (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      transition: 'background-color 0.15s ease',
                      background: isTampered ? 'rgba(239, 68, 68, 0.15)' : 'transparent'
                    }}
                    className="table-row-hover"
                  >
                    <td className="mono" style={{ padding: '0.65rem 0.5rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                      {log.id}
                    </td>
                    <td style={{ padding: '0.65rem 0.5rem', color: 'var(--text-bright)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '0.65rem 0.5rem', color: '#f59e0b' }}>
                      <span className="mono">{log.actor_type}:{log.actor_id}</span>
                    </td>
                    <td style={{ padding: '0.65rem 0.5rem' }}>
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.68rem',
                          background: 'rgba(6, 182, 212, 0.1)',
                          color: 'var(--accent-cyan)',
                          borderColor: 'rgba(6, 182, 212, 0.3)'
                        }}
                      >
                        {log.action_type}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.5rem' }}>
                      {isGenesis ? (
                        <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                          GENESIS BLOCK
                        </span>
                      ) : (
                        <span
                          onClick={() => handleOpenInspector(log, index)}
                          className="mono"
                          style={{ color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
                          title={log.previous_hash}
                        >
                          {log.previous_hash.substring(0, 12)}...
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.65rem 0.5rem' }}>
                      <span
                        onClick={() => handleOpenInspector(log, index)}
                        className="mono"
                        style={{
                          color: isTampered ? '#ef4444' : '#4ade80',
                          cursor: 'pointer',
                          fontWeight: 600,
                          background: isTampered ? 'rgba(239,68,68,0.2)' : 'rgba(34, 197, 94, 0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: `1px solid ${isTampered ? 'rgba(239,68,68,0.4)' : 'rgba(34, 197, 94, 0.3)'}`
                        }}
                        title={log.current_hash}
                      >
                        {log.current_hash.substring(0, 14)}...
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleOpenInspector(log, index)}
                        style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                      >
                        🔍 Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SHA-256 Web Crypto Inspector Modal */}
      <HashVerifierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedLog={selectedLog}
        parentLog={parentLog}
      />
    </div>
  );
};
