export const IPC_CHANNELS = {
  // Printing & Hardware
  PRINTER_PRINT: 'invodesk:printer:print',
  PRINTER_STATUS: 'invodesk:printer:status',
  PRINTER_DISCOVER: 'invodesk:printer:discover',
  DRAWER_KICK: 'invodesk:drawer:kick',
  SCANNER_INPUT: 'invodesk:scanner:input',
  HARDWARE_DIAGNOSTICS: 'invodesk:hardware:diagnostics',

  // Local SQLite Outbox & Offline Sync
  OUTBOX_QUEUE: 'invodesk:outbox:queue',
  OUTBOX_LIST: 'invodesk:outbox:list',
  OUTBOX_COUNT: 'invodesk:outbox:count',
  OUTBOX_DRAIN: 'invodesk:outbox:drain',
  OUTBOX_CLEAR_FAILED: 'invodesk:outbox:clear-failed',
  SYNC_STATUS: 'invodesk:sync:status',
  SYNC_TRIGGER: 'invodesk:sync:trigger',

  // Window & Kiosk
  KIOSK_TOGGLE: 'invodesk:window:kiosk-toggle',
  KIOSK_STATUS: 'invodesk:window:kiosk-status',

  // Database Backup, Recovery & Integrity
  DB_BACKUP: 'invodesk:db:backup',
  DB_RESTORE: 'invodesk:db:restore',
  DB_INTEGRITY: 'invodesk:db:integrity',

  // Config & Hardware Settings
  CONFIG_GET: 'invodesk:config:get',
  CONFIG_SET: 'invodesk:config:set',
  APP_INFO: 'invodesk:app:info',
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];

export interface OutboxQueueRequest {
  entityType: 'INVOICE' | 'PAYMENT' | 'CUSTOMER' | 'SHIFT_LOG';
  action: 'CREATE' | 'UPDATE' | 'CANCEL';
  payload: any;
  branchCode?: string;
  terminalId?: string;
  financialYear?: string;
}

export interface OutboxRecord {
  id: string;
  provisionalId?: string;
  entityType: string;
  action: string;
  payload: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  lastError?: string;
  createdAt: string;
  syncedAt?: string;
}

export interface SyncEngineStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  lastSyncedAt?: string;
  lastError?: string;
}

export interface HardwareDiagnosticsReport {
  printer: {
    status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'ERROR';
    type: 'network' | 'usb' | 'simulated';
    address?: string;
    details?: string;
  };
  cashDrawer: {
    connected: boolean;
    pin: number;
    drawerStatus: 'OPEN' | 'CLOSED';
  };
  barcodeScanner: {
    active: boolean;
    lastScanAt?: string;
    lastScannedBarcode?: string;
  };
  localDb: {
    status: 'CONNECTED' | 'ERROR';
    dbPath: string;
    outboxPending: number;
  };
}

export interface DesktopConfig {
  apiUrl: string;
  branchCode: string;
  branchId: string;
  terminalId: string;
  financialYear: string;
  printerType: 'simulated' | 'network' | 'usb';
  printerAddress?: string; // IP or USB path
  printerPaperWidth: '58mm' | '80mm';
  cashDrawerPin: number;
  autoSyncIntervalMs: number;
}
