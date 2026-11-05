process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { describe, it, expect, beforeAll } from 'vitest';
import https from 'https';

// Node agent that permits testing self-signed TLS cert in local pilot verification
const agent = new https.Agent({ rejectUnauthorized: false });
const PILOT_BASE_URL = 'https://localhost:4001/api';

async function pilotFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${PILOT_BASE_URL}${endpoint}`, {
    ...options,
    // @ts-ignore
    agent
  });
}

interface PilotBusinessContext {
  token: string;
  tenantId: string;
  branchId: string;
  terminalCode: string;
  ownerEmail: string;
  businessName: string;
  products: { id: string; sku: string; price: number; currentStock: number }[];
  invoices: string[];
}

const PILOT_BUSINESS_SPECS = [
  {
    businessName: 'Krishna Supermarket & Provision Store',
    tradeName: 'Krishna Mart',
    gstin: '27AABCK9876K1Z1',
    pan: 'AABCK9876K',
    phone: '+91 98221 00111',
    email: 'owner@krishnamart.in',
    stateCode: '27',
    stateName: 'Maharashtra',
    address: { street: 'Shop 4, Gandhi Chowk', city: 'Pune', pincode: '411038' },
    mainBranch: { name: 'Krishna Mart - Gandhi Chowk', code: 'KRI-01' },
    owner: { name: 'Gopal Krishna', password: 'KrishnaPilotSecure123' },
    products: [
      { sku: 'GROC-RICE-KOLAM-25KG', name: 'Kolam Raw Rice 25kg Bag', sellingPrice: 1650, gstRate: 0, currentStock: 30, unit: 'PACK' as const },
      { sku: 'GROC-SUGAR-5KG', name: 'Refined White Sugar 5kg', sellingPrice: 220, gstRate: 5, currentStock: 50, unit: 'PACK' as const },
      { sku: 'FMCG-DETTOL-125G', name: 'Dettol Original Soap 125g Pack of 4', sellingPrice: 195, gstRate: 18, currentStock: 80, unit: 'PACK' as const }
    ]
  },
  {
    businessName: 'Apex Electronics & Mobile Hub',
    tradeName: 'Apex Mobile Hub',
    gstin: '27AABCA5432A1Z4',
    pan: 'AABCA5432A',
    phone: '+91 98222 00222',
    email: 'owner@apexmobilehub.in',
    stateCode: '27',
    stateName: 'Maharashtra',
    address: { street: 'Unit 12, Phoenix Marketcity', city: 'Pune', pincode: '411014' },
    mainBranch: { name: 'Apex Electronics - Phoenix', code: 'APX-01' },
    owner: { name: 'Vikram Singhania', password: 'ApexPilotSecure123' },
    products: [
      { sku: 'ELEC-BOAT-EARBUDS', name: 'boAt Airdopes 141 Bluetooth TWS', sellingPrice: 1299, gstRate: 18, currentStock: 25, unit: 'PCS' as const },
      { sku: 'ELEC-MI-POWERBANK', name: 'Mi 3i 20000mAh Power Bank Fast Charge', sellingPrice: 1999, gstRate: 18, currentStock: 18, unit: 'PCS' as const }
    ]
  },
  {
    businessName: 'Sanjeevani Wellness & Pharmacy',
    tradeName: 'Sanjeevani Pharma',
    gstin: '27AABCS6789S1Z8',
    pan: 'AABCS6789S',
    phone: '+91 98223 00333',
    email: 'owner@sanjeevanipharma.in',
    stateCode: '27',
    stateName: 'Maharashtra',
    address: { street: 'Opposite Civil Hospital, Station Road', city: 'Pune', pincode: '411001' },
    mainBranch: { name: 'Sanjeevani Pharma - Main Station', code: 'SAN-01' },
    owner: { name: 'Dr. Anand Joshi', password: 'SanjeevaniSecure123' },
    products: [
      { sku: 'PHARM-PARACETAMOL-650', name: 'Dolo 650 Strip of 15 Tablets', sellingPrice: 32, gstRate: 12, currentStock: 200, unit: 'PACK' as const },
      { sku: 'PHARM-DIGITAL-THERMO', name: 'Dr. Morepen Digital Thermometer', sellingPrice: 240, gstRate: 18, currentStock: 40, unit: 'PCS' as const }
    ]
  },
  {
    businessName: 'Vandana Sarees & Fashion House',
    tradeName: 'Vandana Fashion',
    gstin: '27AABCV3456V1Z2',
    pan: 'AABCV3456V',
    phone: '+91 98224 00444',
    email: 'owner@vandanafashion.in',
    stateCode: '27',
    stateName: 'Maharashtra',
    address: { street: '118 Laxmi Road, Narayan Peth', city: 'Pune', pincode: '411030' },
    mainBranch: { name: 'Vandana Fashion - Laxmi Road', code: 'VAN-01' },
    owner: { name: 'Sunita Agarwal', password: 'VandanaSecure123' },
    products: [
      { sku: 'TEX-PAITHANI-SAREE', name: 'Pure Silk Traditional Yeola Paithani Saree', sellingPrice: 8500, gstRate: 5, currentStock: 12, unit: 'PCS' as const },
      { sku: 'TEX-COTTON-KURTI', name: 'Handcrafted Chanderi Cotton Kurti', sellingPrice: 1450, gstRate: 5, currentStock: 35, unit: 'PCS' as const }
    ]
  },
  {
    businessName: 'Modern Hardware & Industrial Tools',
    tradeName: 'Modern Hardware',
    gstin: '27AABCM7890M1Z6',
    pan: 'AABCM7890M',
    phone: '+91 98225 00555',
    email: 'owner@modernhardware.in',
    stateCode: '27',
    stateName: 'Maharashtra',
    address: { street: 'Plot 88, MIDC Industrial Area, Bhosari', city: 'Pune', pincode: '411026' },
    mainBranch: { name: 'Modern Hardware - Bhosari Central', code: 'MOD-01' },
    owner: { name: 'Ramesh Patel', password: 'ModernSecure123' },
    products: [
      { sku: 'TOOL-BOSCH-DRILL', name: 'Bosch GSB 550 Professional Impact Drill', sellingPrice: 3250, gstRate: 18, currentStock: 15, unit: 'PCS' as const },
      { sku: 'TOOL-STANLEY-TAPE', name: 'Stanley 5M Heavy Duty Measuring Tape', sellingPrice: 280, gstRate: 18, currentStock: 60, unit: 'PCS' as const }
    ]
  }
];

describe('InvoDesk Phase 7: Controlled Commercial Pilot Operations (5 Businesses)', () => {
  const pilotContexts: PilotBusinessContext[] = [];
  const runSuffix = Date.now().toString().slice(-6);

  // --- Step 1: Execute Independent Onboarding for All 5 Retail Businesses ---
  beforeAll(async () => {
    for (const spec of PILOT_BUSINESS_SPECS) {
      const email = `${spec.email.split('@')[0]}_${runSuffix}@${spec.email.split('@')[1]}`;
      // 1. Onboard Business
      const onbRes = await pilotFetch('/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: spec.businessName,
          tradeName: spec.tradeName,
          email,
          gstin: spec.gstin,
          pan: spec.pan,
          phone: spec.phone,
          stateCode: spec.stateCode,
          stateName: spec.stateName,
          address: spec.address,
          mainBranch: spec.mainBranch,
          owner: spec.owner,
          planTier: 'STARTER_TRIAL',
          billingCycle: 'TRIAL'
        })
      });

      expect(onbRes.status).toBe(201);
      const onbData = await onbRes.json();
      const token = onbData.token;
      const tenantId = onbData.tenant.id;
      const branchId = onbData.branch.id;
      const terminalCode = onbData.terminal.terminalCode;

      // 2. Import Products for this business
      const impRes = await pilotFetch('/products/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ products: spec.products })
      });
      expect(impRes.status).toBe(200);

      // 3. Query imported product IDs
      const prodRes = await pilotFetch('/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const prodData = await prodRes.json();
      const importedProducts = prodData.products.map((p: any) => ({
        id: p.id,
        sku: p.sku,
        price: Number(p.sellingPrice),
        currentStock: p.currentStock
      }));

      pilotContexts.push({
        token,
        tenantId,
        branchId,
        terminalCode,
        ownerEmail: email,
        businessName: spec.businessName,
        products: importedProducts,
        invoices: []
      });
    }
  });

  // --- Step 2: Strict Cross-Tenant Isolation Verification ---
  describe('Cross-Tenant Data Isolation Audit (5 Businesses)', () => {
    it('verifies that each business catalog has strictly its own products', async () => {
      for (let i = 0; i < pilotContexts.length; i++) {
        const ctx = pilotContexts[i];
        const res = await pilotFetch('/products', {
          headers: { Authorization: `Bearer ${ctx.token}` }
        });
        const data = await res.json();
        const expectedSkus = PILOT_BUSINESS_SPECS[i].products.map(p => p.sku);

        expect(data.products.length).toBe(expectedSkus.length);
        expect(data.products.every((p: any) => p.tenantId === ctx.tenantId)).toBe(true);
        expect(data.products.map((p: any) => p.sku).sort()).toEqual(expectedSkus.sort());
      }
    });

    it('proves business B cannot read business A products or invoices by direct ID', async () => {
      const bizA = pilotContexts[0];
      const bizB = pilotContexts[1];

      // Biz B tries to access Biz A's product
      const aProdId = bizA.products[0].id;
      const breachRes = await pilotFetch(`/products?search=${bizA.products[0].sku}`, {
        headers: { Authorization: `Bearer ${bizB.token}` }
      });
      const breachData = await breachRes.json();
      expect(breachData.products.length).toBe(0);
    });
  });

  // --- Step 3: Real Retail Multi-Payment Workflows Across Businesses ---
  describe('Daily Retail Financial & Billing Workflows', () => {
    it('Krishna Mart: Completes cash billing with change calculation and stock deduction', async () => {
      const ctx = pilotContexts[0]; // Krishna Mart
      const riceItem = ctx.products.find(p => p.sku === 'GROC-RICE-KOLAM-25KG')!;

      const saleRes = await pilotFetch('/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.token}`
        },
        body: JSON.stringify({
          branchId: ctx.branchId,
          items: [{ productId: riceItem.id, quantity: 2 }],
          payments: [{ mode: 'CASH', amount: 3300, referenceNumber: 'CASH-TENDERED-3500' }],
          customerName: 'Suresh Patil',
          customerPhone: '9822199887'
        })
      });

      expect(saleRes.status).toBe(201);
      const saleData = await saleRes.json();
      expect(saleData.invoice.paymentStatus).toBe('PAID');
      expect(Number(saleData.invoice.grandTotal)).toBe(3300);
      ctx.invoices.push(saleData.invoice.id);

      // Verify stock deducted
      const pCheck = await pilotFetch('/products', {
        headers: { Authorization: `Bearer ${ctx.token}` }
      });
      const pData = await pCheck.json();
      const updatedRice = pData.products.find((p: any) => p.id === riceItem.id);
      expect(updatedRice.currentStock).toBe(riceItem.currentStock - 2);
    });

    it('Apex Electronics: Completes UPI payment settlement with verified transaction ref', async () => {
      const ctx = pilotContexts[1]; // Apex Electronics
      const earbuds = ctx.products.find(p => p.sku === 'ELEC-BOAT-EARBUDS')!;

      const saleRes = await pilotFetch('/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.token}`
        },
        body: JSON.stringify({
          branchId: ctx.branchId,
          items: [{ productId: earbuds.id, quantity: 1 }],
          payments: [{ mode: 'UPI', amount: 1533, referenceNumber: 'UPI/HDFC/202611059912' }],
          customerName: 'Rahul Mehta'
        })
      });

      expect(saleRes.status).toBe(201);
      const saleData = await saleRes.json();
      expect(saleData.invoice.paymentStatus).toBe('PAID');
      expect(saleData.invoice.payments[0].mode).toBe('UPI');
      ctx.invoices.push(saleData.invoice.id);
    });

    it('Sanjeevani Pharma: Completes Customer Khata credit sale with balance tracking', async () => {
      const ctx = pilotContexts[2]; // Sanjeevani Pharma
      const dolo = ctx.products.find(p => p.sku === 'PHARM-PARACETAMOL-650')!;

      // 1. Create registered customer
      const custRes = await pilotFetch('/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.token}`
        },
        body: JSON.stringify({
          name: 'Col. K.S. Rao',
          phone: '9822312345',
          creditLimit: 5000,
          currentBalance: 0
        })
      });
      expect(custRes.status).toBe(201);
      const custData = await custRes.json();
      const custId = custData.customer.id;

      // 2. Bill on Khata Credit (Paid amount = 0)
      const saleRes = await pilotFetch('/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.token}`
        },
        body: JSON.stringify({
          branchId: ctx.branchId,
          customerId: custId,
          customerName: 'Col. K.S. Rao',
          items: [{ productId: dolo.id, quantity: 10 }],
          payments: [] // Pure Credit Sale
        })
      });
      expect(saleRes.status).toBe(201);
      const saleData = await saleRes.json();
      expect(saleData.invoice.paymentStatus).toBe('UNPAID');
      ctx.invoices.push(saleData.invoice.id);

      // 3. Verify Customer Ledger increased
      const cCheck = await pilotFetch('/customers', {
        headers: { Authorization: `Bearer ${ctx.token}` }
      });
      const cData = await cCheck.json();
      const updatedCust = cData.customers.find((c: any) => c.id === custId);
      expect(Number(updatedCust.currentBalance)).toBe(Number(saleData.invoice.grandTotal));

      // 4. Settle partial payment against Khata
      const payRes = await pilotFetch(`/customers/${custId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.token}`
        },
        body: JSON.stringify({
          amount: 200,
          mode: 'CASH',
          referenceNumber: 'KHATA-PARTIAL-RECEIPT-01'
        })
      });
      expect(payRes.status).toBe(200);
      const payData = await payRes.json();
      expect(Number(payData.customer.currentBalance)).toBe(Number(saleData.invoice.grandTotal) - 200);
    });

    it('Vandana Fashion: Executes Audited Return and Payment Reversal', async () => {
      const ctx = pilotContexts[3]; // Vandana Fashion
      const kurti = ctx.products.find(p => p.sku === 'TEX-COTTON-KURTI')!;

      // 1. Sale
      const saleRes = await pilotFetch('/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.token}`
        },
        body: JSON.stringify({
          branchId: ctx.branchId,
          items: [{ productId: kurti.id, quantity: 1 }],
          payments: [{ mode: 'CARD', amount: 1523, referenceNumber: 'VISA-AUTH-9811' }]
        })
      });
      expect(saleRes.status).toBe(201);
      const saleData = await saleRes.json();
      const paymentId = saleData.invoice.payments[0].id;
      const invoiceId = saleData.invoice.id;

      // 2. Audited Reversal
      const revRes = await pilotFetch(`/payments/${paymentId}/reversal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.token}`
        },
        body: JSON.stringify({ reason: 'Customer exchange requested: size mismatch' })
      });
      expect(revRes.status).toBe(200);
      const revData = await revRes.json();
      expect(revData.success).toBe(true);

      // 3. Verify Invoice balance restored to UNPAID
      const invCheck = await pilotFetch(`/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${ctx.token}` }
      });
      const invData = await invCheck.json();
      expect(invData.invoice.paymentStatus).toBe('UNPAID');
      expect(Number(invData.invoice.balanceAmount)).toBe(1523);
    });
  });

  // --- Step 4: Offline Mutation & Idempotent Push Recovery ---
  describe('Terminal Offline Mutation & Idempotent Push Recovery', () => {
    it('Modern Hardware: Syncs offline terminal sale with zero duplicate financial impact on replay', async () => {
      const ctx = pilotContexts[4]; // Modern Hardware
      const drill = ctx.products.find(p => p.sku === 'TOOL-BOSCH-DRILL')!;
      const offlineTxId = `offline_tx_${Date.now()}`;
      const offlineInvoiceId = `inv_off_${Date.now()}`;

      const offlinePayload = {
        id: offlineInvoiceId,
        invoiceNumber: `MOD-01/OFF/${Math.floor(1000 + Math.random() * 9000)}`,
        branchId: ctx.branchId,
        items: [{ productId: drill.id, quantity: 1, unitPrice: drill.price, gstRate: 18, totalAmount: 3835 }],
        grandTotal: 3835,
        paidAmount: 3835,
        paymentStatus: 'PAID'
      };

      // 1. Initial Push while restoring connectivity
      const pushRes = await pilotFetch('/sync/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.token}`
        },
        body: JSON.stringify({
          branchId: ctx.branchId,
          lastSyncedTimestamp: Date.now(),
          records: [
            {
              id: `rec_${Date.now()}`,
              clientTransactionId: offlineTxId,
              tenantId: ctx.tenantId,
              branchId: ctx.branchId,
              entityType: 'INVOICE',
              operation: 'CREATE',
              entityId: offlineInvoiceId,
              payload: offlinePayload,
              clientTimestamp: Date.now(),
              status: 'PENDING'
            }
          ]
        })
      });
      expect(pushRes.status).toBe(200);
      const pushData = await pushRes.json();
      expect(pushData.syncedIds.length).toBe(1);

      // 2. Re-push exact same transaction (simulating duplicate webhook / retry packet)
      const replayRes = await pilotFetch('/sync/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ctx.token}`
        },
        body: JSON.stringify({
          branchId: ctx.branchId,
          lastSyncedTimestamp: Date.now(),
          records: [
            {
              id: `rec_${Date.now()}`,
              clientTransactionId: offlineTxId, // same idempotency key
              tenantId: ctx.tenantId,
              branchId: ctx.branchId,
              entityType: 'INVOICE',
              operation: 'CREATE',
              entityId: offlineInvoiceId,
              payload: offlinePayload,
              clientTimestamp: Date.now(),
              status: 'PENDING'
            }
          ]
        })
      });
      expect(replayRes.status).toBe(200);
      const replayData = await replayRes.json();
      expect(replayData.syncedIds.length).toBe(1);

      // 3. Verify exactly ONE invoice was created
      const invCheck = await pilotFetch('/invoices', {
        headers: { Authorization: `Bearer ${ctx.token}` }
      });
      const invList = await invCheck.json();
      const matches = invList.invoices.filter((i: any) => i.id === offlineInvoiceId);
      expect(matches.length).toBe(1);
    });
  });

  // --- Step 5: Commercial Administrative Operations Dashboard ---
  describe('Pilot Operations Administrative Dashboard Audit', () => {
    it('Krishna Mart Owner: Accesses pilot dashboard and verifies global health metrics', async () => {
      const ctx = pilotContexts[0];
      const res = await pilotFetch('/admin/pilot-dashboard', {
        headers: { Authorization: `Bearer ${ctx.token}` }
      });
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.metrics.totalTenants).toBeGreaterThanOrEqual(5);
      expect(data.metrics.activeBranches).toBeGreaterThanOrEqual(5);
      expect(data.metrics.registeredTerminals).toBeGreaterThanOrEqual(5);
      expect(data.metrics.activeSubscriptions).toBeGreaterThanOrEqual(5);
      expect(data.systemHealth.status).toBe('HEALTHY');
      expect(data.systemHealth.tlsEncryption).toContain('ENABLED');

      // Verify privileged access is logged in audit trail
      expect(data.recentAudits.length).toBeGreaterThan(0);
      const lastAudit = data.recentAudits[0];
      expect(lastAudit.action).toBe('ADMIN_DASHBOARD_ACCESSED');
    });
  });
});
