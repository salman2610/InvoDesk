'use client';

import React from 'react';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  CheckCircle2,
  AlertTriangle,
  Server,
  ArrowRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { SyncRecord } from '@invodesk/types';

interface SyncModalProps {
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  pendingRecords: SyncRecord[];
  syncedHistory: SyncRecord[];
  onForceSync: () => void;
  isSyncing: boolean;
}

export const SyncView: React.FC<SyncModalProps> = ({
  isOnline,
  setIsOnline,
  pendingRecords,
  syncedHistory,
  onForceSync,
  isSyncing
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>
              Offline Synchronization & Conflict Engine
            </h1>
            <span className={`badge ${isOnline ? 'badge-success' : 'badge-danger'}`}>
              {isOnline ? 'Gateway Connected' : 'Offline Mode Active'}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Idempotent replication, client transaction queue, and local-first conflict resolution
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`btn ${isOnline ? 'btn-outline' : 'btn-primary'}`}
          >
            {isOnline ? <WifiOff size={16} /> : <Wifi size={16} />}
            {isOnline ? 'Simulate Disconnection' : 'Restore Connection'}
          </button>

          <button
            onClick={onForceSync}
            disabled={!isOnline || isSyncing || pendingRecords.length === 0}
            className="btn btn-success"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Reconciling...' : `Force Sync (${pendingRecords.length} Pending)`}
          </button>
        </div>
      </div>

      {/* Architecture Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16
      }}>
        {/* Local Storage Status */}
        <div className="glass-panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--brand-emerald-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-emerald-dark)'
            }}>
              <Database size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Local Device Persistence</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Device: DEV-PUN-TERMINAL-01</div>
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            • Invoices generated offline are saved immediately to local storage.<br />
            • Invoices are immutable and assigned deterministic serial IDs to prevent duplicate booking.<br />
            • Pending items in local queue: <strong style={{ color: pendingRecords.length > 0 ? 'var(--accent-danger)' : 'var(--brand-emerald-dark)' }}>{pendingRecords.length}</strong>
          </div>
        </div>

        {/* Server Cloud State */}
        <div className="glass-panel" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'var(--brand-emerald-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-emerald-dark)'
            }}>
              <Server size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Central Fastify API Gateway</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PostgreSQL Central Cloud</div>
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            • Status: {isOnline ? 'Online & Healthy (Port 4000)' : 'Unreachable (Offline Simulated)'}<br />
            • Multi-branch replication: Enabled<br />
            • Reconciliation strategy: Append-only financial ledger with vector clock stock audit
          </div>
        </div>
      </div>

      {/* Pending Transactions Queue */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
              Local Outbox: Pending Replication Queue ({pendingRecords.length})
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Mutations executed while offline awaiting idempotent server acknowledgement
            </p>
          </div>
        </div>

        {pendingRecords.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="var(--accent-success)" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
              All transactions are synchronized!
            </p>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Switch to Offline mode, create bills in POS, and observe them queue up here.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client Transaction ID</th>
                  <th>Entity Type</th>
                  <th>Operation</th>
                  <th>Local Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingRecords.map(rec => (
                  <tr key={rec.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
                      {rec.clientTransactionId}
                    </td>
                    <td>{rec.entityType}</td>
                    <td>
                      <span className="badge badge-indigo">{rec.operation}</span>
                    </td>
                    <td>{new Date(rec.clientTimestamp).toLocaleTimeString()}</td>
                    <td>
                      <span className="badge badge-warning">QUEUED (LOCAL)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Synced History Log */}
      {syncedHistory.length > 0 && (
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Reconciliation Audit Trail</h3>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client Tx ID</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>Reconciled Time</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {syncedHistory.slice(0, 10).map(rec => (
                  <tr key={rec.id}>
                    <td style={{ fontFamily: 'monospace' }}>{rec.clientTransactionId}</td>
                    <td>{rec.entityType}</td>
                    <td>{rec.entityId}</td>
                    <td>{new Date(rec.serverTimestamp || Date.now()).toLocaleTimeString()}</td>
                    <td>
                      <span className="badge badge-success">IDEMPOTENT ACK</span>
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
