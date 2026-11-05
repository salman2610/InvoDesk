import * as net from 'node:net';
import * as fs from 'node:fs';
import { 
  EscPosEncoder, 
  formatThermalReceipt,
  ReceiptBusinessDetails,
  SimulatedEscPosPrinter,
  SimulatedCashDrawer,
  BarcodeScannerEngine
} from '@invodesk/hardware';
import { Invoice, PrintReceiptOptions } from '@invodesk/types';
import { HardwareDiagnosticsReport, DesktopConfig } from './ipc-channels.js';
import { LocalDatabase } from './local-db.js';

export interface PrintReceiptPayload {
  receiptData: any;
  paperWidth?: '58mm' | '80mm';
  openDrawer?: boolean;
  cutPaper?: boolean;
}

export class HardwareBridge {
  private localDb: LocalDatabase;
  private simulatedPrinter: SimulatedEscPosPrinter;
  private simulatedDrawer: SimulatedCashDrawer;
  private scannerEngine: BarcodeScannerEngine;
  private lastScannedBarcode?: string;
  private lastScanTime?: string;

  constructor(localDb: LocalDatabase) {
    this.localDb = localDb;
    this.simulatedPrinter = new SimulatedEscPosPrinter();
    this.simulatedDrawer = new SimulatedCashDrawer();
    this.scannerEngine = new BarcodeScannerEngine();
  }

  public getSimulatedPrinter(): SimulatedEscPosPrinter {
    return this.simulatedPrinter;
  }

  public getSimulatedDrawer(): SimulatedCashDrawer {
    return this.simulatedDrawer;
  }

  public getScannerEngine(): BarcodeScannerEngine {
    return this.scannerEngine;
  }

  /**
   * Kicks open the cash drawer via printer pulse command or direct pulse.
   */
  public async kickCashDrawer(pin: number = 0): Promise<{ success: boolean; message: string }> {
    const config = this.getConfig();
    const pinNumber: 2 | 5 = pin === 1 ? 5 : 2;
    const kickPulse = Buffer.from(new EscPosEncoder().kickCashDrawer(pinNumber).encode());

    if (config.printerType === 'network' && config.printerAddress) {
      try {
        await this.sendRawToNetworkPrinter(config.printerAddress, 9100, kickPulse);
        return { success: true, message: `Drawer kick pulse sent to network printer at ${config.printerAddress}` };
      } catch (err: any) {
        return { success: false, message: `Failed to kick drawer via network: ${err.message}` };
      }
    } else if (config.printerType === 'usb' && config.printerAddress) {
      try {
        fs.appendFileSync(config.printerAddress, kickPulse);
        return { success: true, message: `Drawer kick pulse written to USB device ${config.printerAddress}` };
      } catch (err: any) {
        return { success: false, message: `Failed to kick drawer via USB: ${err.message}` };
      }
    }

    // Default to hardware simulator
    await this.simulatedDrawer.open();
    return { success: true, message: 'Drawer opened via hardware simulator' };
  }

  /**
   * Prints ESC/POS receipt data to the configured target (network, USB, or simulator).
   */
  public async printReceipt(payload: PrintReceiptPayload): Promise<{ success: boolean; bytesPrinted?: number; preview?: string; error?: string }> {
    try {
      const config = this.getConfig();
      const paperWidth: '58mm' | '80mm' = payload.paperWidth || config.printerPaperWidth || '80mm';

      const business: ReceiptBusinessDetails = {
        storeName: 'InvoDesk Retail Flagship',
        branchName: 'Pune Counter 01',
        gstin: '27AABCU9603R1ZM',
        phone: '+91 98765 43210',
        address: 'FC Road, Pune, Maharashtra 411004'
      };

      const options: PrintReceiptOptions = {
        paperWidth,
        openDrawer: payload.openDrawer,
        cutPaper: payload.cutPaper !== false
      };

      let rawBytes: Uint8Array;
      if (payload.receiptData && Array.isArray(payload.receiptData.items)) {
        rawBytes = formatThermalReceipt(payload.receiptData as Invoice, business, options);
      } else if (payload.receiptData?.rawBytes) {
        rawBytes = new Uint8Array(payload.receiptData.rawBytes);
      } else {
        const dummyInvoice: Invoice = {
          id: 'inv_test_001',
          tenantId: 'tenant_default',
          branchId: 'branch_pune_main',
          invoiceNumber: 'INV/PUN-01/26-27/0001',
          type: 'TAX_INVOICE',
          customerName: 'Walk-in Retail Customer',
          placeOfSupplyStateCode: '27',
          isInterState: false,
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
          paymentStatus: 'PAID',
          paidAmount: 118,
          balanceAmount: 0,
          payments: [{ id: 'pay_1', mode: 'CASH', amount: 118, paidAt: new Date().toISOString() }],
          isSynced: true,
          syncVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items: [
            {
              id: 'item_1',
              productId: 'prod_1',
              name: 'Sample Item',
              sku: 'SAMPLE-01',
              hsnCode: '9983',
              unit: 'PCS',
              quantity: 1,
              unitPrice: 100,
              discountPercent: 0,
              discountAmount: 0,
              taxableAmount: 100,
              gstRate: 18,
              isInterState: false,
              cgstRate: 9,
              cgstAmount: 9,
              sgstRate: 9,
              sgstAmount: 9,
              igstRate: 0,
              igstAmount: 0,
              cessAmount: 0,
              totalAmount: 118
            }
          ]
        };
        rawBytes = formatThermalReceipt(dummyInvoice, business, options);
      }

      const buffer = Buffer.from(rawBytes);

      // Dispatch to designated target
      if (config.printerType === 'network' && config.printerAddress) {
        const [host, portStr] = config.printerAddress.split(':');
        const port = portStr ? parseInt(portStr, 10) : 9100;
        await this.sendRawToNetworkPrinter(host, port, buffer);
        return { success: true, bytesPrinted: buffer.length };
      } else if (config.printerType === 'usb' && config.printerAddress) {
        fs.appendFileSync(config.printerAddress, buffer);
        return { success: true, bytesPrinted: buffer.length };
      } else {
        // Simulated printer
        await this.simulatedPrinter.send(rawBytes);
        return { success: true, bytesPrinted: buffer.length };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Sends raw binary ESC/POS buffer over TCP socket (Port 9100 standard).
   */
  private sendRawToNetworkPrinter(host: string, port: number, data: Buffer, timeoutMs: number = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      socket.setTimeout(timeoutMs);

      socket.connect(port, host, () => {
        socket.write(data, () => {
          socket.end();
          resolve();
        });
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error(`TCP connection to printer ${host}:${port} timed out after ${timeoutMs}ms`));
      });

      socket.on('error', (err) => {
        socket.destroy();
        reject(new Error(`TCP printer connection failed: ${err.message}`));
      });
    });
  }

  /**
   * Records a barcode scanned event from renderer keyboard-wedge listener.
   */
  public handleBarcodeScanned(barcode: string): { barcode: string; product?: any } {
    this.lastScannedBarcode = barcode;
    this.lastScanTime = new Date().toISOString();
    const product = this.localDb.findProductByBarcode(barcode);
    return { barcode, product };
  }

  /**
   * Probes hardware devices and yields diagnostics report.
   */
  public async getDiagnostics(): Promise<HardwareDiagnosticsReport> {
    const config = this.getConfig();
    let printerStatus: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'ERROR' = 'ONLINE';
    let printerDetails = 'Simulated ESC/POS thermal printer active';

    if (config.printerType === 'network' && config.printerAddress) {
      const [host, portStr] = config.printerAddress.split(':');
      const port = portStr ? parseInt(portStr, 10) : 9100;
      try {
        await this.pingTcpSocket(host, port, 1500);
        printerStatus = 'ONLINE';
        printerDetails = `Network printer connected on ${host}:${port}`;
      } catch (e: any) {
        printerStatus = 'OFFLINE';
        printerDetails = `Network printer offline on ${host}:${port}: ${e.message}`;
      }
    } else if (config.printerType === 'usb' && config.printerAddress) {
      if (fs.existsSync(config.printerAddress)) {
        printerStatus = 'ONLINE';
        printerDetails = `USB printer node detected at ${config.printerAddress}`;
      } else {
        printerStatus = 'OFFLINE';
        printerDetails = `USB printer device not found at ${config.printerAddress}`;
      }
    }

    const outboxCounts = this.localDb.getOutboxCounts();
    const isDrawerOpen = await this.simulatedDrawer.isOpen();

    return {
      printer: {
        status: printerStatus,
        type: config.printerType,
        address: config.printerAddress,
        details: printerDetails
      },
      cashDrawer: {
        connected: true,
        pin: config.cashDrawerPin || 0,
        drawerStatus: isDrawerOpen ? 'OPEN' : 'CLOSED'
      },
      barcodeScanner: {
        active: true,
        lastScanAt: this.lastScanTime,
        lastScannedBarcode: this.lastScannedBarcode
      },
      localDb: {
        status: 'CONNECTED',
        dbPath: this.localDb.getPath(),
        outboxPending: outboxCounts.pending
      }
    };
  }

  private pingTcpSocket(host: string, port: number, timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      socket.setTimeout(timeoutMs);
      socket.connect(port, host, () => {
        socket.destroy();
        resolve();
      });
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Timeout'));
      });
      socket.on('error', (err) => {
        socket.destroy();
        reject(err);
      });
    });
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
