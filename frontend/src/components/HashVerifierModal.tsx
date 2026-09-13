import React, { useEffect, useState } from 'react';
import { AuditLogEntry } from '../types';
import {
  LockIcon,
  XIcon,
  LayersIcon,
  CpuIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  AlertOctagonIcon,
  FileTextIcon
} from './Icons';

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
            <span style={{ color: 'var(--accent-cyan)' }}><LockIcon size={20} /></span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>
                SHA-256 Cryptographic Hash Inspector
              </h3>
              <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Client-side Web Crypto API Verification Engine • Block {selectedLog.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', borderColor: 'transparent', color: 'var(--text-muted)' }}
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '80vh', overflowY: 'auto' }}>
          {/* Section 1: Parent Block Reference */}
          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <LayersIcon size={13} color="var(--accent-cyan)" /> PARENT BLOCK (H<sub>n-1</sub>)
            </div>
            {isGenesis ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge" style={{ fontSize: '0.68rem', background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.4)' }}>
                  GENESIS BLOCK (ROOT ANCHOR)
                </span>
                <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  0000000000000000000000000000000000000000000000000000000000000000
                </span>
              </div>
            ) : (
              <div>
                <div className="mono" style={{ fontSize: '0.8rem', color: '#93c5fd', wordBreak: 'break-all' }}>
                  {selectedLog.previous_hash}
                </div>
                {parentLog && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
                    Linked to Block: <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{parentLog.id}</span> ({parentLog.action_type})
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Current Block Invariant */}
          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CpuIcon size={13} color="var(--accent-cyan)" /> CURRENT BLOCK (H<sub>n</sub>)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.75rem' }}>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Block ID:</span>
                <div className="mono" style={{ color: '#fff', fontWeight: 600 }}>{selectedLog.id}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Action:</span>
                <div className="mono" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{selectedLog.action_type}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Actor:</span>
                <div className="mono" style={{ color: '#f59e0b', fontWeight: 600 }}>{selectedLog.actor_type}:{selectedLog.actor_id}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Timestamp:</span>
                <div className="mono" style={{ color: 'var(--text-bright)' }}>{new Date(selectedLog.timestamp).toISOString()}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>Stored Canonical Hash:</div>
            <div className="mono" style={{ fontSize: '0.8rem', color: '#4ade80', wordBreak: 'break-all', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {selectedLog.current_hash}
            </div>
          </div>

          {/* Section 3: Interactive Canonical Payload Verifier */}
          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileTextIcon size={13} /> VERIFICATION FORMULA & CANONICAL PAYLOAD
              </div>
              <button
                className="btn btn-outline"
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                onClick={() => {
                  setEditablePayload(canonicalPayload);
                  performVerification(canonicalPayload);
                }}
              >
                Reset Canonical
              </button>
            </div>
            <div className="mono" style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>
              Formula: SHA256(id|timestamp|actor_type|actor_id|action_type|details_json|previous_hash)
            </div>

            <textarea
              rows={3}
              value={editablePayload}
              onChange={(e) => {
                setEditablePayload(e.target.value);
                performVerification(e.target.value);
              }}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                padding: '0.5rem',
                outline: 'none',
                resize: 'vertical'
              }}
              title="Edit string to test cryptographic tamper detection"
            />
            {editablePayload !== canonicalPayload && (
              <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <AlertTriangleIcon size={12} /> Payload modified (Simulating data tampering)
              </div>
            )}
          </div>

          {/* Section 4: Live Verification Result Banner */}
          <div
            style={{
              padding: '0.9rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${isMatch ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              background: isMatch ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ color: isMatch ? '#4ade80' : '#ef4444' }}>
                {isMatch ? <CheckCircleIcon size={24} /> : <AlertOctagonIcon size={24} />}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: isMatch ? '#4ade80' : '#ef4444' }}>
                  {isMatch ? 'HASH INTEGRITY MATCH' : 'HASH MISMATCH (INTEGRITY COMPROMISED)'}
                </div>
                <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-bright)', marginTop: '0.2rem', wordBreak: 'break-all' }}>
                  Calculated: {isVerifying ? 'Calculating...' : calculatedHash}
                </div>
              </div>
            </div>
            <span
              className="badge"
              style={{
                fontSize: '0.7rem',
                background: isMatch ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: isMatch ? '#4ade80' : '#ef4444',
                borderColor: isMatch ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
              }}
            >
              {isMatch ? 'VALID BLOCK' : 'TAMPERED'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose} style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
