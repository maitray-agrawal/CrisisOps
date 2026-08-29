import React, { useEffect, useState } from 'react';
import { AuditLogEntry } from '../types';

interface HashVerifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLog: AuditLogEntry | null;
  parentLog?: AuditLogEntry | null;
}

export const HashVerifierModal: React.FC<HashVerifierModalProps> = ({
  isOpen,
  onClose,
  selectedLog,
  parentLog
}) => {
  const [calculatedHash, setCalculatedHash] = useState<string>('');
  const [canonicalPayload, setCanonicalPayload] = useState<string>('');
  const [editablePayload, setEditablePayload] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const formatTimestamp = (ts: string): string => {
    if (!ts) return '';
    if (ts.includes('Z') || ts.includes('+')) {
      try {
        const d = new Date(ts);
        return d.toISOString().replace('Z', '');
      } catch {
        return ts;
      }
    }
    return ts;
  };

  const computeSha256 = async (str: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const performVerification = async (payloadToHash: string) => {
    setIsVerifying(true);
    try {
      const hash = await computeSha256(payloadToHash);
      setCalculatedHash(hash);
    } catch (err) {
      console.error('Web Crypto SHA-256 calculation error:', err);
      setCalculatedHash('CALCULATION_ERROR');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (selectedLog) {
      const formattedTs = formatTimestamp(selectedLog.timestamp);
      const payloadStr = `${selectedLog.id}|${formattedTs}|${selectedLog.actor_type}|${selectedLog.actor_id}|${selectedLog.action_type}|${selectedLog.details_json}|${selectedLog.previous_hash}`;
      setCanonicalPayload(payloadStr);
      setEditablePayload(payloadStr);
      performVerification(payloadStr);
    }
  }, [selectedLog]);

  if (!isOpen || !selectedLog) return null;

  const isGenesis =
    !selectedLog.previous_hash ||
    selectedLog.previous_hash === '0'.repeat(64) ||
    selectedLog.previous_hash.replace(/0/g, '') === '';

  const isMatch = calculatedHash.toLowerCase() === selectedLog.current_hash.toLowerCase();

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
        background: 'rgba(5, 10, 20, 0.88)',
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
          maxWidth: '750px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15), rgba(15, 23, 42, 0.95))',
            padding: '1.15rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🔒</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
                SHA-256 Cryptographic Block Hash Inspector
              </h3>
              <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Real-time Web Crypto verification of immutable ledger block hash chaining
              </p>
            </div>
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

        {/* Body */}
        <div style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '1.15rem', maxHeight: '80vh', overflowY: 'auto' }}>
          {/* Blocks Overview Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* PARENT BLOCK */}
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.9rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  🔗 PARENT BLOCK (H<sub>n-1</sub>)
                </span>
                {isGenesis && (
                  <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.4)', fontSize: '0.65rem' }}>
                    GENESIS BLOCK
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600, marginBottom: '0.3rem' }}>
                Event ID: <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{parentLog ? parentLog.id : isGenesis ? 'GENESIS SEED' : 'Previous Block'}</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                Previous Hash:
                <div className="mono" style={{ color: isGenesis ? '#60a5fa' : 'var(--text-bright)', background: 'rgba(0,0,0,0.3)', padding: '0.35rem', borderRadius: '4px', marginTop: '0.2rem', fontSize: '0.7rem' }}>
                  {selectedLog.previous_hash || '0'.repeat(64)}
                </div>
              </div>
            </div>

            {/* CURRENT BLOCK */}
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.9rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                  📦 CURRENT BLOCK (H<sub>n</sub>)
                </span>
                <span className="mono" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>{selectedLog.id}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#fff', marginBottom: '0.2rem' }}>
                Action: <strong style={{ color: '#4ade80' }}>{selectedLog.action_type}</strong>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Actor: <span className="mono">{selectedLog.actor_type}:{selectedLog.actor_id}</span> • {new Date(selectedLog.timestamp).toLocaleTimeString()}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                Stored Hash:
                <div className="mono" style={{ color: 'var(--accent-cyan)', background: 'rgba(0,0,0,0.3)', padding: '0.35rem', borderRadius: '4px', marginTop: '0.2rem', fontSize: '0.7rem' }}>
                  {selectedLog.current_hash}
                </div>
              </div>
            </div>
          </div>

          {/* VERIFICATION FORMULA CARD */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              borderLeft: '4px solid var(--accent-cyan)',
              borderRadius: '8px',
              padding: '1rem'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              📐 VERIFICATION FORMULA & CANONICAL PAYLOAD
            </div>
            <div className="mono" style={{ fontSize: '0.8rem', color: '#fff', background: 'rgba(0,0,0,0.4)', padding: '0.5rem', borderRadius: '4px', marginBottom: '0.75rem' }}>
              H<sub>n</sub> = SHA256( LogID | Timestamp | ActorType | ActorID | ActionType | DetailsJSON | H<sub>n-1</sub> )
            </div>

            <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
              Canonical Payload Input (Edit to test tamper detection in real-time):
            </label>
            <textarea
              value={editablePayload}
              onChange={(e) => {
                setEditablePayload(e.target.value);
                performVerification(e.target.value);
              }}
              rows={3}
              className="mono"
              style={{
                width: '100%',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-bright)',
                fontSize: '0.72rem',
                borderRadius: '6px',
                padding: '0.5rem',
                resize: 'vertical'
              }}
            />

            {editablePayload !== canonicalPayload && (
              <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#f59e0b' }}>⚠️ Payload modified (Simulating data tampering)</span>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setEditablePayload(canonicalPayload);
                    performVerification(canonicalPayload);
                  }}
                  style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
                >
                  Reset Canonical Payload
                </button>
              </div>
            )}
          </div>

          {/* VERIFICATION RESULT BADGE */}
          <div
            style={{
              background: isMatch ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${isMatch ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              borderRadius: '8px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>{isMatch ? '✅' : '🚨'}</span>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: isMatch ? '#4ade80' : '#ef4444' }}>
                    {isMatch ? 'CRYPTOGRAPHIC HASH VERIFIED (MATCH)' : 'HASH MISMATCH (INTEGRITY BREACH)'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {isMatch
                      ? 'Live Web Crypto SHA-256 digest exactly matches stored immutable ledger hash.'
                      : 'Calculated SHA-256 digest differs from stored block hash!'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Web Crypto Digest:</div>
              <div className="mono" style={{ fontSize: '0.72rem', color: isMatch ? '#4ade80' : '#ef4444', fontWeight: 700 }}>
                {isVerifying ? 'Calculating...' : `${calculatedHash.substring(0, 16)}...`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
