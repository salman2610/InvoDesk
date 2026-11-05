import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { LocalDatabase } from '../apps/desktop/src/local-db.js';
import { OutboxManager } from '../apps/desktop/src/outbox-manager.js';
import { HardwareBridge } from '../apps/desktop/src/hardware-bridge.js';
import { SyncEngine } from '../apps/desktop/src/sync-engine.js';
import { IPC_CHANNELS } from '../apps/desktop/src/ipc-channels.js';

const TEST_DB_PATH = path.join(process.cwd(), 'tests', 'temp_test_desktop.db');
const BASE_URL = 'http://localhost:4000/api';

describe('InvoDesk Phase 5: Native Electron Desktop POS & Offline Engine', () => {
  let localDb: LocalDatabase;
  let outboxManager: OutboxManager;
  let hardwareBridge: HardwareBridge;
  let syncEngine: SyncEngine;
  let cashierToken = '';
  let serverProductId = 'prod_local_1';

  beforeAll(async () => {
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }

    localDb = new LocalDatabase(TEST_DB_PATH);
    outboxManager = new OutboxManager(localDb);
    hardwareBridge = new HardwareBridge(localDb);
    syncEngine = new SyncEngine(localDb, outboxManager);

    // Setup base config in local DB
    localDb.setConfig('apiUrl', 'http://localhost:4000');
    localDb.setConfig('branchCode', 'PUN-01');
    localDb.setConfig('branchId', 'branch_pune_main');
    localDb.setConfig('terminalId', 'T1');
    localDb.setConfig('financialYear', '26-27');
    localDb.setConfig('printerType', 'simulated');

    // Authenticate with server to get sync token
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cashier@apexretail.in', password: 'cashier123' })
    });
    const loginData = await loginRes.json();
    cashierToken = loginData.token;
    syncEngine.setAuthToken(cashierToken);
    localDb.setConfig('authToken', cashierToken);

    const prodRes = await fetch(`${BASE_URL}/products`, {
      headers: { Authorization: `Bearer ${cashierToken}` }
    });
    const prodData = await prodRes.json();
    if (prodData.products && prodData.products.length > 0) {
      serverProductId = prodData.products[0].id;
    }
  });

  afterAll(() => {
    syncEngine.stop();
    localDb.close();
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch {}
    }
  });

  // --- 1. Local SQLite Storage & Provisional Numbering ---
  describe('Local SQLite Storage & Offline Sequential Sequencing', () => {
    it('generates strictly sequential provisional invoice numbers without collisions', () => {
      const num1 = outboxManager.generateProvisionalId('PUN-01', '26-27', 'T1');
      const num2 = outboxManager.generateProvisionalId('PUN-01', '26-27', 'T1');
      const num3 = outboxManager.generateProvisionalId('PUN-01', '26-27', 'T1');

      expect(num1).toBe('PROV/PUN-01/26-27/T1-0001');
      expect(num2).toBe('PROV/PUN-01/26-27/T1-0002');
      expect(num3).toBe('PROV/PUN-01/26-27/T1-0003');
    });

    it('isolates sequence spaces across different terminals', () => {
      const t1Num = outboxManager.generateProvisionalId('PUN-01', '26-27', 'T1');
      const t2Num = outboxManager.generateProvisionalId('PUN-01', '26-27', 'T2');

      expect(t1Num).toBe('PROV/PUN-01/26-27/T1-0004');
      expect(t2Num).toBe('PROV/PUN-01/26-27/T2-0001');
    });

    it('persists and retrieves local configuration settings', () => {
      localDb.setConfig('kioskEnabled', 'true');
      expect(localDb.getConfig('kioskEnabled')).toBe('true');
      expect(localDb.getConfig('nonExistentKey')).toBeNull();
    });

    it('caches product catalog and performs rapid barcode lookup', () => {
      localDb.cacheProducts([
        {
          id: 'prod_local_1',
          name: 'Amul Butter 500g',
          sku: 'AMUL-BUTTER-500',
          barcode: '8901262010053',
          hsnCode: '0405',
          price: 275.0,
          gstRate: 12.0,
          stock: 40
        },
        {
          id: 'prod_local_2',
          name: 'Tata Salt 1kg',
          sku: 'TATA-SALT-1KG',
          barcode: '8901030383842',
          hsnCode: '2501',
          price: 28.0,
          gstRate: 0.0,
          stock: 150
        }
      ]);

      const found = localDb.findProductByBarcode('8901262010053');
      expect(found).toBeDefined();
      expect(found.name).toBe('Amul Butter 500g');
      expect(found.price).toBe(275.0);
      expect(found.stock).toBe(40);

      const notFound = localDb.findProductByBarcode('0000000000000');
      expect(notFound).toBeUndefined();
    });
  });

  // --- 2. Offline Outbox Queue & Status Transitions ---
  describe('Offline Outbox Queue Management & State Transitions', () => {
    let queuedInvoiceId: string;

    it('enqueues offline transactions and assigns provisional receipt numbers automatically', () => {
      const record = outboxManager.queueTransaction({
        entityType: 'INVOICE',
        action: 'CREATE',
        payload: {
          customerName: 'Offline Walk-in Customer',
          subTotal: 550,
          totalTax: 66,
          grandTotal: 616,
          paidAmount: 616,
          paymentStatus: 'PAID',
          items: [
            {
              productId: serverProductId,
              name: 'Amul Butter 500g',
              sku: 'AMUL-BUTTER-500',
              quantity: 2,
              unitPrice: 275,
              totalAmount: 616
            }
          ]
        }
      });

      expect(record.id).toBeDefined();
      expect(record.provisionalId).toMatch(/^PROV\/PUN-01\/26-27\/T1-\d{4}$/);
      expect(record.status).toBe('PENDING');
      expect(record.retryCount).toBe(0);

      queuedInvoiceId = record.id;
    });

    it('queries pending transactions with limit and order', () => {
      const pending = outboxManager.getPendingTransactions(10);
      expect(pending.length).toBeGreaterThanOrEqual(1);
      const found = pending.find(r => r.id === queuedInvoiceId);
      expect(found).toBeDefined();
      expect(found?.status).toBe('PENDING');
    });

    it('tracks outbox statistics (pending, synced, failed)', () => {
      const stats = outboxManager.getStats();
      expect(stats.pending).toBeGreaterThanOrEqual(1);
      expect(stats.synced).toBe(0);
      expect(stats.failed).toBe(0);
    });

    it('transitions outbox records through failed and retry states', () => {
      outboxManager.markFailed(queuedInvoiceId, 'Simulated network timeout');

      let stats = outboxManager.getStats();
      expect(stats.failed).toBeGreaterThanOrEqual(1);

      const pendingAfterFail = outboxManager.getPendingTransactions(10);
      expect(pendingAfterFail.find(r => r.id === queuedInvoiceId)).toBeUndefined();

      // Retry failed items
      const resetCount = outboxManager.retryFailed();
      expect(resetCount).toBeGreaterThanOrEqual(1);

      stats = outboxManager.getStats();
      expect(stats.failed).toBe(0);
      expect(stats.pending).toBeGreaterThanOrEqual(1);
    });
  });

  // --- 3. Hardware Bridge & Peripherals ---
  describe('Hardware Bridge: ESC/POS Thermal Printing, Drawers & Scanners', () => {
    it('dispatches thermal receipt print jobs to simulated printer', async () => {
      const printResult = await hardwareBridge.printReceipt({
        receiptData: {
          id: 'test_inv_001',
          invoiceNumber: 'INV/PUN-01/26-27/9999',
          createdAt: new Date().toISOString(),
          customerName: 'Hardware Test Customer',
          subTotal: 500,
          totalDiscount: 0,
          taxableAmount: 500,
          totalCgst: 45,
          totalSgst: 45,
          totalIgst: 0,
          totalCess: 0,
          totalTax: 90,
          roundOff: 0,
          grandTotal: 590,
          paidAmount: 590,
          balanceAmount: 0,
          paymentStatus: 'PAID',
          payments: [{ id: 'p1', mode: 'CASH', amount: 590, paidAt: new Date().toISOString() }],
          items: [
            {
              id: 'it1',
              productId: 'prod1',
              name: 'Sample Retail Product',
              sku: 'PROD-01',
              hsnCode: '9983',
              unit: 'PCS',
              quantity: 1,
              unitPrice: 500,
              discountPercent: 0,
              discountAmount: 0,
              taxableAmount: 500,
              gstRate: 18,
              isInterState: false,
              cgstRate: 9,
              cgstAmount: 45,
              sgstRate: 9,
              sgstAmount: 45,
              igstRate: 0,
              igstAmount: 0,
              cessAmount: 0,
              totalAmount: 590
            }
          ]
        },
        paperWidth: '80mm',
        cutPaper: true
      });

      expect(printResult.success).toBe(true);
      expect(printResult.bytesPrinted).toBeGreaterThan(50);

      const printedJobs = hardwareBridge.getSimulatedPrinter().getPrintedJobs();
      expect(printedJobs.length).toBeGreaterThanOrEqual(1);
    });

    it('executes cash drawer kick pulse command', async () => {
      const drawer = hardwareBridge.getSimulatedDrawer();
      expect(await drawer.isOpen()).toBe(false);

      const kickRes = await hardwareBridge.kickCashDrawer(0);
      expect(kickRes.success).toBe(true);
      expect(await drawer.isOpen()).toBe(true);

      drawer.close();
      expect(await drawer.isOpen()).toBe(false);
    });

    it('handles barcode scanner input and cross-references local product catalog', () => {
      const scanResult = hardwareBridge.handleBarcodeScanned('8901262010053');
      expect(scanResult.barcode).toBe('8901262010053');
      expect(scanResult.product).toBeDefined();
      expect(scanResult.product.name).toBe('Amul Butter 500g');
    });

    it('generates a comprehensive hardware diagnostics report', async () => {
      const diag = await hardwareBridge.getDiagnostics();
      expect(diag.printer.status).toBe('ONLINE');
      expect(diag.printer.type).toBe('simulated');
      expect(diag.cashDrawer.connected).toBe(true);
      expect(diag.barcodeScanner.active).toBe(true);
      expect(diag.barcodeScanner.lastScannedBarcode).toBe('8901262010053');
      expect(diag.localDb.status).toBe('CONNECTED');
    });
  });

  // --- 4. Synchronization Engine: Cloud Drain & Pull ---
  describe('Synchronization Engine: Bidirectional Cloud Replication', () => {
    it('verifies central server health via /api/health', async () => {
      const isOnline = await syncEngine.checkHealth();
      expect(isOnline).toBe(true);
    });

    it('drains local outbox transactions to central cloud /api/sync/push', async () => {
      // Ensure we have an item to sync
      outboxManager.queueTransaction({
        entityType: 'INVOICE',
        action: 'CREATE',
        payload: {
          customerName: 'Sync Test Customer',
          subTotal: 100,
          totalDiscount: 0,
          taxableAmount: 100,
          totalCgst: 9,
          totalSgst: 9,
          totalIgst: 0,
          totalCess: 0,
          totalTax: 18,
          roundOff: 0,
          grandTotal: 118,
          paidAmount: 118,
          balanceAmount: 0,
          paymentStatus: 'PAID',
          placeOfSupplyStateCode: '27',
          isInterState: false,
          items: []
        }
      });

      const initialPending = outboxManager.getStats().pending;
      expect(initialPending).toBeGreaterThanOrEqual(1);

      const syncResult = await syncEngine.syncNow();
      expect(syncResult.success).toBe(true);
      expect(syncResult.pushed).toBeGreaterThanOrEqual(1);

      const statsAfterSync = outboxManager.getStats();
      expect(statsAfterSync.pending).toBe(0);
      expect(statsAfterSync.synced).toBeGreaterThanOrEqual(1);
    });

    it('pulls cloud product updates into local cache via /api/sync/pull', async () => {
      const syncResult = await syncEngine.syncNow();
      expect(syncResult.success).toBe(true);
      expect(syncResult.pulledProducts).toBeGreaterThanOrEqual(1);

      const status = syncEngine.getStatus();
      expect(status.isOnline).toBe(true);
      expect(status.isSyncing).toBe(false);
      expect(status.pendingCount).toBe(0);
      expect(status.lastSyncedAt).toBeDefined();
    });
  });

  // --- 5. Security & IPC Channel Whitelist ---
  describe('Security & Type-Safe IPC Channel Whitelist', () => {
    it('validates that all critical POS operations have distinct whitelisted IPC channels', () => {
      expect(IPC_CHANNELS.PRINTER_PRINT).toBe('invodesk:printer:print');
      expect(IPC_CHANNELS.DRAWER_KICK).toBe('invodesk:drawer:kick');
      expect(IPC_CHANNELS.OUTBOX_QUEUE).toBe('invodesk:outbox:queue');
      expect(IPC_CHANNELS.OUTBOX_DRAIN).toBe('invodesk:outbox:drain');
      expect(IPC_CHANNELS.SYNC_STATUS).toBe('invodesk:sync:status');
      expect(IPC_CHANNELS.KIOSK_TOGGLE).toBe('invodesk:window:kiosk-toggle');
      expect(IPC_CHANNELS.HARDWARE_DIAGNOSTICS).toBe('invodesk:hardware:diagnostics');
      expect(IPC_CHANNELS.DB_BACKUP).toBe('invodesk:db:backup');
      expect(IPC_CHANNELS.DB_RESTORE).toBe('invodesk:db:restore');
      expect(IPC_CHANNELS.DB_INTEGRITY).toBe('invodesk:db:integrity');
    });
  });

  // --- 6. SQLite WAL Journal Mode, Online Backup & Disaster Recovery ---
  describe('SQLite WAL Journal Mode, Online Backup & Disaster Recovery', () => {
    const BACKUP_PATH = path.join(process.cwd(), 'tests', 'temp_test_backup.db');
    const RESTORE_TEST_DB_PATH = path.join(process.cwd(), 'tests', 'temp_test_restored.db');

    afterAll(() => {
      const filesToClean = [
        BACKUP_PATH,
        `${BACKUP_PATH}-wal`,
        `${BACKUP_PATH}-shm`,
        RESTORE_TEST_DB_PATH,
        `${RESTORE_TEST_DB_PATH}-wal`,
        `${RESTORE_TEST_DB_PATH}-shm`
      ];
      for (const f of filesToClean) {
        if (fs.existsSync(f)) {
          try { fs.unlinkSync(f); } catch {}
        }
      }
    });

    it('verifies that SQLite operates in WAL journal mode with integrity check passing', () => {
      const journalMode = localDb.getJournalMode();
      if (localDb.isNativeNodeSqlite()) {
        expect(journalMode.toLowerCase()).toBe('wal');
      } else {
        expect(['wal', 'memory-file']).toContain(journalMode);
      }

      const integrity = localDb.checkIntegrity();
      expect(integrity.healthy).toBe(true);
      expect(integrity.details[0]).toBe('ok');
    });

    it('creates an online backup (VACUUM INTO) while the POS is active', () => {
      // Enqueue a fresh transaction right before backup
      outboxManager.queueTransaction({
        entityType: 'INVOICE',
        action: 'CREATE',
        payload: {
          customerName: 'Pre-Backup Customer',
          grandTotal: 500,
          paymentStatus: 'PAID',
          placeOfSupplyStateCode: '27',
          isInterState: false,
          items: []
        }
      });

      const backupResult = localDb.createBackup(BACKUP_PATH);
      expect(backupResult.success).toBe(true);
      expect(fs.existsSync(BACKUP_PATH)).toBe(true);
      expect(backupResult.bytesWritten).toBeGreaterThan(0);

      // Verify backup file mode is restricted to current user (0600)
      const stats = fs.statSync(BACKUP_PATH);
      const mode = stats.mode & 0o777;
      expect(mode).toBe(0o600);
    });

    it('restores backup into a clean installation and recovers all transactions and config', () => {
      if (fs.existsSync(RESTORE_TEST_DB_PATH)) {
        try { fs.unlinkSync(RESTORE_TEST_DB_PATH); } catch {}
      }

      // Initialize clean database
      const cleanDb = new LocalDatabase(RESTORE_TEST_DB_PATH);
      const cleanOutbox = new OutboxManager(cleanDb);

      // Initial state is empty
      expect(cleanOutbox.getStats().pending).toBe(0);

      // Restore from the online backup
      const restoreResult = cleanDb.restoreFromBackup(BACKUP_PATH);
      expect(restoreResult.success).toBe(true);

      // Verify restored records
      const restoredOutbox = new OutboxManager(cleanDb);
      const restoredStats = restoredOutbox.getStats();
      expect(restoredStats.pending + restoredStats.synced).toBeGreaterThanOrEqual(1);

      // Verify config was restored
      expect(cleanDb.getConfig('branchCode')).toBe('PUN-01');
      expect(cleanDb.getConfig('terminalId')).toBe('T1');

      // Verify integrity of the restored database
      const postRestoreIntegrity = cleanDb.checkIntegrity();
      expect(postRestoreIntegrity.healthy).toBe(true);

      cleanDb.close();
    });

    it('recovers uncheckpointed WAL transactions upon reopening', () => {
      const walTestPath = path.join(process.cwd(), 'tests', 'temp_wal_recovery.db');
      if (fs.existsSync(walTestPath)) {
        try { fs.unlinkSync(walTestPath); } catch {}
      }

      try {
        // Step 1: Open DB, write record into WAL
        const db1 = new LocalDatabase(walTestPath);
        const outbox1 = new OutboxManager(db1);
        const tx = outbox1.queueTransaction({
          entityType: 'INVOICE',
          action: 'CREATE',
          payload: { customerName: 'WAL Recovery Customer', grandTotal: 999 }
        });
        expect(tx.id).toBeDefined();

        // Step 2: Simulate process crash without explicit checkpoint/close
        // Reopen DB instance from the same path
        const db2 = new LocalDatabase(walTestPath);
        const outbox2 = new OutboxManager(db2);
        const pending = outbox2.getPendingTransactions();
        const found = pending.find(r => r.id === tx.id);
        expect(found).toBeDefined();
        expect(found?.entityType).toBe('INVOICE');

        db2.close();
      } finally {
        for (const ext of ['', '-wal', '-shm']) {
          const f = `${walTestPath}${ext}`;
          if (fs.existsSync(f)) {
            try { fs.unlinkSync(f); } catch {}
          }
        }
      }
    });

    it('prevents duplicate transactions when syncing after database restoration (Server Idempotency)', async () => {
      // 1. Sync pending transactions
      const syncResult = await syncEngine.syncNow();
      expect(syncResult.success).toBe(true);

      // 2. Take backup after transactions are marked SYNCED
      const postSyncBackup = path.join(process.cwd(), 'tests', 'temp_postsync_backup.db');
      localDb.createBackup(postSyncBackup);

      // 3. Restore older backup which had transactions in PENDING state
      localDb.restoreFromBackup(BACKUP_PATH);

      // 4. Trigger sync again from the restored database
      const resyncResult = await syncEngine.syncNow();
      expect(resyncResult.success).toBe(true);

      // Central backend should detect already-synced transaction IDs and skip duplicates idempotently
      const stats = outboxManager.getStats();
      expect(stats.failed).toBe(0);

      if (fs.existsSync(postSyncBackup)) {
        try { fs.unlinkSync(postSyncBackup); } catch {}
      }
    });
  });
});
