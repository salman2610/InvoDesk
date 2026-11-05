import * as crypto from 'node:crypto';
import { LocalDatabase } from './local-db.js';
import { OutboxQueueRequest, OutboxRecord } from './ipc-channels.js';

export class OutboxManager {
  private localDb: LocalDatabase;

  constructor(localDb: LocalDatabase) {
    this.localDb = localDb;
  }

  /**
   * Generates a provisional receipt ID for offline checkout.
   * Example: PROV/BLR-01/26-27/T1-0001
   */
  public generateProvisionalId(branchCode: string, financialYear: string, terminalId: string): string {
    return this.localDb.getNextProvisionalNumber(branchCode, financialYear, terminalId);
  }

  /**
   * Queues a transaction into local SQLite outbox.
   */
  public queueTransaction(request: OutboxQueueRequest): OutboxRecord {
    const transactionId = crypto.randomUUID();
    let provisionalId = request.payload?.provisionalId;

    if (request.entityType === 'INVOICE' && !provisionalId) {
      const branchCode = request.branchCode || this.localDb.getConfig('branchCode') || 'DEF';
      const financialYear = request.financialYear || this.localDb.getConfig('financialYear') || '26-27';
      const terminalId = request.terminalId || this.localDb.getConfig('terminalId') || 'T1';

      provisionalId = this.generateProvisionalId(branchCode, financialYear, terminalId);
      if (typeof request.payload === 'object' && request.payload !== null) {
        request.payload.provisionalId = provisionalId;
        if (!request.payload.invoiceNumber) {
          request.payload.invoiceNumber = provisionalId;
        }
        if (!request.payload.id) {
          request.payload.id = transactionId;
        }
      }
    }

    return this.localDb.queueOutboxItem({
      id: transactionId,
      provisionalId,
      entityType: request.entityType,
      action: request.action,
      payload: request.payload
    });
  }

  public getPendingTransactions(limit: number = 50): OutboxRecord[] {
    return this.localDb.getPendingOutbox(limit);
  }

  public getAllTransactions(limit: number = 100): OutboxRecord[] {
    return this.localDb.getAllOutbox(limit);
  }

  public markSynced(id: string): void {
    this.localDb.markOutboxSynced(id);
  }

  public markFailed(id: string, error: string): void {
    this.localDb.markOutboxFailed(id, error);
  }

  public retryFailed(): number {
    return this.localDb.retryFailedOutbox();
  }

  public getStats() {
    return this.localDb.getOutboxCounts();
  }
}
