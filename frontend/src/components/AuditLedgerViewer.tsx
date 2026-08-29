import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { AuditLogEntry, AuditVerificationResponse } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorAlert } from './ErrorAlert';

interface AuditLedgerViewerProps {
  incidentId: string;
}

export const AuditLedgerViewer: React.FC<AuditLedgerViewerProps> = ({ incidentId }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [verification, setVerification] = useState<AuditVerificationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAuditTrail(incidentId);
      setLogs(data);
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

  useEffect(() => {
    if (incidentId) {
      fetchLogs();
    }
  }, [incidentId]);

  if (loading) return <LoadingSpinner message="Loading SHA-256 Audit Ledger..." />;
  if (error) return <ErrorAlert message={error} onRetry={fetchLogs} />;

  return (
    <div className="space-y-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-cyan-400">🛡️</span> Cryptographic Decision Ledger
          </h3>
          <p className="text-xs text-slate-400">
            Immutable SHA-256 hash-chained audit log enforcing zero-trust operational compliance.
          </p>
        </div>
        <button
          onClick={handleVerify}
          disabled={verifying || logs.length === 0}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-emerald-950/40 disabled:opacity-50 flex items-center gap-2"
        >
          {verifying ? 'Verifying Hashes...' : '🔒 Verify Ledger Integrity'}
        </button>
      </div>

      {verification && (
        <div className={`p-4 rounded-lg border text-sm flex items-center justify-between transition-all ${
          verification.is_valid
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
            : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{verification.is_valid ? '✅' : '🚨'}</span>
            <div>
              <div className="font-bold text-base">
                {verification.is_valid ? 'SHA-256 HASH CHAIN VALIDATED' : 'TAMPER DETECTED IN AUDIT LEDGER'}
              </div>
              <div className="text-xs opacity-90">{verification.message} ({verification.total_entries} blocks checked)</div>
            </div>
          </div>
        </div>
      )}

      {logs.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          No audit entries recorded for this incident yet.
        </div>
      ) : (
        <div className="space-y-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-2 px-2">Block</th>
                <th className="pb-2 px-2">Timestamp</th>
                <th className="pb-2 px-2">Actor</th>
                <th className="pb-2 px-2">Action</th>
                <th className="pb-2 px-2">Previous Hash</th>
                <th className="pb-2 px-2">Current SHA-256</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-2 text-cyan-400 font-bold">{log.id}</td>
                  <td className="py-2.5 px-2 text-slate-300">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-2 text-amber-300">
                    {log.actor_type}: {log.actor_id}
                  </td>
                  <td className="py-2.5 px-2 text-white font-semibold">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-teal-300">
                      {log.action_type}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-slate-500 truncate max-w-[120px]" title={log.previous_hash}>
                    {log.previous_hash.substring(0, 12)}...
                  </td>
                  <td className="py-2.5 px-2 text-emerald-400 truncate max-w-[140px]" title={log.current_hash}>
                    {log.current_hash.substring(0, 14)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
