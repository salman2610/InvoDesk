import { SyncRecord, SyncPushResponse } from '@invodesk/types';

export interface QueuedSyncItem extends SyncRecord {
  retryCount: number;
  lastAttemptAt?: number;
  nextRetryAt?: number;
  lastError?: string;
}

const DB_NAME = 'invodesk_offline_store';
const DB_VERSION = 1;
const STORE_QUEUE = 'sync_queue';
const STORE_LOCAL_INVOICES = 'offline_invoices';

/**
 * Robust, browser-native IndexedDB queue for durable offline transaction storage.
 * Survived browser restarts, tab crashes, and intermittent network loss.
 */
export class IndexedDBSyncQueue {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.initDB();
    }
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return reject(new Error('IndexedDB not supported in current environment'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_QUEUE)) {
          const queueStore = db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
          queueStore.createIndex('by_timestamp', 'clientTimestamp', { unique: false });
          queueStore.createIndex('by_status', 'status', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_LOCAL_INVOICES)) {
          db.createObjectStore(STORE_LOCAL_INVOICES, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Durably enqueue an offline transaction into IndexedDB
   */
  public async enqueue(record: SyncRecord): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_QUEUE], 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      const item: QueuedSyncItem = {
        ...record,
        retryCount: 0,
        status: 'PENDING'
      };
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieve all pending sync items ready for dispatch
   */
  public async getPending(): Promise<QueuedSyncItem[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_QUEUE], 'readonly');
      const store = tx.objectStore(STORE_QUEUE);
      const req = store.getAll();

      req.onsuccess = () => {
        const now = Date.now();
        const items = (req.result as QueuedSyncItem[])
          .filter(item => item.status === 'PENDING' && (!item.nextRetryAt || item.nextRetryAt <= now))
          .sort((a, b) => a.clientTimestamp - b.clientTimestamp);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Remove successfully synchronized records from the queue
   */
  public async acknowledgeSynced(recordIds: string[]): Promise<void> {
    if (!recordIds.length) return;
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_QUEUE], 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);

      for (const id of recordIds) {
        store.delete(id);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Update item with exponential backoff on network failure
   */
  public async recordFailure(recordId: string, errorMsg: string): Promise<void> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_QUEUE], 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      const getReq = store.get(recordId);

      getReq.onsuccess = () => {
        const item = getReq.result as QueuedSyncItem | undefined;
        if (!item) return resolve();

        const retryCount = item.retryCount + 1;
        // Exponential backoff: 2s, 4s, 8s, 16s, max 60s
        const backoffMs = Math.min(60000, Math.pow(2, retryCount) * 1000);

        item.retryCount = retryCount;
        item.lastAttemptAt = Date.now();
        item.nextRetryAt = Date.now() + backoffMs;
        item.lastError = errorMsg;

        store.put(item);
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Sync runner: Tries Background Sync API if supported; otherwise uses foreground fallback
   */
  public async syncWithServer(
    apiEndpoint: string,
    authToken: string,
    branchId: string
  ): Promise<SyncPushResponse | null> {
    const pending = await this.getPending();
    if (!pending.length) return null;

    try {
      // Check if Background Sync is available (Service Worker)
      if (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'SyncManager' in window
      ) {
        try {
          const reg = await navigator.serviceWorker.ready;
          await (reg as any).sync.register('invodesk-sync');
        } catch {
          // Fall back gracefully to foreground sync
        }
      }

      // Foreground Sync Fallback execution
      const payload = {
        branchId,
        records: pending.map(({ retryCount, lastAttemptAt, nextRetryAt, lastError, ...rec }) => rec)
      };

      const response = await fetch(`${apiEndpoint}/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Sync failed with status ${response.status}: ${text}`);
      }

      const result: SyncPushResponse = await response.json();
      await this.acknowledgeSynced(result.syncedIds);

      return result;
    } catch (err: any) {
      // Record failure for all attempted items
      for (const item of pending) {
        await this.recordFailure(item.id, err.message || 'Network error');
      }
      throw err;
    }
  }
}
