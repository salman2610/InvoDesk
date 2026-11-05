import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';

const BASE_URL = 'http://localhost:4000/api';

describe('InvoDesk Phase 3: PostgreSQL 16+ Concurrency, Multi-Terminal & Recovery Suite', () => {
  let ownerToken = '';
  let cashierToken = '';
  let tenant1Id = 'tenant_1';
  let branchId = '';
  let multiStockProductId = '';
  let multiStockSku = '';

  beforeAll(async () => {
    // 1. Authenticate Owner
    const ownerRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@apexretail.in', password: 'admin123' })
    });
    const ownerData = await ownerRes.json();
    ownerToken = ownerData.token;
    tenant1Id = ownerData.user.tenantId;

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

    // 4. Create a product with 50 units for multi-terminal stress test
    multiStockSku = `MULTI-TERM-${Date.now()}`;
    const pRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        name: 'Multi-Terminal Concurrency Item',
        sku: multiStockSku,
        sellingPrice: 499.50,
        purchasePrice: 350.00,
        gstRate: 18,
        currentStock: 50,
        hsnCode: '8471'
      })
    });
    const pData = await pRes.json();
    multiStockProductId = pData.product.id;
  });

  // --- 1. Multi-Terminal Concurrent Checkouts ---
  describe('Multi-Terminal Concurrent Checkout & Monotonic Numbering', () => {
    it('dispatches 15 concurrent POS terminal checkouts with zero sequence collisions', async () => {
      const checkoutPromises = Array.from({ length: 15 }, (_, i) =>
        fetch(`${BASE_URL}/invoices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cashierToken}`
          },
          body: JSON.stringify({
            branchId,
            customerName: `Counter Terminal ${i + 1}`,
            items: [{ productId: multiStockProductId, quantity: 1 }],
            payments: [{ mode: 'CASH', amount: 589.41 }]
          })
        }).then(r => r.json())
      );

      const results = await Promise.all(checkoutPromises);

      // Verify all 15 succeeded
      results.forEach(res => {
        expect(res.invoice).toBeDefined();
        expect(res.invoice.invoiceNumber).toMatch(/^INV\//);
      });

      // Verify all 15 invoice numbers are unique
      const invoiceNumbers = results.map(r => r.invoice.invoiceNumber);
      const uniqueNumbers = new Set(invoiceNumbers);
      expect(uniqueNumbers.size).toBe(15);

      // Verify stock was decremented by exactly 15 units (50 -> 35)
      const pCheck = await fetch(`${BASE_URL}/products?search=${encodeURIComponent(multiStockSku)}`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      }).then(r => r.json());
      const updatedProduct = pCheck.products.find((p: any) => p.id === multiStockProductId);
      expect(updatedProduct).toBeDefined();
      expect(updatedProduct.currentStock).toBe(35);
    });
  });

  // --- 2. Decimal Precision & Financial Integrity ---
  describe('PostgreSQL Decimal(12,2) Precision Verification', () => {
    it('stores and calculates exact 2-decimal fractional paisa values without floating point drift', async () => {
      const sku = `PAISA-${Date.now()}`;
      const pRes = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({
          name: 'Paisa Precision Test Item',
          sku,
          sellingPrice: 199.99,
          gstRate: 18,
          currentStock: 10,
          hsnCode: '8471'
        })
      });
      const pData = await pRes.json();

      // Bill 3 items: 3 * 199.99 = 599.97 taxable. 18% GST (CGST 54.00 + SGST 54.00) = 108.00 tax.
      // Raw total = 707.97, Indian GST roundOff = +0.03, Grand Total = 708.00
      const invRes = await fetch(`${BASE_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
        body: JSON.stringify({
          branchId,
          customerName: 'Paisa Test Buyer',
          items: [{ productId: pData.product.id, quantity: 3 }],
          payments: [{ mode: 'UPI', amount: 708 }]
        })
      });
      const invData = await invRes.json();
      expect(invData.invoice.taxableAmount).toBe(599.97);
      expect(invData.invoice.totalTax).toBe(108);
      expect(invData.invoice.roundOff).toBe(0.03);
      expect(invData.invoice.grandTotal).toBe(708);
      expect(invData.invoice.paymentStatus).toBe('PAID');
    });
  });

  // --- 3. Strict Tenant Isolation ---
  describe('Strict Multi-Tenant Isolation', () => {
    it('prevents cross-tenant product and invoice access', async () => {
      const res = await fetch(`${BASE_URL}/products`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      const data = await res.json();
      expect(data.products.every((p: any) => p.tenantId === tenant1Id)).toBe(true);

      const invRes = await fetch(`${BASE_URL}/invoices`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      const invData = await invRes.json();
      expect(invData.invoices.every((i: any) => i.tenantId === tenant1Id)).toBe(true);
    });
  });

  // --- 4. Database Restart & Reconnection Resilience ---
  describe('PostgreSQL Crash/Restart & Connection Pool Recovery', () => {
    it('survives a PostgreSQL database restart without dropping subsequent transactions', async () => {
      // 1. Restart the PostgreSQL 16 cluster
      execSync(
        '/usr/lib/postgresql/16/bin/pg_ctl -D /home/sesame-ai/InvoDesk/packages/database/pgdata -o "-p 5433 -k /home/sesame-ai/InvoDesk/packages/database/pgdata/sock" -l /home/sesame-ai/InvoDesk/packages/database/pgdata/postgres.log restart',
        { stdio: 'pipe' }
      );

      // Brief pause to allow socket acceptance & trigger health check reconnection
      await new Promise(res => setTimeout(res, 1500));
      const healthRes = await fetch(`${BASE_URL}/health`).then(r => r.json());
      expect(healthRes.status).toMatch(/ok|recovered/);

      // 2. Dispatch a checkout immediately post-restart
      const postRestartRes = await fetch(`${BASE_URL}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cashierToken}`
        },
        body: JSON.stringify({
          branchId,
          customerName: 'Post-Restart Buyer',
          items: [{ productId: multiStockProductId, quantity: 1 }],
          payments: [{ mode: 'CASH', amount: 589.41 }]
        })
      });

      expect(postRestartRes.status).toBe(201);
      const postRestartData = await postRestartRes.json();
      expect(postRestartData.invoice).toBeDefined();
      expect(postRestartData.invoice.invoiceNumber).toMatch(/^INV\//);

      // Verify sequence continuity persisted
      expect(postRestartData.invoice.sequenceNumber).toBeGreaterThan(15);
    });
  });

  // --- 5. Sync Push Idempotency ---
  describe('Durable Sync Transaction Idempotency', () => {
    it('acknowledges duplicate sync push transactions without creating redundant invoices', async () => {
      const syncId = `client_sync_test_${Date.now()}`;
      const payload = {
        branchId,
        records: [
          {
            id: `rec_${Date.now()}`,
            clientTransactionId: syncId,
            branchId,
            entityType: 'INVOICE',
            operation: 'CREATE',
            entityId: `inv_sync_${Date.now()}`,
            clientTimestamp: Date.now(),
            payload: {
              invoiceNumber: `OFFLINE-INV-${Date.now()}`,
              subTotal: 500,
              taxableAmount: 500,
              totalTax: 90,
              grandTotal: 590,
              paidAmount: 590,
              paymentStatus: 'PAID',
              placeOfSupplyStateCode: '27',
              items: []
            }
          }
        ]
      };

      // First sync
      const sync1Res = await fetch(`${BASE_URL}/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
        body: JSON.stringify(payload)
      });
      expect(sync1Res.status).toBe(200);
      const sync1 = await sync1Res.json();
      expect(sync1.syncedIds.length).toBe(1);

      // Duplicate sync replay
      const sync2Res = await fetch(`${BASE_URL}/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
        body: JSON.stringify(payload)
      });
      expect(sync2Res.status).toBe(200);
      const sync2 = await sync2Res.json();
      expect(sync2.syncedIds.length).toBe(1);
    });
  });
});
