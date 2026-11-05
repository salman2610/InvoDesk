import { describe, it, expect } from 'vitest';
import { generateClientTransactionId, createSyncRecord, ServerSyncEngine } from './index';

describe('Offline Synchronization Engine', () => {
  it('generates unique client transaction IDs prefixed with device ID', () => {
    const id1 = generateClientTransactionId('POS-01');
    const id2 = generateClientTransactionId('POS-01');

    expect(id1).toContain('tx_POS-01_');
    expect(id2).toContain('tx_POS-01_');
    expect(id1).not.toBe(id2);
  });

  it('creates valid sync record with client timestamp and pending status', () => {
    const record = createSyncRecord(
      'INVOICE',
      'CREATE',
      'inv_123',
      { grandTotal: 2500 },
      'branch_1',
      'tenant_1',
      'TERM-01'
    );

    expect(record.clientTransactionId).toContain('tx_TERM-01_');
    expect(record.status).toBe('PENDING');
    expect(record.entityType).toBe('INVOICE');
    expect(record.payload.grandTotal).toBe(2500);
  });

  it('guarantees server idempotency when processing duplicate transaction batches', () => {
    const engine = new ServerSyncEngine();

    const record1 = createSyncRecord('INVOICE', 'CREATE', 'inv_101', {}, 'branch_1', 'tenant_1');
    const record2 = createSyncRecord('INVOICE', 'CREATE', 'inv_102', {}, 'branch_1', 'tenant_1');

    // First batch push
    const res1 = engine.processBatch([record1, record2]);
    expect(res1.syncedIds).toEqual([record1.id, record2.id]);
    expect(res1.conflicts.length).toBe(0);

    // Resend batch (e.g. network timeout retry from client)
    const res2 = engine.processBatch([record1, record2]);
    // Must acknowledge IDs as synced without duplicate processing
    expect(res2.syncedIds).toEqual([record1.id, record2.id]);
    expect(res2.conflicts.length).toBe(0);
  });
});
