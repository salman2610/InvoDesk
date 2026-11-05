import * as crypto from 'crypto';
import {
  PaymentOrderRequest,
  PaymentOrderResponse,
  PaymentProviderName,
  PaymentTransactionStatus,
  PaymentVerificationResult,
  PaymentWebhookPayload
} from '@invodesk/types';

export interface PaymentProvider {
  name: PaymentProviderName;
  createOrder(request: PaymentOrderRequest): Promise<PaymentOrderResponse>;
  verifyWebhook(payload: any, signature: string): Promise<PaymentWebhookPayload>;
  verifyPayment(orderId: string, paymentId?: string): Promise<PaymentVerificationResult>;
  refund(orderId: string, amount: number, reason?: string): Promise<{ refundId: string; status: 'REFUNDED' }>;
}

/**
 * High-Security Base Payment Provider Engine with Webhook HMAC Verification & Idempotency
 */
export abstract class BasePaymentProvider implements PaymentProvider {
  public abstract name: PaymentProviderName;
  protected webhookSecret: string;
  private settledTransactions: Map<string, PaymentVerificationResult> = new Map();

  constructor(webhookSecret: string) {
    this.webhookSecret = webhookSecret;
  }

  public abstract createOrder(request: PaymentOrderRequest): Promise<PaymentOrderResponse>;

  /**
   * Cryptographically verify gateway webhook signature (HMAC-SHA256)
   */
  public verifySignature(payloadString: string, signature: string): boolean {
    const expected = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payloadString)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    } catch {
      return signature === expected;
    }
  }

  public async verifyWebhook(rawPayload: any, signature: string): Promise<PaymentWebhookPayload> {
    const parsed = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : { ...rawPayload };
    const { signature: _sig, ...toVerify } = parsed;
    const payloadStr = JSON.stringify(toVerify);
    const isValid = this.verifySignature(payloadStr, signature);

    if (!isValid) {
      throw new Error(`Invalid payment webhook signature from provider "${this.name}"`);
    }
    return {
      event: parsed.event || 'payment.success',
      orderId: parsed.orderId,
      paymentId: parsed.paymentId,
      amount: parsed.amount,
      currency: parsed.currency || 'INR',
      status: (parsed.status as PaymentTransactionStatus) || 'SUCCESS',
      signature,
      timestamp: parsed.timestamp || Date.now(),
      rawPayload: parsed
    };
  }

  /**
   * Idempotently settle a transaction from verified webhook
   * Replays of identical paymentId return existing result without duplicate side-effects.
   */
  public settleIdempotent(webhook: PaymentWebhookPayload): { isDuplicate: boolean; result: PaymentVerificationResult } {
    if (this.settledTransactions.has(webhook.paymentId)) {
      return {
        isDuplicate: true,
        result: this.settledTransactions.get(webhook.paymentId)!
      };
    }

    const result: PaymentVerificationResult = {
      verified: true,
      orderId: webhook.orderId,
      paymentId: webhook.paymentId,
      status: webhook.status,
      amount: webhook.amount,
      settledAt: Date.now()
    };

    this.settledTransactions.set(webhook.paymentId, result);
    return { isDuplicate: false, result };
  }

  public abstract verifyPayment(orderId: string, paymentId?: string): Promise<PaymentVerificationResult>;
  public abstract refund(orderId: string, amount: number, reason?: string): Promise<{ refundId: string; status: 'REFUNDED' }>;
}

/**
 * NPCI UPI Dynamic QR Payment Provider (BHIM, PhonePe, Google Pay, Paytm)
 */
export class UpiNpciPaymentProvider extends BasePaymentProvider {
  public name: PaymentProviderName = 'UPI_NPCI';
  private vpa: string;
  private merchantName: string;

  constructor(vpa = 'invodesk.retail@okaxis', merchantName = 'InvoDesk Retail', webhookSecret = 'upi_secret_key_2026') {
    super(webhookSecret);
    this.vpa = vpa;
    this.merchantName = merchantName;
  }

  public async createOrder(request: PaymentOrderRequest): Promise<PaymentOrderResponse> {
    const orderId = `UPI_ORD_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tr = orderId; // Transaction reference
    const tn = encodeURIComponent(`Bill ${request.invoiceId}`);
    const am = request.amount.toFixed(2);
    const cu = request.currency || 'INR';

    // Standard NPCI UPI URI Specification
    const upiUri = `upi://pay?pa=${this.vpa}&pn=${encodeURIComponent(this.merchantName)}&tr=${tr}&tn=${tn}&am=${am}&cu=${cu}`;

    return {
      orderId,
      provider: 'UPI_NPCI',
      amount: request.amount,
      currency: cu,
      status: 'PENDING',
      qrCodeData: upiUri,
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 mins expiry
    };
  }

  public async verifyPayment(orderId: string, paymentId = `PAY_${orderId}`): Promise<PaymentVerificationResult> {
    return {
      verified: true,
      orderId,
      paymentId,
      status: 'SUCCESS',
      amount: 0,
      settledAt: Date.now()
    };
  }

  public async refund(orderId: string, amount: number, reason = 'Customer Return'): Promise<{ refundId: string; status: 'REFUNDED' }> {
    return {
      refundId: `RF_${Date.now()}`,
      status: 'REFUNDED'
    };
  }
}
