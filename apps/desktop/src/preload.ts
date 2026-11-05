import { contextBridge, ipcRenderer } from 'electron';
import type { OutboxQueueRequest } from './ipc-channels.js';

const IPC_CHANNELS = {
  PRINTER_PRINT: 'invodesk:printer:print',
  PRINTER_STATUS: 'invodesk:printer:status',
  PRINTER_DISCOVER: 'invodesk:printer:discover',
  DRAWER_KICK: 'invodesk:drawer:kick',
  SCANNER_INPUT: 'invodesk:scanner:input',
  HARDWARE_DIAGNOSTICS: 'invodesk:hardware:diagnostics',
  OUTBOX_QUEUE: 'invodesk:outbox:queue',
  OUTBOX_LIST: 'invodesk:outbox:list',
  OUTBOX_COUNT: 'invodesk:outbox:count',
  OUTBOX_DRAIN: 'invodesk:outbox:drain',
  OUTBOX_CLEAR_FAILED: 'invodesk:outbox:clear-failed',
  SYNC_STATUS: 'invodesk:sync:status',
  SYNC_TRIGGER: 'invodesk:sync:trigger',
  KIOSK_TOGGLE: 'invodesk:window:kiosk-toggle',
  KIOSK_STATUS: 'invodesk:window:kiosk-status',
  DB_BACKUP: 'invodesk:db:backup',
  DB_RESTORE: 'invodesk:db:restore',
  DB_INTEGRITY: 'invodesk:db:integrity',
  CONFIG_GET: 'invodesk:config:get',
  CONFIG_SET: 'invodesk:config:set',
  APP_INFO: 'invodesk:app:info',
} as const;

export interface ElectronAPI {
  isDesktop: boolean;
  printReceipt: (payload: any) => Promise<{ success: boolean; bytesPrinted?: number; preview?: string; error?: string }>;
  getPrinterStatus: () => Promise<any>;
  discoverPrinters: () => Promise<any>;
  kickCashDrawer: (pin?: number) => Promise<{ success: boolean; message: string }>;
  getHardwareDiagnostics: () => Promise<any>;
  queueOutbox: (request: OutboxQueueRequest) => Promise<any>;
  listOutbox: (limit?: number) => Promise<any>;
  getOutboxCount: () => Promise<any>;
  drainOutbox: () => Promise<any>;
  clearFailedOutbox: () => Promise<any>;
  getSyncStatus: () => Promise<any>;
  triggerSync: () => Promise<any>;
  toggleKiosk: () => Promise<boolean>;
  getKioskStatus: () => Promise<boolean>;
  getConfig: (key?: string) => Promise<any>;
  setConfig: (key: string, value: string) => Promise<void>;
  getAppInfo: () => Promise<any>;
  backupDatabase: (targetPath?: string) => Promise<{ success: boolean; backupPath: string; bytesWritten: number; timestamp: string }>;
  restoreDatabase: (backupPath: string) => Promise<{ success: boolean; message: string }>;
  checkDatabaseIntegrity: () => Promise<{ healthy: boolean; details: string[] }>;
  onBarcodeScan: (callback: (data: { barcode: string; product?: any }) => void) => () => void;
  onSyncStatusUpdate: (callback: (status: any) => void) => () => void;
}

const electronAPI: ElectronAPI = {
  isDesktop: true,
  printReceipt: (payload) => ipcRenderer.invoke(IPC_CHANNELS.PRINTER_PRINT, payload),
  getPrinterStatus: () => ipcRenderer.invoke(IPC_CHANNELS.PRINTER_STATUS),
  discoverPrinters: () => ipcRenderer.invoke(IPC_CHANNELS.PRINTER_DISCOVER),
  kickCashDrawer: (pin = 0) => ipcRenderer.invoke(IPC_CHANNELS.DRAWER_KICK, pin),
  getHardwareDiagnostics: () => ipcRenderer.invoke(IPC_CHANNELS.HARDWARE_DIAGNOSTICS),
  queueOutbox: (request) => ipcRenderer.invoke(IPC_CHANNELS.OUTBOX_QUEUE, request),
  listOutbox: (limit = 50) => ipcRenderer.invoke(IPC_CHANNELS.OUTBOX_LIST, limit),
  getOutboxCount: () => ipcRenderer.invoke(IPC_CHANNELS.OUTBOX_COUNT),
  drainOutbox: () => ipcRenderer.invoke(IPC_CHANNELS.OUTBOX_DRAIN),
  clearFailedOutbox: () => ipcRenderer.invoke(IPC_CHANNELS.OUTBOX_CLEAR_FAILED),
  getSyncStatus: () => ipcRenderer.invoke(IPC_CHANNELS.SYNC_STATUS),
  triggerSync: () => ipcRenderer.invoke(IPC_CHANNELS.SYNC_TRIGGER),
  toggleKiosk: () => ipcRenderer.invoke(IPC_CHANNELS.KIOSK_TOGGLE),
  getKioskStatus: () => ipcRenderer.invoke(IPC_CHANNELS.KIOSK_STATUS),
  getConfig: (key) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET, key),
  setConfig: (key, value) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SET, key, value),
  getAppInfo: () => ipcRenderer.invoke(IPC_CHANNELS.APP_INFO),
  backupDatabase: (targetPath) => ipcRenderer.invoke(IPC_CHANNELS.DB_BACKUP, targetPath),
  restoreDatabase: (backupPath) => ipcRenderer.invoke(IPC_CHANNELS.DB_RESTORE, backupPath),
  checkDatabaseIntegrity: () => ipcRenderer.invoke(IPC_CHANNELS.DB_INTEGRITY),
  onBarcodeScan: (callback) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('invodesk:scanner:scanned', handler);
    return () => ipcRenderer.removeListener('invodesk:scanner:scanned', handler);
  },
  onSyncStatusUpdate: (callback) => {
    const handler = (_event: any, status: any) => callback(status);
    ipcRenderer.on('invodesk:sync:updated', handler);
    return () => ipcRenderer.removeListener('invodesk:sync:updated', handler);
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
