import { SyncEntityType, SyncOperation, SyncPushResponse, SyncRecord } from '@invodesk/types';

/**
 * Generate unique client transaction ID for idempotent replication
 * format: {deviceId}-{timestamp}-{sequence}-{random}
 */
export function generateClientTransactionId(deviceId = 'DEV1'): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `tx_${deviceId}_${ts}_${rand}`;
}

export interface ClientSyncQueue {
  pendingRecords: SyncRecord[];
  processedIds: Set<string>;
  lastSyncedAt: number;
}

export function createSyncRecord(
  entityType: SyncEntityType,
  operation: SyncOperation,
  entityId: string,
  payload: any,
  branchId: string,
  tenantId: string,
  deviceId = 'DEV1'
): SyncRecord {
  return {
    id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    clientTransactionId: generateClientTransactionId(deviceId),
    tenantId,
    branchId,
    entityType,
    operation,
    entityId,
    payload,
    clientTimestamp: Date.now(),
    status: 'PENDING'
  };
}

/**
 * Server-side reconciliation engine with idempotency & conflict detection
 */
export class ServerSyncEngine {
  private processedTransactionIds = new Set<string>();

  constructor(existingTransactionIds: string[] = []) {
    existingTransactionIds.forEach(id => this.processedTransactionIds.add(id));
  }

  public processBatch(
    records: SyncRecord[],
    checkEntityConflict?: (record: SyncRecord) => { hasConflict: boolean; reason?: string }
  ): SyncPushResponse {
    const syncedIds: string[] = [];
    const conflicts: SyncPushResponse['conflicts'] = [];

    for (const record of records) {
      // 1. Idempotency check: If already processed this exact transaction, ack as synced without duplicate processing
      if (this.processedTransactionIds.has(record.clientTransactionId)) {
        syncedIds.push(record.id);
        continue;
      }

      // 2. Conflict verification
      if (checkEntityConflict) {
        const conflictCheck = checkEntityConflict(record);
        if (conflictCheck.hasConflict) {
          conflicts.push({
            recordId: record.id,
            entityId: record.entityId,
            reason: conflictCheck.reason || 'Conflict detected with server state',
            resolution: record.entityType === 'INVOICE' ? 'CLIENT_ACCEPTED' : 'SERVER_KEPT'
          });
          // Invoices are append-only legal transactions: always accept invoice records into ledger
          if (record.entityType === 'INVOICE') {
            this.processedTransactionIds.add(record.clientTransactionId);
            syncedIds.push(record.id);
          }
          continue;
        }
      }

      // 3. Mark processed
      this.processedTransactionIds.add(record.clientTransactionId);
      syncedIds.push(record.id);
    }

    return {
      syncedIds,
      conflicts,
      serverTimestamp: Date.now()
    };
  }
}

export * from './indexeddb-queue';

