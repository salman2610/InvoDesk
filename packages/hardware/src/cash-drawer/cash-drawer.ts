import { CashDrawerInterface, CashDrawerStatus } from '@invodesk/types';
import { EscPosEncoder } from '../escpos/encoder.js';
import { PrinterManager } from '../printer/printer-manager.js';

export interface CashDrawerDriver {
  type: CashDrawerInterface;
  open(pin?: 2 | 5): Promise<void>;
  isOpen(): Promise<boolean>;
}

/**
 * Controller for POS Cash Drawers (RJ11 Printer-driven or Direct USB/Serial)
 */
export class CashDrawerController {
  private driver: CashDrawerDriver;
  private status: CashDrawerStatus = { isOpen: false };
  private openHistory: { timestamp: number; reason: string; openedBy?: string }[] = [];

  constructor(driver?: CashDrawerDriver) {
    this.driver = driver || new PrinterDrivenDrawerDriver();
  }

  public setDriver(driver: CashDrawerDriver): void {
    this.driver = driver;
  }

  public async openDrawer(reason = 'CASH_CHECKOUT', openedBy = 'cashier'): Promise<void> {
    await this.driver.open();
    const now = Date.now();
    this.status = {
      isOpen: true,
      lastOpenedAt: now,
      openedBy,
      reason
    };
    this.openHistory.push({ timestamp: now, reason, openedBy });
  }

  public async getStatus(): Promise<CashDrawerStatus> {
    try {
      const isOpen = await this.driver.isOpen();
      return {
        ...this.status,
        isOpen
      };
    } catch {
      return this.status;
    }
  }

  public getHistory(): { timestamp: number; reason: string; openedBy?: string }[] {
    return [...this.openHistory];
  }
}

/**
 * Standard Printer-Driven Drawer Driver (sends ESC p m t1 t2 to receipt printer)
 */
export class PrinterDrivenDrawerDriver implements CashDrawerDriver {
  public type: CashDrawerInterface = 'PRINTER_DRIVEN';
  private printerManager?: PrinterManager;

  constructor(printerManager?: PrinterManager) {
    this.printerManager = printerManager;
  }

  public setPrinterManager(pm: PrinterManager): void {
    this.printerManager = pm;
  }

  public async open(pin: 2 | 5 = 2): Promise<void> {
    const encoder = new EscPosEncoder();
    encoder.kickCashDrawer(pin);
    const pulseCommand = encoder.encode();

    if (this.printerManager) {
      await this.printerManager.print(pulseCommand, 'Cash Drawer Kick Pulse');
    }
  }

  public async isOpen(): Promise<boolean> {
    // Standard RJ11 kick ports are write-only unless printer has microswitch DLE EOT status support
    return false;
  }
}
