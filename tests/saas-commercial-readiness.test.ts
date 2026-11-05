import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = 'http://localhost:4000/api';

describe('InvoDesk Phase 6: Commercial SaaS Readiness & Tenant Isolation Suite', () => {
  let tenant1Token = '';
  let tenant1Id = '';
  let tenant2Token = '';
  let tenant2Id = '';

  beforeAll(async () => {
    // 1. Login existing tenant_1 owner
    const t1Login = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@apexretail.in', password: 'admin123' })
    });
    const t1Data = await t1Login.json();
    tenant1Token = t1Data.token;
    tenant1Id = t1Data.user.tenantId;

    // 2. Register & onboard brand new business: tenant_2
    const onboardingRes = await fetch(`${BASE_URL}/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: 'Lotus Organic Mart',
        tradeName: 'Lotus Mart',
        email: `owner.lotus.${Date.now()}@lotusmart.in`,
        gstin: '27AABCL1234L1Z9',
        pan: 'AABCL1234L',
        phone: '+91 98330 11223',
        stateCode: '27',
        stateName: 'Maharashtra',
        address: {
          street: '12 MG Road',
          city: 'Pune',
          pincode: '411001'
        },
        mainBranch: {
          name: 'Lotus Mart - MG Road',
          code: 'LOTUS-01'
        },
        owner: {
          name: 'Meera Deshmukh',
          password: 'lotusPassword123'
        },
        planTier: 'STARTER_TRIAL',
        billingCycle: 'TRIAL'
      })
    });

    expect(onboardingRes.status).toBe(201);
    const onboardData = await onboardingRes.json();
    tenant2Token = onboardData.token;
    tenant2Id = onboardData.tenant.id;
  });

  // --- 1. Tenant & Branch Isolation ---
  describe('Tenant Isolation & Cross-Tenant Access Prevention', () => {
    it('prevents unauthenticated access to products, customers, and invoices', async () => {
      const pRes = await fetch(`${BASE_URL}/products`);
      expect(pRes.status).toBe(401);

      const cRes = await fetch(`${BASE_URL}/customers`);
      expect(cRes.status).toBe(401);

      const iRes = await fetch(`${BASE_URL}/invoices`);
      expect(iRes.status).toBe(401);
    });

    it('ensures Tenant 2 does not see Tenant 1 seeded products', async () => {
      const res = await fetch(`${BASE_URL}/products`, {
        headers: { Authorization: `Bearer ${tenant2Token}` }
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.products.length).toBe(0);
    });

    it('ensures Tenant 2 does not see Tenant 1 invoices or customers', async () => {
      const iRes = await fetch(`${BASE_URL}/invoices`, {
        headers: { Authorization: `Bearer ${tenant2Token}` }
      });
      expect(iRes.status).toBe(200);
      const iData = await iRes.json();
      expect(iData.invoices.length).toBe(0);

      const cRes = await fetch(`${BASE_URL}/customers`, {
        headers: { Authorization: `Bearer ${tenant2Token}` }
      });
      expect(cRes.status).toBe(200);
      const cData = await cRes.json();
      expect(cData.customers.length).toBe(0);
    });

    it('prevents Tenant 2 from accessing Tenant 1 invoice directly by ID', async () => {
      // First get an invoice ID belonging to Tenant 1
      const t1Invoices = await fetch(`${BASE_URL}/invoices`, {
        headers: { Authorization: `Bearer ${tenant1Token}` }
      });
      const t1Data = await t1Invoices.json();
      const targetInvoiceId = t1Data.invoices[0].id;

      // Tenant 2 tries to access it
      const breachRes = await fetch(`${BASE_URL}/invoices/${targetInvoiceId}`, {
        headers: { Authorization: `Bearer ${tenant2Token}` }
      });
      expect(breachRes.status).toBe(404);
    });

    it('prevents Tenant 2 from cancelling Tenant 1 invoice', async () => {
      const t1Invoices = await fetch(`${BASE_URL}/invoices`, {
        headers: { Authorization: `Bearer ${tenant1Token}` }
      });
      const t1Data = await t1Invoices.json();
      const targetInvoiceId = t1Data.invoices[0].id;

      const cancelRes = await fetch(`${BASE_URL}/invoices/${targetInvoiceId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tenant2Token}`
        }
      });
      expect(cancelRes.status).toBe(400);
    });
  });

  // --- 2. SaaS Subscription Architecture & Server-Side Entitlements ---
  describe('SaaS Subscription & Entitlement Enforcement', () => {
    it('initializes Tenant 2 on STARTER_TRIAL with 14-day window and correct limits', async () => {
      const res = await fetch(`${BASE_URL}/subscription`, {
        headers: { Authorization: `Bearer ${tenant2Token}` }
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.subscription.planTier).toBe('STARTER_TRIAL');
      expect(data.subscription.status).toBe('TRIALING');
      expect(data.subscription.entitlements.maxBranches).toBe(1);
      expect(data.subscription.entitlements.maxTerminals).toBe(2);
      expect(data.subscription.usage.branchesCount).toBe(1);
    });

    it('enforces branch creation limit on Starter Trial (limit = 1)', async () => {
      const res = await fetch(`${BASE_URL}/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tenant2Token}`
        },
        body: JSON.stringify({
          name: 'Lotus Mart - Kothrud',
          code: 'LOTUS-02'
        })
      });
      expect(res.status).toBe(500); // Entitlement assertion throws
      const data = await res.json();
      expect(data.message || data.error).toContain('Plan entitlement limit reached for maxBranches');
    });

    it('allows plan upgrade to GROWTH and enforces expanded entitlement', async () => {
      const upgradeRes = await fetch(`${BASE_URL}/subscription/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tenant2Token}`
        },
        body: JSON.stringify({
          planTier: 'GROWTH',
          billingCycle: 'MONTHLY'
        })
      });
      expect(upgradeRes.status).toBe(200);
      const data = await upgradeRes.json();
      expect(data.subscription.planTier).toBe('GROWTH');
      expect(data.subscription.status).toBe('ACTIVE');
      expect(data.subscription.entitlements.maxBranches).toBe(3);

      // Now branch creation should succeed
      const branchRes = await fetch(`${BASE_URL}/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tenant2Token}`
        },
        body: JSON.stringify({
          name: 'Lotus Mart - Kothrud',
          code: 'LOTUS-02'
        })
      });
      expect(branchRes.status).toBe(201);
    });
  });

  // --- 3. Financial Integrity & Audited Corrections ---
  describe('Financial Integrity, Reversals & Audit Logs', () => {
    let createdInvoiceId = '';
    let createdPaymentId = '';

    it('creates product and generates POS invoice for Tenant 2', async () => {
      // 1. Create product
      const pRes = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tenant2Token}`
        },
        body: JSON.stringify({
          sku: 'ORG-HONEY-500G',
          name: 'Pure Organic Forest Honey 500g',
          sellingPrice: 450,
          currentStock: 25,
          unit: 'PCS',
          gstRate: 5
        })
      });
      expect(pRes.status).toBe(201);
      const pData = await pRes.json();
      const prodId = pData.product.id;

      // 2. Checkout sale
      const invRes = await fetch(`${BASE_URL}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tenant2Token}`
        },
        body: JSON.stringify({
          items: [{ productId: prodId, quantity: 2 }],
          payments: [{ mode: 'UPI', amount: 945, referenceNumber: 'UPI/LOTUS/9811223' }],
          customerName: 'Aarti Kulkarni'
        })
      });
      expect(invRes.status).toBe(201);
      const invData = await invRes.json();
      createdInvoiceId = invData.invoice.id;
      createdPaymentId = invData.invoice.payments[0].id;
      expect(invData.invoice.paymentStatus).toBe('PAID');
    });

    it('rejects reversal if audit reason is missing or trivial', async () => {
      const res = await fetch(`${BASE_URL}/payments/${createdPaymentId}/reversal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tenant2Token}`
        },
        body: JSON.stringify({ reason: 'no' })
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('valid audit reason');
    });

    it('executes audited financial reversal and adjusts invoice balance atomically', async () => {
      const res = await fetch(`${BASE_URL}/payments/${createdPaymentId}/reversal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tenant2Token}`
        },
        body: JSON.stringify({ reason: 'Customer UPI transaction chargeback requested' })
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.reversal.status).toBe('REVERSAL');
      expect(Number(data.reversal.amount)).toBe(-945);

      // Verify invoice status reverted to UNPAID
      const checkRes = await fetch(`${BASE_URL}/invoices/${createdInvoiceId}`, {
        headers: { Authorization: `Bearer ${tenant2Token}` }
      });
      const checkData = await checkRes.json();
      expect(checkData.invoice.paymentStatus).toBe('UNPAID');
      expect(Number(checkData.invoice.paidAmount)).toBe(0);
      expect(Number(checkData.invoice.balanceAmount)).toBe(945);
    });

    it('verifies audit trail logs are queryable by Tenant 2 owner', async () => {
      const res = await fetch(`${BASE_URL}/audit-logs`, {
        headers: { Authorization: `Bearer ${tenant2Token}` }
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.logs.length).toBeGreaterThan(0);
      const actions = data.logs.map((l: any) => l.action);
      expect(actions).toContain('PAYMENT_REVERSED');
      expect(actions).toContain('TENANT_ONBOARDED');
    });
  });

  // --- 4. Product Import & Terminal Management ---
  describe('Product Import & Terminal Registration', () => {
    it('registers new POS terminal for Tenant 2', async () => {
      const res = await fetch(`${BASE_URL}/terminals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tenant2Token}`
        },
        body: JSON.stringify({
          terminalCode: 'COUNTER-02',
          deviceName: 'Touch POS Machine Lane 2'
        })
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.terminal.terminalCode).toBe('COUNTER-02');
    });

    it('imports batch products via /products/import', async () => {
      const batch = [
        {
          sku: 'ORG-GHEE-500ML',
          name: 'A2 Cow Ghee Jar 500ml',
          sellingPrice: 850,
          currentStock: 15,
          unit: 'PCS' as const,
          gstRate: 12
        },
        {
          sku: 'ORG-JAGGERY-1KG',
          name: 'Organic Block Jaggery 1kg',
          sellingPrice: 120,
          currentStock: 40,
          unit: 'PCS' as const,
          gstRate: 5
        }
      ];

      const res = await fetch(`${BASE_URL}/products/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tenant2Token}`
        },
        body: JSON.stringify({ products: batch })
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.imported).toBe(2);
      expect(data.errorsCount).toBe(0);
    });
  });
});

