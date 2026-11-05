import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = 'http://localhost:4000/api';

describe('InvoDesk Production Concurrency & Reliability Test Suite', () => {
  let ownerToken = '';
  let cashierToken = '';
  let tenantId = 'tenant_1';
  let branchId = 'branch_pune_main';

  beforeAll(async () => {
    // 1. Authenticate Owner
    const ownerRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@apexretail.in', password: 'admin123' })
    });
    const ownerData = await ownerRes.json();
    ownerToken = ownerData.token;
    tenantId = ownerData.user.tenantId;

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
  });

  // --- 1. Security & RBAC Verification ---
  describe('Security, Auth & Role-Based Authorization', () => {
    it('rejects invalid login credentials with 401', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'owner@apexretail.in', password: 'wrong_password' })
      });
      expect(res.status).toBe(401);
    });

    it('verifies authenticated user profile from token via /auth/me', async () => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user.email).toBe('owner@apexretail.in');
      expect(data.user.role).toBe('OWNER');
    });

    it('enforces RBAC: Cashier cannot cancel an invoice (403 Forbidden)', async () => {
      const res = await fetch(`${BASE_URL}/invoices/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cashierToken}`
        },
        body: JSON.stringify({ invoiceNumber: 'INV/PUN-01/26-27/0001' })
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Forbidden');
    });
  });

  // --- 2. Concurrency: Simultaneous Checkouts & Unique Invoice Numbering ---
  describe('Concurrency: Simultaneous Checkouts & Atomic Numbering', () => {
    it('executes 10 simultaneous POS checkouts with zero duplicate invoice numbers', async () => {
      // Create a test product with ample stock
      const prodRes = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`
        },
        body: JSON.stringify({
          name: 'Concurrency Stress Item',
          sku: `CONC-SKU-${Date.now()}`,
          sellingPrice: 100,
          purchasePrice: 60,
          mrp: 118,
          currentStock: 100,
          hsnCode: '8471',
          gstRate: 18
        })
      });
      const prodData = await prodRes.json();
      const productId = prodData.product.id;

      // Fire 10 simultaneous checkout requests
      const checkoutPromises = Array.from({ length: 10 }).map((_, idx) =>
        fetch(`${BASE_URL}/invoices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cashierToken}`
          },
          body: JSON.stringify({
            branchId,
            customerName: `Concurrent Buyer ${idx + 1}`,
            items: [{ productId, quantity: 1, unitPrice: 100 }],
            payments: [{ mode: 'CASH', amount: 118 }]
          })
        }).then(r => r.json())
      );

      const results = await Promise.all(checkoutPromises);

      // Verify all 10 succeeded
      const invoiceNumbers = results.map(r => r.invoice?.invoiceNumber).filter(Boolean);
      expect(invoiceNumbers.length).toBe(10);

      // Assert zero collisions: 10 distinct invoice numbers!
      const uniqueNumbers = new Set(invoiceNumbers);
      expect(uniqueNumbers.size).toBe(10);

      // Verify sequential nature
      const sequences = results.map(r => r.invoice?.sequenceNumber).sort((a, b) => a - b);
      for (let i = 1; i < sequences.length; i++) {
        expect(sequences[i]).toBe(sequences[i - 1] + 1);
      }
    });

    it('enforces atomic stock exhaustion: 2 simultaneous buyers for 2 units when only 2 exist', async () => {
      // Create a product with strictly 2 units in stock
      const prodRes = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`
        },
        body: JSON.stringify({
          name: 'Limited Stock Item',
          sku: `LTD-SKU-${Date.now()}`,
          sellingPrice: 500,
          currentStock: 2,
          hsnCode: '8471',
          gstRate: 18
        })
      });
      const prodData = await prodRes.json();
      const productId = prodData.product.id;

      // Two cashiers try to buy 2 units at the exact same time
      const [res1, res2] = await Promise.all([
        fetch(`${BASE_URL}/invoices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cashierToken}`
          },
          body: JSON.stringify({
            branchId,
            customerName: 'Buyer 1',
            items: [{ productId, quantity: 2, unitPrice: 500 }],
            payments: [{ mode: 'CASH', amount: 590 }]
          })
        }),
        fetch(`${BASE_URL}/invoices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cashierToken}`
          },
          body: JSON.stringify({
            branchId,
            customerName: 'Buyer 2',
            items: [{ productId, quantity: 2, unitPrice: 500 }],
            payments: [{ mode: 'CASH', amount: 590 }]
          })
        })
      ]);

      const status1 = res1.status;
      const status2 = res2.status;

      // Exactly ONE must succeed (201) and ONE must fail with 400 Bad Request (Insufficient Stock)
      expect([status1, status2].sort()).toEqual([201, 400]);

      // Verify product stock is exactly 0 (never negative!)
      const checkRes = await fetch(`${BASE_URL}/products?search=${prodData.product.sku}`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      const checkData = await checkRes.json();
      expect(checkData.products[0].currentStock).toBe(0);
    });
  });

  // --- 3. Concurrency: Exactly-Once Invoice Cancellation ---
  describe('Concurrency: Repeated Invoice Cancellation', () => {
    it('restores stock exactly once even under simultaneous duplicate cancellation requests', async () => {
      // 1. Create a product with stock = 10
      const prodRes = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`
        },
        body: JSON.stringify({
          name: 'Restock Concurrency Item',
          sku: `RESTOCK-SKU-${Date.now()}`,
          sellingPrice: 200,
          currentStock: 10,
          hsnCode: '8471',
          gstRate: 18
        })
      });
      const prodData = await prodRes.json();
      const productId = prodData.product.id;

      // 2. Bill 4 units -> stock drops to 6
      const invRes = await fetch(`${BASE_URL}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cashierToken}`
        },
        body: JSON.stringify({
          branchId,
          customerName: 'Return Customer',
          items: [{ productId, quantity: 4, unitPrice: 200 }],
          payments: [{ mode: 'CASH', amount: 944 }]
        })
      });
      const invData = await invRes.json();
      const invoiceNumber = invData.invoice.invoiceNumber;

      // Verify stock is now 6
      const afterSale = await fetch(`${BASE_URL}/products?search=${prodData.product.sku}`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      }).then(r => r.json());
      expect(afterSale.products[0].currentStock).toBe(6);

      // 3. Fire 3 concurrent cancel requests for this exact invoice
      const cancelPromises = [1, 2, 3].map(() =>
        fetch(`${BASE_URL}/invoices/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ownerToken}`
          },
          body: JSON.stringify({ invoiceNumber })
        })
      );

      const cancelResponses = await Promise.all(cancelPromises);
      const statuses = cancelResponses.map(r => r.status);

      // Exactly ONE cancel must succeed (200 OK), the other 2 must be rejected (400 Bad Request)
      expect(statuses.filter(s => s === 200).length).toBe(1);
      expect(statuses.filter(s => s === 400).length).toBe(2);

      // 4. Verify stock was restored by EXACTLY 4 units back to 10 (not 14 or 18!)
      const finalCheck = await fetch(`${BASE_URL}/products?search=${prodData.product.sku}`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      }).then(r => r.json());
      expect(finalCheck.products[0].currentStock).toBe(10);
    });
  });

  // --- 4. Financial & Khata Consistency ---
  describe('Customer Khata & Financial Consistency', () => {
    it('maintains exact paisa consistency across credit sales and Khata settlements', async () => {
      // 1. Create a customer with 0 balance
      const custRes = await fetch(`${BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`
        },
        body: JSON.stringify({
          name: 'Ledger Audit Client',
          phone: `9988${Math.floor(100000 + Math.random() * 900000)}`,
          creditLimit: 50000,
          currentBalance: 0
        })
      });
      const custData = await custRes.json();
      const customerId = custData.customer.id;

      // 2. Create product
      const pRes = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`
        },
        body: JSON.stringify({
          name: 'Khata Item',
          sku: `KHATA-SKU-${Date.now()}`,
          sellingPrice: 1000,
          currentStock: 20,
          hsnCode: '8471',
          gstRate: 18
        })
      });
      const pData = await pRes.json();

      // 3. Credit sale of 2 units (Taxable ₹2000 + 18% GST ₹360 = ₹2360) with 0 payment
      const invRes = await fetch(`${BASE_URL}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cashierToken}`
        },
        body: JSON.stringify({
          branchId,
          customerId,
          customerName: 'Ledger Audit Client',
          items: [{ productId: pData.product.id, quantity: 2, unitPrice: 1000 }],
          payments: [] // Pure credit sale
        })
      });
      const invData = await invRes.json();
      expect(invData.invoice.grandTotal).toBe(2360);
      expect(invData.invoice.balanceAmount).toBe(2360);

      // Verify customer balance increased to exactly ₹2,360
      const c1 = await fetch(`${BASE_URL}/customers?search=${custData.customer.phone}`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      }).then(r => r.json());
      const custAfterSale = c1.customers.find((c: any) => c.id === customerId);
      expect(custAfterSale).toBeDefined();
      expect(custAfterSale.currentBalance).toBe(2360);

      // 4. Record partial Khata collection of ₹1,360
      const payRes = await fetch(`${BASE_URL}/customers/${customerId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cashierToken}`
        },
        body: JSON.stringify({ amount: 1360, mode: 'UPI', referenceNumber: 'UPI-KHATA-01' })
      });
      expect(payRes.status).toBe(200);

      // Verify balance reduced to exactly ₹1,000
      const c2 = await fetch(`${BASE_URL}/customers?search=${custData.customer.phone}`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
      }).then(r => r.json());
      const custAfterPayment = c2.customers.find((c: any) => c.id === customerId);
      expect(custAfterPayment).toBeDefined();
      expect(custAfterPayment.currentBalance).toBe(1000);
    });
  });

  // --- 5. GST Multi-Rate & Rounding Edge Cases ---
  describe('GST Multi-Rate Line Items & Rounding Edge Cases', () => {
    it('computes exact fractional taxes and rounding across multi-rate items in one bill', async () => {
      // Create 3 items with 5%, 12%, and 28% GST
      const [item5, item12, item28] = await Promise.all([
        fetch(`${BASE_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
          body: JSON.stringify({ name: '5% Item', sku: `R5-${Date.now()}`, sellingPrice: 285.71, gstRate: 5, currentStock: 10, hsnCode: '0902' })
        }).then(r => r.json()),
        fetch(`${BASE_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
          body: JSON.stringify({ name: '12% Item', sku: `R12-${Date.now()}`, sellingPrice: 566.96, gstRate: 12, currentStock: 10, hsnCode: '0405' })
        }).then(r => r.json()),
        fetch(`${BASE_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
          body: JSON.stringify({ name: '28% Item', sku: `R28-${Date.now()}`, sellingPrice: 1450.50, gstRate: 28, currentStock: 10, hsnCode: '8708' })
        }).then(r => r.json())
      ]);

      const res = await fetch(`${BASE_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
        body: JSON.stringify({
          branchId,
          customerName: 'Multi-Rate Buyer',
          items: [
            { productId: item5.product.id, quantity: 1, unitPrice: 285.71 },
            { productId: item12.product.id, quantity: 1, unitPrice: 566.96 },
            { productId: item28.product.id, quantity: 1, unitPrice: 1450.50 }
          ],
          payments: [{ mode: 'CASH', amount: 3349 }]
        })
      });

      const data = await res.json();
      const inv = data.invoice;

      // Total Taxable = 285.71 + 566.96 + 1450.50 = 2303.17
      expect(inv.taxableAmount).toBe(2303.17);

      // Verify line items sum up to total tax
      const calculatedLineTax = inv.items.reduce((s: number, it: any) => s + it.cgstAmount + it.sgstAmount + it.igstAmount, 0);
      expect(Math.round(calculatedLineTax * 100) / 100).toBe(inv.totalTax);

      // Grand Total = Math.round(Taxable + TotalTax)
      expect(inv.grandTotal).toBe(Math.round(inv.taxableAmount + inv.totalTax));
      expect(inv.roundOff).toBe(Math.round((inv.grandTotal - (inv.taxableAmount + inv.totalTax)) * 100) / 100);
    });
  });

  // --- 6. Persistent Synchronization Idempotency ---
  describe('Offline Synchronization & Idempotent Push', () => {
    it('persists sync transaction records and acknowledges duplicate submissions idempotently', async () => {
      const clientTxId = `tx_test_idempotent_${Date.now()}`;
      const record = {
        id: `rec_${Date.now()}`,
        clientTransactionId: clientTxId,
        tenantId,
        branchId,
        entityType: 'INVOICE',
        operation: 'CREATE',
        entityId: `inv_sync_${Date.now()}`,
        payload: {
          id: `inv_sync_${Date.now()}`,
          invoiceNumber: `INV-OFFLINE-${Date.now()}`,
          grandTotal: 1500,
          items: []
        },
        clientTimestamp: Date.now(),
        status: 'PENDING'
      };

      // Push 1
      const res1 = await fetch(`${BASE_URL}/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
        body: JSON.stringify({ branchId, records: [record] })
      });
      const data1 = await res1.json();
      expect(data1.syncedIds).toContain(record.id);

      // Push 2 (Simulating network retry from client after timeout)
      const res2 = await fetch(`${BASE_URL}/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
        body: JSON.stringify({ branchId, records: [record] })
      });
      const data2 = await res2.json();
      expect(data2.syncedIds).toContain(record.id);
      expect(data2.conflicts.length).toBe(0);
    });
  });
});
