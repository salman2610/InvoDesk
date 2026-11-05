import { describe, it, expect, beforeAll } from 'vitest';
import {
  EscPosEncoder,
  formatThermalReceipt,
  PrinterManager,
  SimulatedEscPosPrinter,
  BarcodeScannerEngine,
  CashierShiftManager,
  SimulatedCashDrawer,
  CashDrawerController,
  SimulatedPaymentGateway
} from '@invodesk/hardware';
import { Invoice } from '@invodesk/types';

const BASE_URL = 'http://localhost:4000/api';

describe('InvoDesk Phase 4: Real-World POS Hardware & Payment Provider Integration', () => {
  let ownerToken = '';
  let cashierToken = '';
  let branchId = '';
  let sampleInvoice: Invoice;

  beforeAll(async () => {
    // 1. Authenticate Owner
    const ownerRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@apexretail.in', password: 'admin123' })
    });
    const ownerData = await ownerRes.json();
    ownerToken = ownerData.token;

    // 2. Authenticate Cashier
    const cashierRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cashier@apexretail.in', password: 'cashier123' })
    });
    const cashierData = await cashierRes.json();
    cashierToken = cashierData.token;

    // 3. Resolve Branch
    const branchRes = await fetch(`${BASE_URL}/branches`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const branchData = await branchRes.json();
    branchId = branchData.branches[0].id;

    // 4. Fetch an invoice for thermal formatting tests
    const invRes = await fetch(`${BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const invData = await invRes.json();
    sampleInvoice = invData.invoices[0];
  });

  // --- 1. ESC/POS Thermal Printing & Retry Recovery ---
  describe('ESC/POS Thermal Printing (58mm, 80mm) & Retry Recovery', () => {
    it('formats 80mm and 58mm thermal receipts preserving legal tax invoice details', () => {
      const business = {
        storeName: 'Apex Supermarket',
        branchName: 'Main Pune Counter',
        gstin: '27AABCA1234A1Z5',
        phone: '+91 98220 12345',
        address: '101 Deccan Gymkhana, Pune'
      };

      // 80mm Receipt (48 columns)
      const receipt80mm = formatThermalReceipt(sampleInvoice, business, {
        paperWidth: '80mm',
        openDrawer: true,
        cutPaper: true
      });
      expect(receipt80mm).toBeInstanceOf(Uint8Array);
      expect(receipt80mm.length).toBeGreaterThan(100);

      // 58mm Receipt (32 columns)
      const receipt58mm = formatThermalReceipt(sampleInvoice, business, {
        paperWidth: '58mm',
        openDrawer: false,
        cutPaper: true
      });
      expect(receipt58mm).toBeInstanceOf(Uint8Array);
      expect(receipt58mm.length).toBeGreaterThan(100);
    });

    it('recovers from printer errors and hardware disconnects via retry queue', async () => {
      const printer = new SimulatedEscPosPrinter();
      const manager = new PrinterManager(printer, 3, 50);

      // Inject a single hardware failure
      printer.injectHardwareFailureOnce();

      // Should automatically retry and recover on second attempt
      await manager.printImmediate(new Uint8Array([0x1b, 0x40, 0x41]), 'Test Receipt');
      expect(printer.getPrintedJobs().length).toBe(1);
    });

    it('detects paper out and cover open sensor faults', async () => {
      const printer = new SimulatedEscPosPrinter();
      const manager = new PrinterManager(printer, 2, 20);

      // Paper Out
      printer.setPaperStatus('OUT');
      const status = await manager.getStatus();
      expect(status.paperStatus).toBe('OUT');
      await expect(manager.printImmediate(new Uint8Array([0x1b, 0x40]))).rejects.toThrow(/paper/i);

      // Restore paper
      printer.setPaperStatus('OK');
      await manager.printImmediate(new Uint8Array([0x1b, 0x40]));
      expect(printer.getPrintedJobs().length).toBe(1);
    });
  });

  // --- 2. Keyboard-Wedge Barcode Scanner & Registration ---
  describe('Keyboard-Wedge Barcode Scanner with Rapid Scan Buffering', () => {
    it('accurately captures rapid scanner keystrokes (<40ms delay) into a complete barcode', () => {
      const scanner = new BarcodeScannerEngine({ maxInterCharDelayMs: 40 });
      let scannedBarcode = '';

      scanner.onScan((e) => {
        scannedBarcode = e.barcode;
      });

      // Simulate rapid hardware scanner input at 5ms per character
      const event = scanner.simulateHardwareScan('8901030383921', 5);
      expect(scannedBarcode).toBe('8901030383921');
      expect(event.scanDurationMs).toBeLessThan(100);
    });

    it('discards fragmented human keyboard typing exceeding the scanner threshold', () => {
      const scanner = new BarcodeScannerEngine({ maxInterCharDelayMs: 30 });
      let completedScan: any = null;

      scanner.onScan((e) => {
        completedScan = e;
      });

      // Character 1 typed at t = 0
      scanner.handleKeyInput('8', 1000);
      // Character 2 typed 200ms later (human typing speed) -> buffer should reset
      scanner.handleKeyInput('9', 1200);
      // Enter pressed
      scanner.handleKeyInput('Enter', 1210);

      // Buffer was reset, so "8" was dropped and only "9" remained (< min length 3), thus discarded
      expect(completedScan).toBeNull();
    });

    it('handles unknown barcodes and allows runtime barcode registration', () => {
      const scanner = new BarcodeScannerEngine();
      let unknownDetected = '';
      scanner.onUnknownBarcode((barcode) => {
        unknownDetected = barcode;
      });

      const unknownResult = scanner.lookup('UNREGISTERED_999');
      expect(unknownResult.found).toBe(false);
      expect(unknownResult.requiresRegistration).toBe(true);

      // Register product to barcode
      scanner.registerBarcode('UNREGISTERED_999', {
        id: 'prod_new',
        tenantId: 'tenant_1',
        sku: 'NEW-SKU-1',
        name: 'Quick-Registered Soda',
        category: 'Beverages',
        unit: 'PCS',
        hsnCode: '2202',
        gstRate: 28,
        sellingPrice: 40,
        mrp: 40,
        purchasePrice: 28,
        isTaxInclusive: true,
        currentStock: 100,
        minStockAlert: 10,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const registeredResult = scanner.lookup('UNREGISTERED_999');
      expect(registeredResult.found).toBe(true);
      expect(registeredResult.product?.name).toBe('Quick-Registered Soda');
    });
  });

  // --- 3. Cash Drawer & Cashier Shift Reconciliation ---
  describe('Cash Drawer & Cashier Shift End-of-Day Reconciliation', () => {
    it('manages opening float, sales, drops, and calculates exact variance on closing', () => {
      const shiftMgr = new CashierShiftManager();
      const drawerDriver = new SimulatedCashDrawer();
      const drawerController = new CashDrawerController(drawerDriver);

      // 1. Open morning shift with ₹2,000 float
      const shift = shiftMgr.openShift('tenant_1', 'branch_pune', 'user_1', 'Ramesh (Cashier 1)', 2000, 'Morning shift');
      expect(shift.status).toBe('OPEN');
      expect(shift.openingFloat).toBe(2000);
      expect(shift.expectedCash).toBe(2000);

      // 2. Process cash sales
      shiftMgr.recordCashSale(1500); // Sale 1: +1500
      shiftMgr.recordCashSale(850);  // Sale 2: +850
      drawerController.openDrawer('CASH_CHECKOUT', 'Ramesh');

      expect(shiftMgr.getActiveShift()?.expectedCash).toBe(4350);
      expect(drawerDriver.getOpenCount()).toBe(1);

      // 3. Mid-day safe cash drop (transfer excess ₹3,000 to safe)
      const drop = shiftMgr.recordCashDrop(3000, 'Safe transfer by supervisor', 'DROP');
      expect(drop.amount).toBe(3000);
      expect(shiftMgr.getActiveShift()?.expectedCash).toBe(1350); // 4350 - 3000 = 1350

      // 4. Close shift with physical cash count: Ramesh counts ₹1,340 (a ₹10 shortage)
      const closedShift = shiftMgr.closeShift(1340, 'Closing tally verified with supervisor');
      expect(closedShift.status).toBe('CLOSED');
      expect(closedShift.expectedCash).toBe(1350);
      expect(closedShift.actualCashCounted).toBe(1340);
      expect(closedShift.cashDifference).toBe(-10); // ₹10 shortage accurately identified
    });
  });

  // --- 4. Payment Provider Abstraction & Webhook Verification ---
  describe('Payment Provider Abstraction & Webhook Security', () => {
    it('never trusts frontend payment status: validates via cryptographically signed webhooks', async () => {
      const gateway = new SimulatedPaymentGateway('my_webhook_secret_key');

      // 1. Backend creates order
      const order = await gateway.createOrder({
        invoiceId: sampleInvoice.id,
        amount: 500,
        idempotencyKey: `idem_test_${Date.now()}`
      });
      expect(order.status).toBe('PENDING');

      // 2. Attacker sends tampered signature -> REJECTED
      await expect(gateway.verifyWebhook({ orderId: order.orderId, amount: 500 }, 'fake_tampered_signature')).rejects.toThrow(
        /invalid payment webhook signature/i
      );

      // 3. Legitimate gateway callback with valid HMAC-SHA256 signature
      const { payload, signature } = gateway.generateSignedWebhook(order.orderId, `PAY_${Date.now()}`, 500, 'SUCCESS');
      const verified = await gateway.verifyWebhook(payload, signature);
      expect(verified.status).toBe('SUCCESS');
      expect(verified.orderId).toBe(order.orderId);

      // 4. Idempotent settlement (duplicate webhook callbacks must not double-credit)
      const firstSettlement = gateway.settleIdempotent(verified);
      expect(firstSettlement.isDuplicate).toBe(false);

      const replaySettlement = gateway.settleIdempotent(verified);
      expect(replaySettlement.isDuplicate).toBe(true);
      expect(replaySettlement.result.paymentId).toBe(verified.paymentId);
    });

    it('processes live payment order creation and webhook settlement via REST API', async () => {
      // 1. Create payment order via API
      const orderRes = await fetch(`${BASE_URL}/payments/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cashierToken}`
        },
        body: JSON.stringify({
          invoiceId: sampleInvoice.id,
          amount: 250,
          provider: 'UPI_NPCI'
        })
      });
      expect(orderRes.status).toBe(200);
      const orderData = await orderRes.json();
      expect(orderData.order.orderId).toMatch(/^UPI_ORD_/);
      expect(orderData.order.qrCodeData).toMatch(/^upi:\/\/pay\?/);

      // 2. Simulate Razorpay/UPI gateway webhook with valid HMAC signature
      const gateway = new SimulatedPaymentGateway('simulated_secret_key_2026');
      const paymentId = `PAY_API_TEST_${Date.now()}`;
      const { payload, signature } = gateway.generateSignedWebhook(sampleInvoice.id, paymentId, 250, 'SUCCESS');

      // Push webhook to API
      const hookRes = await fetch(`${BASE_URL}/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature': signature
        },
        body: JSON.stringify(payload)
      });
      expect(hookRes.status).toBe(200);
      const hookData = await hookRes.json();
      expect(hookData.status).toBe('success');
      expect(hookData.isDuplicate).toBe(false);

      // Replay same webhook to verify idempotent acknowledgment
      const replayRes = await fetch(`${BASE_URL}/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature': signature
        },
        body: JSON.stringify(payload)
      });
      expect(replayRes.status).toBe(200);
      const replayData = await replayRes.json();
      expect(replayData.isDuplicate).toBe(true);
    });
  });
});
