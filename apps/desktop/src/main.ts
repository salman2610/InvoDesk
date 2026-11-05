import { app, BrowserWindow, ipcMain, session } from 'electron';
import * as path from 'node:path';
import { IPC_CHANNELS, OutboxQueueRequest } from './ipc-channels.js';
import { LocalDatabase } from './local-db.js';
import { OutboxManager } from './outbox-manager.js';
import { HardwareBridge } from './hardware-bridge.js';
import { SyncEngine } from './sync-engine.js';
import { LicenseGuard, OFFICIAL_SUPPORT } from './license-guard.js';

let mainWindow: BrowserWindow | null = null;
let localDb: LocalDatabase;
let outboxManager: OutboxManager;
let hardwareBridge: HardwareBridge;
let syncEngine: SyncEngine;
let licenseGuard: LicenseGuard;

function initCoreServices() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'invodesk_local.db');
  
  licenseGuard = new LicenseGuard(userDataPath);
  localDb = new LocalDatabase(dbPath);
  outboxManager = new OutboxManager(localDb);
  hardwareBridge = new HardwareBridge(localDb);
  syncEngine = new SyncEngine(localDb, outboxManager);

  // Set default config if empty
  if (!localDb.getConfig('apiUrl')) {
    localDb.setConfig('apiUrl', process.env.API_URL || 'http://localhost:4000');
  }
  if (!localDb.getConfig('branchCode')) {
    localDb.setConfig('branchCode', 'PUN-01');
  }
  if (!localDb.getConfig('terminalId')) {
    localDb.setConfig('terminalId', 'T1');
  }
  if (!localDb.getConfig('financialYear')) {
    localDb.setConfig('financialYear', '26-27');
  }
  if (!localDb.getConfig('printerType')) {
    localDb.setConfig('printerType', 'simulated');
  }

  // Start background sync
  syncEngine.start();
}

const ALLOWED_CONFIG_KEYS = new Set([
  'apiUrl',
  'branchCode',
  'branchId',
  'terminalId',
  'financialYear',
  'printerType',
  'printerAddress',
  'printerPaperWidth',
  'cashDrawerPin',
  'autoSyncIntervalMs',
  'authToken'
]);

function registerIpcHandlers() {
  // Printing & Hardware with payload validation
  ipcMain.handle(IPC_CHANNELS.PRINTER_PRINT, async (_event, payload) => {
    if (!payload || typeof payload !== 'object') {
      return { success: false, error: 'Invalid print payload: expected non-null object' };
    }
    return hardwareBridge.printReceipt(payload);
  });

  ipcMain.handle(IPC_CHANNELS.PRINTER_STATUS, async () => {
    const diag = await hardwareBridge.getDiagnostics();
    return diag.printer;
  });

  ipcMain.handle(IPC_CHANNELS.PRINTER_DISCOVER, async () => {
    return [
      { name: 'Simulated ESC/POS 80mm', type: 'simulated', address: 'local' },
      { name: 'Network ESC/POS (TCP 9100)', type: 'network', address: '192.168.1.200:9100' },
      { name: 'USB POS-80 Thermal', type: 'usb', address: '/dev/usb/lp0' }
    ];
  });

  ipcMain.handle(IPC_CHANNELS.DRAWER_KICK, async (_event, pin) => {
    const validatedPin = typeof pin === 'number' && (pin === 0 || pin === 1) ? pin : 0;
    return hardwareBridge.kickCashDrawer(validatedPin);
  });

  ipcMain.handle(IPC_CHANNELS.SCANNER_INPUT, async (_event, barcode: string) => {
    if (typeof barcode !== 'string' || barcode.length === 0 || barcode.length > 128) {
      throw new Error('Invalid barcode input: expected string length between 1 and 128 characters');
    }
    const sanitized = barcode.trim();
    const result = hardwareBridge.handleBarcodeScanned(sanitized);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('invodesk:scanner:scanned', result);
    }
    return result;
  });

  ipcMain.handle(IPC_CHANNELS.HARDWARE_DIAGNOSTICS, async () => {
    return hardwareBridge.getDiagnostics();
  });

  // Outbox & Sync with validation
  ipcMain.handle(IPC_CHANNELS.OUTBOX_QUEUE, async (_event, request: OutboxQueueRequest) => {
    if (!request || typeof request !== 'object') {
      throw new Error('Invalid outbox request: expected non-null object');
    }
    const allowedEntityTypes = ['INVOICE', 'PAYMENT', 'CUSTOMER', 'SHIFT_LOG'];
    const allowedActions = ['CREATE', 'UPDATE', 'CANCEL'];
    if (!allowedEntityTypes.includes(request.entityType)) {
      throw new Error(`Unauthorized entityType: ${request.entityType}`);
    }
    if (!allowedActions.includes(request.action)) {
      throw new Error(`Unauthorized action: ${request.action}`);
    }
    if (request.payload === undefined || request.payload === null) {
      throw new Error('Outbox payload is required');
    }
    return outboxManager.queueTransaction(request);
  });

  ipcMain.handle(IPC_CHANNELS.OUTBOX_LIST, async (_event, limit: number) => {
    const safeLimit = typeof limit === 'number' && limit > 0 ? Math.min(limit, 500) : 50;
    return outboxManager.getAllTransactions(safeLimit);
  });

  ipcMain.handle(IPC_CHANNELS.OUTBOX_COUNT, async () => {
    return outboxManager.getStats();
  });

  ipcMain.handle(IPC_CHANNELS.OUTBOX_DRAIN, async () => {
    return syncEngine.syncNow();
  });

  ipcMain.handle(IPC_CHANNELS.OUTBOX_CLEAR_FAILED, async () => {
    return outboxManager.retryFailed();
  });

  ipcMain.handle(IPC_CHANNELS.SYNC_STATUS, async () => {
    return syncEngine.getStatus();
  });

  ipcMain.handle(IPC_CHANNELS.SYNC_TRIGGER, async () => {
    const result = await syncEngine.syncNow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('invodesk:sync:updated', syncEngine.getStatus());
    }
    return result;
  });

  // Kiosk & Window Management
  ipcMain.handle(IPC_CHANNELS.KIOSK_TOGGLE, async () => {
    if (!mainWindow) return false;
    const isKiosk = mainWindow.isKiosk();
    mainWindow.setKiosk(!isKiosk);
    return !isKiosk;
  });

  ipcMain.handle(IPC_CHANNELS.KIOSK_STATUS, async () => {
    return mainWindow ? mainWindow.isKiosk() : false;
  });

  // Database Online Backup, Recovery & Integrity
  ipcMain.handle(IPC_CHANNELS.DB_BACKUP, async (_event, targetPath?: string) => {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    const finalPath = targetPath && typeof targetPath === 'string' && !targetPath.includes('..')
      ? path.resolve(targetPath)
      : path.join(backupDir, `invodesk_backup_${Date.now()}.db`);
    return localDb.createBackup(finalPath);
  });

  ipcMain.handle(IPC_CHANNELS.DB_RESTORE, async (_event, backupPath: string) => {
    if (typeof backupPath !== 'string' || !backupPath.trim()) {
      throw new Error('Invalid backup path provided');
    }
    return localDb.restoreFromBackup(backupPath);
  });

  ipcMain.handle(IPC_CHANNELS.DB_INTEGRITY, async () => {
    return localDb.checkIntegrity();
  });

  // Config & Diagnostics with Whitelist Authorization
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, async (_event, key?: string) => {
    if (key) {
      if (typeof key !== 'string' || key.length > 64) {
        throw new Error('Invalid config key parameter');
      }
      return localDb.getConfig(key);
    }
    return localDb.getAllConfig();
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_SET, async (_event, key: string, value: string) => {
    if (typeof key !== 'string' || !ALLOWED_CONFIG_KEYS.has(key)) {
      throw new Error(`Unauthorized config key: ${key}`);
    }
    if (typeof value !== 'string' || value.length > 4096) {
      throw new Error('Config value must be a string with length <= 4096 bytes');
    }
    localDb.setConfig(key, value);
    if (key === 'authToken') {
      syncEngine.setAuthToken(value);
    }
  });

  ipcMain.handle(IPC_CHANNELS.APP_INFO, async () => {
    return {
      version: app.getVersion(),
      platform: process.platform,
      arch: process.arch,
      userData: app.getPath('userData'),
      dbPath: localDb.getPath(),
      journalMode: localDb.getJournalMode(),
      isNativeSqlite: localDb.isNativeNodeSqlite(),
      nodeVersion: process.versions.node,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      v8Version: process.versions.v8
    };
  });
}

function createWindow() {
  const iconPath = path.join(__dirname, '../build/icon.png');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'InvoDesk Retail POS Counter',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  // Safe navigation & popups
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      const allowedOrigin = new URL(process.env.POS_URL || 'http://localhost:3000').origin;
      const targetOrigin = new URL(navigationUrl).origin;
      if (targetOrigin !== allowedOrigin && !navigationUrl.startsWith('data:')) {
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });

  // DevTools shortcut (F12 or Ctrl+Shift+I)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) {
      mainWindow?.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  // Forward renderer console logs to main process stdout for diagnostics
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[POS Renderer Log - L${level}] ${message} (${sourceId}:${line})`);
  });

  // Security: Check 7-Day Commercial Pilot License & Anti-Tamper Guard
  const license = licenseGuard.checkLicense();
  if (!license.isTrialValid) {
    const expiredHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>InvoDesk - Trial License Expired</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #050B08; color: #F0FDF4; }
            .card { text-align: center; padding: 48px 40px; border-radius: 20px; background: #0E1F17; border: 2px solid #22C55E; max-width: 540px; box-shadow: 0 0 50px rgba(34, 197, 94, 0.35); }
            .badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 18px; border-radius: 9999px; font-size: 13px; font-weight: 800; background: rgba(239, 68, 68, 0.15); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.35); margin-bottom: 20px; }
            h1 { font-size: 26px; font-weight: 900; margin: 0 0 12px; color: #FFFFFF; }
            p { font-size: 15px; color: #A7BDB2; line-height: 1.6; margin: 10px 0; }
            .contact-box { background: rgba(0,0,0,0.4); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 18px; margin: 24px 0; text-align: left; }
            .contact-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
            .contact-label { color: #8FA097; }
            .contact-val { color: #4ADE80; font-weight: 700; text-decoration: none; }
            .action-btn { display: inline-block; background: linear-gradient(135deg, #4ADE80 0%, #22C55E 100%); color: #052E16; padding: 14px 28px; border-radius: 10px; font-weight: 800; font-size: 15px; text-decoration: none; margin-top: 10px; box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4); }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">7-DAY COMMERCIAL TRIAL COMPLETED</div>
            <h1>Your Free 1-Week Pass Has Ended</h1>
            <p>Thank you for testing InvoDesk Retail POS! All your local billing transactions and inventory ledgers are safely preserved on this device.</p>
            <p>To unlock the <strong>Full Permanent Production Edition</strong> with multi-branch synchronization and continuous updates, contact the founder:</p>
            <div class="contact-box">
              <div class="contact-row">
                <span class="contact-label">Contact Person:</span>
                <span class="contact-val">Salmanul Faris</span>
              </div>
              <div class="contact-row">
                <span class="contact-label">Phone / WhatsApp:</span>
                <a href="tel:+919962726106" class="contact-val">+91 9962726106</a>
              </div>
              <div class="contact-row">
                <span class="contact-label">Email:</span>
                <a href="mailto:salmanulfariss642@gmail.com" class="contact-val">salmanulfariss642@gmail.com</a>
              </div>
              <div class="contact-row">
                <span class="contact-label">Device Signature:</span>
                <code style="color: #94A3B8; font-size: 12px;">${license.machineId}</code>
              </div>
            </div>
            <a href="https://wa.me/919962726106?text=Hi%20Salman,%20I%20tested%20InvoDesk%20POS%20and%20want%20to%20activate%20the%20main%20version" class="action-btn">
              Contact on WhatsApp (+91 9962726106)
            </a>
          </div>
        </body>
      </html>
    `;
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(expiredHtml)}`);
    return;
  }

  // Target POS URL (Dev server or production static build)
  const targetUrl = process.env.POS_URL || 'http://localhost:3000';
  mainWindow.loadURL(targetUrl).catch(() => {
    // If dev web server is not running, show standby screen
    const standbyHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>InvoDesk Desktop POS</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0B201A; color: #F5F7F6; }
            .card { text-align: center; padding: 40px; border-radius: 16px; background: #132C24; border: 1px solid rgba(34, 197, 94, 0.2); max-width: 480px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
            .logo-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; background: rgba(34, 197, 94, 0.15); color: #22C55E; border: 1px solid rgba(34, 197, 94, 0.3); margin-bottom: 20px; }
            h1 { font-size: 22px; font-weight: 800; margin-bottom: 8px; color: #FFFFFF; }
            p { font-size: 14px; color: #94A39D; line-height: 1.6; margin: 8px 0; }
            code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; color: #22C55E; }
            button { background: #166B50; color: white; border: none; padding: 10px 22px; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 20px; transition: background 0.2s; }
            button:hover { background: #125640; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo-badge">InvoDesk Native POS</div>
            <h1>Hardware & Offline Engine Active</h1>
            <p>The Electron Native POS Main Process, SQLite Local Database, and Hardware Bridge are active.</p>
            <p>Connect your web POS interface by starting the web server at <code>http://localhost:3000</code>.</p>
            <button onclick="location.reload()">Retry Connection</button>
          </div>
        </body>
      </html>
    `;
    mainWindow?.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(standbyHtml)}`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Security: Enforce CSP and Permission Handlers across all sessions
app.whenReady().then(() => {
  // Deny all intrusive permissions (camera, microphone, geolocation, notifications)
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
  session.defaultSession.setPermissionCheckHandler(() => {
    return false;
  });

  // Content Security Policy: Differentiated between production and development
  const isProd = app.isPackaged || process.env.NODE_ENV === 'production';
  const cspDirectives = isProd
    ? "default-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob:; connect-src 'self' http://localhost:4000 http://127.0.0.1:4000 https://api.invodesk.in; font-src 'self' data: https://fonts.gstatic.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
    : "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws: http://localhost:* https:; img-src 'self' data: blob: https:; connect-src 'self' http://localhost:* ws://localhost:* https:;";

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [cspDirectives]
      }
    });
  });

  // WebContents security: Prevent webview injection and unconstrained window creation
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-attach-webview', (e) => {
      e.preventDefault();
    });
    contents.setWindowOpenHandler(() => {
      return { action: 'deny' };
    });
  });

  initCoreServices();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  syncEngine?.stop();
  localDb?.close();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
