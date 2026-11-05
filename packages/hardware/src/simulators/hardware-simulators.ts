import * as crypto from 'crypto';
import { PrinterConnectionType, PrinterStatus, CashDrawerInterface } from '@invodesk/types';
import { PrinterTransport } from '../printer/printer-manager.js';
import { CashDrawerDriver } from '../cash-drawer/cash-drawer.js';
import { BasePaymentProvider } from '../payment/payment-provider.js';
import {
  PaymentOrderRequest,
  PaymentOrderResponse,
  PaymentVerificationResult,
  PaymentWebhookPayload
} from '@invodesk/types';

/**
 * High-Fidelity ESC/POS Printer Simulator with Error Injection
 * Clearly marked as SIMULATED for automated testing and sandbox environments.
 */
export class SimulatedEscPosPrinter implements PrinterTransport {
  public readonly isSimulated = true;
  public readonly type: PrinterConnectionType = 'SIMULATED';

  private online = true;
  private paperStatus: 'OK' | 'LOW' | 'OUT' = 'OK';
  private coverOpen = false;
  private printedJobs: Uint8Array[] = [];
  private failNextPrint = false;

  public isConnected(): boolean {
    return this.online;
  }

  public async connect(): Promise<void> {
    if (!this.online) {
      throw new Error('[SIMULATED_PRINTER] Connection failed: Device is offline or powered off');
    }
  }

  public async disconnect(): Promise<void> {
    this.online = false;
  }

  public async send(data: Uint8Array): Promise<void> {
    if (!this.online) {
      throw new Error('[SIMULATED_PRINTER] Write error: Device disconnected');
    }
    if (this.failNextPrint) {
      this.failNextPrint = false;
      throw new Error('[SIMULATED_PRINTER] Hardware error: Mechanical paper jam or head error');
    }
    if (this.paperStatus === 'OUT') {
      throw new Error('[SIMULATED_PRINTER] Sensor error: Out of paper');
    }
    if (this.coverOpen) {
      throw new Error('[SIMULATED_PRINTER] Sensor error: Cover is open');
    }

    this.printedJobs.push(new Uint8Array(data));
  }

  public async getStatus(): Promise<PrinterStatus> {
    return {
      isOnline: this.online,
      paperStatus: this.paperStatus,
      coverOpen: this.coverOpen,
      isSimulated: true,
      lastError: !this.online ? 'Device offline' : undefined
    };
  }

  // --- Fault Injection API for Testing ---
  public setOnline(state: boolean): void {
    this.online = state;
  }

  public setPaperStatus(status: 'OK' | 'LOW' | 'OUT'): void {
    this.paperStatus = status;
  }

  public setCoverOpen(open: boolean): void {
    this.coverOpen = open;
  }

  public injectHardwareFailureOnce(): void {
    this.failNextPrint = true;
  }

  public getPrintedJobs(): Uint8Array[] {
    return [...this.printedJobs];
  }

  public clearHistory(): void {
    this.printedJobs = [];
  }
}

/**
 * Cash Drawer Simulator
 */
export class SimulatedCashDrawer implements CashDrawerDriver {
  public readonly isSimulated = true;
  public readonly type: CashDrawerInterface = 'SIMULATED';
  private drawerOpen = false;
  private openCount = 0;

  public async open(): Promise<void> {
    this.drawerOpen = true;
    this.openCount++;
  }

  public async isOpen(): Promise<boolean> {
    return this.drawerOpen;
  }

  public close(): void {
    this.drawerOpen = false;
  }

  public getOpenCount(): number {
    return this.openCount;
  }
}

/**
 * Simulated Payment Gateway for End-to-End Automated Testing
 */
export class SimulatedPaymentGateway extends BasePaymentProvider {
  public readonly isSimulated = true;
  public name = 'RAZORPAY' as const;
  private orders: Map<string, PaymentOrderResponse> = new Map();

  constructor(secret = 'simulated_secret_key_2026') {
    super(secret);
  }

  public async createOrder(request: PaymentOrderRequest): Promise<PaymentOrderResponse> {
    const orderId = `SIM_ORD_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const response: PaymentOrderResponse = {
      orderId,
      provider: 'RAZORPAY',
      amount: request.amount,
      currency: request.currency || 'INR',
      status: 'PENDING',
      clientSecret: `sec_${orderId}`,
      expiresAt: Date.now() + 10 * 60 * 1000
    };
    this.orders.set(orderId, response);
    return response;
  }

  /**
   * Helper to construct a cryptographically signed webhook payload from this gateway
   */
  public generateSignedWebhook(orderId: string, paymentId: string, amount: number, status: 'SUCCESS' | 'FAILED' = 'SUCCESS'): {
    payload: PaymentWebhookPayload;
    signature: string;
  } {
    const toSign = {
      event: status === 'SUCCESS' ? 'payment.captured' : 'payment.failed',
      orderId,
      paymentId,
      amount,
      currency: 'INR',
      status,
      timestamp: Date.now()
    };

    const signature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(toSign))
      .digest('hex');

    const payload: PaymentWebhookPayload = {
      ...toSign,
      signature
    };
    return { payload, signature };
  }

  public async verifyPayment(orderId: string, paymentId = `PAY_${orderId}`): Promise<PaymentVerificationResult> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found in gateway`);
    }

    return {
      verified: true,
      orderId,
      paymentId,
      status: 'SUCCESS',
      amount: order.amount,
      settledAt: Date.now()
    };
  }

  public async refund(orderId: string, amount: number, reason = 'Customer refund'): Promise<{ refundId: string; status: 'REFUNDED' }> {
    return {
      refundId: `SIM_REF_${Date.now()}`,
      status: 'REFUNDED'
    };
  }
}
