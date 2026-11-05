import { LocalDatabase } from './local-db.js';
import { OutboxManager } from './outbox-manager.js';
import { SyncEngineStatus, DesktopConfig, OutboxRecord } from './ipc-channels.js';

export class SyncEngine {
  private localDb: LocalDatabase;
  private outboxManager: OutboxManager;
  private timer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private isOnline = false;
  private lastSyncedAt?: string;
  private lastError?: string;
  private authToken?: string;

  constructor(localDb: LocalDatabase, outboxManager: OutboxManager) {
    this.localDb = localDb;
    this.outboxManager = outboxManager;
  }

  public setAuthToken(token: string): void {
    this.authToken = token;
  }

  public getStatus(): SyncEngineStatus {
    const counts = this.localDb.getOutboxCounts();
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: counts.pending,
      failedCount: counts.failed,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError
    };
  }

  public start(intervalMs?: number): void {
    const config = this.getConfig();
    const interval = intervalMs || config.autoSyncIntervalMs || 10000;

    if (this.timer) {
      clearInterval(this.timer);
    }

    // Run first sync attempt after short delay
    setTimeout(() => {
      this.syncNow().catch(() => {});
    }, 1000);

    this.timer = setInterval(() => {
      this.syncNow().catch(() => {});
    }, interval);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async checkHealth(): Promise<boolean> {
    const config = this.getConfig();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${config.apiUrl}/api/health`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      this.isOnline = res.ok;
      return res.ok;
    } catch {
      this.isOnline = false;
      return false;
    }
  }

  /**
   * Performs a complete bidirectional synchronization cycle:
   * 1. Drain pending outbox records to /api/sync/push
   * 2. Pull updated product catalog & customers via /api/sync/pull
   */
  public async syncNow(): Promise<{ pushed: number; pulledProducts: number; success: boolean; error?: string }> {
    if (this.isSyncing) {
      return { pushed: 0, pulledProducts: 0, success: false, error: 'Sync already in progress' };
    }

    this.isSyncing = true;
    let pushedCount = 0;
    let pulledProductsCount = 0;

    try {
      const online = await this.checkHealth();
      if (!online) {
        this.lastError = 'Server unreachable';
        return { pushed: 0, pulledProducts: 0, success: false, error: 'Server unreachable' };
      }

      const config = this.getConfig();
      const token = this.authToken || this.localDb.getConfig('authToken');

      // 1. Push pending outbox
      const pending = this.outboxManager.getPendingTransactions(50);
      if (pending.length > 0 && token) {
        const recordsToPush = pending.map((rec: OutboxRecord) => {
          let payloadObj: any;
          try {
            payloadObj = JSON.parse(rec.payload);
          } catch {
            payloadObj = rec.payload;
          }

          if (rec.entityType === 'INVOICE' && typeof payloadObj === 'object' && payloadObj !== null) {
            if (!payloadObj.id) payloadObj.id = rec.id;
            if (!payloadObj.invoiceNumber) payloadObj.invoiceNumber = rec.provisionalId || `PROV-${rec.id.slice(0, 8)}`;
            if (!payloadObj.placeOfSupplyStateCode) payloadObj.placeOfSupplyStateCode = '27';
            if (payloadObj.isInterState === undefined) payloadObj.isInterState = false;
            if (!payloadObj.items) payloadObj.items = [];
          }

          return {
            id: rec.id,
            clientTransactionId: rec.id,
            branchId: config.branchId,
            entityType: rec.entityType,
            operation: rec.action,
            entityId: payloadObj?.id || rec.provisionalId || rec.id,
            payload: payloadObj,
            clientTimestamp: new Date(rec.createdAt).getTime()
          };
        });

        const pushRes = await fetch(`${config.apiUrl}/api/sync/push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ records: recordsToPush })
        });

        if (pushRes.ok) {
          const pushData = await pushRes.json() as { syncedIds?: string[] };
          const syncedIds = pushData.syncedIds || [];
          for (const id of syncedIds) {
            this.outboxManager.markSynced(id);
            pushedCount++;
          }
        } else {
          const errText = await pushRes.text();
          for (const rec of pending) {
            this.outboxManager.markFailed(rec.id, `Push HTTP ${pushRes.status}: ${errText.slice(0, 100)}`);
          }
        }
      }

      // 2. Pull catalog and cache locally
      if (token) {
        const pullRes = await fetch(`${config.apiUrl}/api/sync/pull`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (pullRes.ok) {
          const pullData = await pullRes.json() as { products?: any[] };
          if (pullData.products && Array.isArray(pullData.products)) {
            const formatted = pullData.products.map(p => ({
              id: p.id,
              sku: p.sku,
              name: p.name,
              barcode: p.barcode,
              hsnCode: p.hsnCode,
              price: Number(p.sellingPrice || p.price || 0),
              gstRate: Number(p.gstRate || 0),
              stock: Number(p.currentStock || p.stock || 0)
            }));
            this.localDb.cacheProducts(formatted);
            pulledProductsCount = formatted.length;
          }
        }
      }

      this.lastSyncedAt = new Date().toISOString();
      this.lastError = undefined;
      return { pushed: pushedCount, pulledProducts: pulledProductsCount, success: true };
    } catch (err: any) {
      this.lastError = err.message;
      return { pushed: pushedCount, pulledProducts: pulledProductsCount, success: false, error: err.message };
    } finally {
      this.isSyncing = false;
    }
  }

  private getConfig(): DesktopConfig {
    const all = this.localDb.getAllConfig();
    return {
      apiUrl: all.apiUrl || 'http://localhost:4000',
      branchCode: all.branchCode || 'PUN-01',
      branchId: all.branchId || 'default-branch',
      terminalId: all.terminalId || 'T1',
      financialYear: all.financialYear || '26-27',
      printerType: (all.printerType as any) || 'simulated',
      printerAddress: all.printerAddress || '',
      printerPaperWidth: (all.printerPaperWidth as any) || '80mm',
      cashDrawerPin: all.cashDrawerPin ? parseInt(all.cashDrawerPin, 10) : 0,
      autoSyncIntervalMs: all.autoSyncIntervalMs ? parseInt(all.autoSyncIntervalMs, 10) : 10000,
    };
  }
}
