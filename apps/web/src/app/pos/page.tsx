'use client';

import { apiFetch } from '@/apiClient';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar, ActiveTab } from '@/components/Navbar';
import { POSView } from '@/components/POSView';
import { DashboardView } from '@/components/DashboardView';
import { InventoryView } from '@/components/InventoryView';
import { InvoicesView } from '@/components/InvoicesView';
import { CustomersView } from '@/components/CustomersView';
import { GSTR1View } from '@/components/GSTR1View';
import { SyncView } from '@/components/SyncModal';
import { InvoicePrintModal } from '@/components/InvoicePrintModal';
import { SettingsModal } from '@/components/SettingsModal';
import { LoginModal } from '@/components/LoginModal';

import {
  Branch,
  BusinessDashboardStats,
  BusinessTenant,
  Customer,
  GSTR1Summary,
  Invoice,
  PaymentMode,
  Product,
  StockAdjustment,
  SyncRecord
} from '@invodesk/types';
import { calculateInventoryValuation } from '@invodesk/inventory';
import { createSyncRecord } from '@invodesk/sync';

// Default initial offline mock data
const defaultTenant: BusinessTenant = {
  id: 'tenant_1',
  name: 'Apex Retailers & Supermart Pvt Ltd',
  tradeName: 'Apex Supermart',
  gstin: '27AAACA1234A1Z5',
  pan: 'AAACA1234A',
  phone: '+91 98220 12345',
  email: 'accounts@apexretail.in',
  stateCode: '27',
  stateName: 'Maharashtra',
  currency: 'INR',
  address: {
    street: 'Plot 42, Senapati Bapat Marg, Shivaji Nagar',
    city: 'Pune',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '411016',
    country: 'India'
  },
  isCompositionScheme: false,
  termsAndConditions: '1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer terms.\n3. Subject to Pune jurisdiction.',
  createdAt: new Date().toISOString()
};

const defaultBranches: Branch[] = [
  {
    id: 'branch_pune_main',
    tenantId: 'tenant_1',
    name: 'Apex Flagship Store - Pune',
    code: 'PUN-01',
    gstin: '27AAACA1234A1Z5',
    phone: '+91 98220 12345',
    address: {
      street: 'Plot 42, Senapati Bapat Marg, Shivaji Nagar',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '411016',
      country: 'India'
    },
    isMainBranch: true
  },
  {
    id: 'branch_mumbai_exp',
    tenantId: 'tenant_1',
    name: 'Apex Express - Andheri Mumbai',
    code: 'MUM-02',
    gstin: '27AAACA1234A1Z5',
    phone: '+91 98220 99887',
    address: {
      street: 'Unit 14, Lotus Grandeur, Link Road, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '400053',
      country: 'India'
    },
    isMainBranch: false
  },
  {
    id: 'branch_bengaluru_tech',
    tenantId: 'tenant_1',
    name: 'Apex Wholesale Hub - Bengaluru',
    code: 'BLR-03',
    gstin: '29AAACA1234A1Z9',
    phone: '+91 98450 54321',
    address: {
      street: '88, 100 Feet Ring Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      stateCode: '29',
      pincode: '560038',
      country: 'India'
    },
    isMainBranch: false
  }
];

const defaultProducts: Product[] = [
  {
    id: 'prod_1',
    tenantId: 'tenant_1',
    sku: 'ELEC-LOG-M220',
    barcode: '8901030456123',
    name: 'Logitech M220 Silent Wireless Mouse',
    description: '2.4GHz Wireless with Nano USB Receiver, 1000 DPI',
    category: 'Computer Accessories',
    brand: 'Logitech',
    unit: 'PCS',
    hsnCode: '84716060',
    gstRate: 18,
    purchasePrice: 650,
    sellingPrice: 840,
    mrp: 995,
    isTaxInclusive: false,
    currentStock: 48,
    minStockAlert: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_2',
    tenantId: 'tenant_1',
    sku: 'ELEC-SAMS-T7',
    barcode: '8901030789456',
    name: 'Samsung T7 Shield 1TB Portable SSD',
    description: 'USB 3.2 Gen 2 Rugged External NVMe SSD 1050MB/s',
    category: 'Storage Devices',
    brand: 'Samsung',
    unit: 'PCS',
    hsnCode: '84717020',
    gstRate: 18,
    purchasePrice: 7200,
    sellingPrice: 8900,
    mrp: 10999,
    isTaxInclusive: false,
    currentStock: 16,
    minStockAlert: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_3',
    tenantId: 'tenant_1',
    sku: 'FMCG-TATA-TEA',
    barcode: '8901052002345',
    name: 'Tata Tea Gold Premium Blend 500g',
    description: 'Black Tea with Gently Rolled Aromatic Long Leaves',
    category: 'Groceries & Beverages',
    brand: 'Tata Consumer',
    unit: 'PACK',
    hsnCode: '09024020',
    gstRate: 5,
    purchasePrice: 240,
    sellingPrice: 285,
    mrp: 310,
    isTaxInclusive: true,
    currentStock: 120,
    minStockAlert: 25,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_4',
    tenantId: 'tenant_1',
    sku: 'FMCG-AMUL-GHEE',
    barcode: '8901262010041',
    name: 'Amul Pure Cow Ghee Tin 1 Litre',
    description: 'Traditional granular aromatic pure clarified butter',
    category: 'Dairy & Staples',
    brand: 'Amul',
    unit: 'LTR',
    hsnCode: '04059020',
    gstRate: 12,
    purchasePrice: 560,
    sellingPrice: 635,
    mrp: 680,
    isTaxInclusive: true,
    currentStock: 8,
    minStockAlert: 15,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_5',
    tenantId: 'tenant_1',
    sku: 'ELEC-DELL-24MON',
    barcode: '8902055678912',
    name: 'Dell 24" IPS FHD Professional Monitor',
    description: 'Dell P2422H 1080p Height Adjustable Pivot & Tilt',
    category: 'Monitors & Displays',
    brand: 'Dell',
    unit: 'PCS',
    hsnCode: '85285200',
    gstRate: 18,
    purchasePrice: 11200,
    sellingPrice: 13999,
    mrp: 16500,
    isTaxInclusive: false,
    currentStock: 14,
    minStockAlert: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_6',
    tenantId: 'tenant_1',
    sku: 'POS-ROLL-THERMAL',
    barcode: '8903344112233',
    name: 'Thermal Billing Paper Rolls 79mm x 50m (Pack of 10)',
    description: 'High sensitivity BPA-free cash register receipt paper',
    category: 'Stationery & Billing Supplies',
    brand: 'PosMaster',
    unit: 'BOX',
    hsnCode: '48119090',
    gstRate: 12,
    purchasePrice: 380,
    sellingPrice: 520,
    mrp: 650,
    isTaxInclusive: false,
    currentStock: 4,
    minStockAlert: 12,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_7',
    tenantId: 'tenant_1',
    sku: 'ELEC-KEY-MECH',
    barcode: '8904455223344',
    name: 'Keychron K2 Mechanical Keyboard RGB',
    description: '75% Compact Bluetooth Wireless Mechanical with Gateron Brown Switches',
    category: 'Computer Accessories',
    brand: 'Keychron',
    unit: 'PCS',
    hsnCode: '84716040',
    gstRate: 18,
    purchasePrice: 5800,
    sellingPrice: 7499,
    mrp: 8999,
    isTaxInclusive: false,
    currentStock: 22,
    minStockAlert: 6,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_8',
    tenantId: 'tenant_1',
    sku: 'ELEC-APPLE-MM2',
    barcode: '8905566778899',
    name: 'Apple Magic Mouse Wireless Multi-Touch',
    description: 'Bluetooth Rechargeable Multi-Touch Surface Mouse',
    category: 'Computer Accessories',
    brand: 'Apple',
    unit: 'PCS',
    hsnCode: '84716060',
    gstRate: 18,
    purchasePrice: 5900,
    sellingPrice: 6899,
    mrp: 7500,
    isTaxInclusive: false,
    currentStock: 0,
    minStockAlert: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const defaultCustomers: Customer[] = [
  {
    id: 'cust_walkin',
    tenantId: 'tenant_1',
    name: 'Counter Retail Cash Customer',
    phone: '9800000000',
    creditLimit: 0,
    currentBalance: 0,
    billingAddress: {
      street: 'Counter Sale',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '411016',
      country: 'India'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'cust_sharma_ent',
    tenantId: 'tenant_1',
    name: 'Sharma Infotech & Traders',
    phone: '9822187654',
    email: 'accounts@sharmainfotech.com',
    gstin: '27BBBPS1234B1Z2',
    creditLimit: 150000,
    currentBalance: 24500,
    billingAddress: {
      street: 'Suite 204, Trade Centre, F.C. Road',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '411004',
      country: 'India'
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'cust_karnataka_sys',
    tenantId: 'tenant_1',
    name: 'Deccan Cloud Systems LLP',
    phone: '9845112233',
    email: 'finance@deccancloud.in',
    gstin: '29ABCDE1234F1Z5',
    creditLimit: 200000,
    currentBalance: 0,
    billingAddress: {
      street: '4th Cross, Electronic City Phase 1',
      city: 'Bengaluru',
      state: 'Karnataka',
      stateCode: '29',
      pincode: '560100',
      country: 'India'
    },
    createdAt: new Date().toISOString()
  }
];

const defaultInvoices: Invoice[] = [
  {
    id: 'inv_101',
    tenantId: 'tenant_1',
    branchId: 'branch_pune_main',
    invoiceNumber: 'INV/PUN-01/26-27/0001',
    type: 'TAX_INVOICE',
    customerId: 'cust_sharma_ent',
    customerName: 'Sharma Infotech & Traders',
    customerPhone: '9822187654',
    customerGstin: '27BBBPS1234B1Z2',
    customerStateCode: '27',
    placeOfSupplyStateCode: '27',
    isInterState: false,
    items: [
      {
        id: 'item_1',
        productId: 'prod_1',
        name: 'Logitech M220 Silent Wireless Mouse',
        sku: 'ELEC-LOG-M220',
        hsnCode: '84716060',
        unit: 'PCS',
        quantity: 5,
        unitPrice: 840,
        discountPercent: 5,
        discountAmount: 210,
        taxableAmount: 3990,
        gstRate: 18,
        isInterState: false,
        cgstRate: 9,
        cgstAmount: 359.1,
        sgstRate: 9,
        sgstAmount: 359.1,
        igstRate: 0,
        igstAmount: 0,
        cessAmount: 0,
        totalAmount: 4708.2
      },
      {
        id: 'item_2',
        productId: 'prod_2',
        name: 'Samsung T7 Shield 1TB Portable SSD',
        sku: 'ELEC-SAMS-T7',
        hsnCode: '84717020',
        unit: 'PCS',
        quantity: 1,
        unitPrice: 8900,
        discountPercent: 0,
        discountAmount: 0,
        taxableAmount: 8900,
        gstRate: 18,
        isInterState: false,
        cgstRate: 9,
        cgstAmount: 801,
        sgstRate: 9,
        sgstAmount: 801,
        igstRate: 0,
        igstAmount: 0,
        cessAmount: 0,
        totalAmount: 10502
      }
    ],
    subTotal: 13100,
    totalDiscount: 210,
    taxableAmount: 12890,
    totalCgst: 1160.1,
    totalSgst: 1160.1,
    totalIgst: 0,
    totalCess: 0,
    totalTax: 2320.2,
    roundOff: -0.2,
    grandTotal: 15210,
    paymentStatus: 'PAID',
    paidAmount: 15210,
    balanceAmount: 0,
    payments: [
      {
        id: 'pay_1',
        mode: 'UPI',
        amount: 15210,
        referenceNumber: 'UPI/9822/283921820',
        paidAt: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ],
    notes: 'Thank you for your business!',
    isSynced: true,
    syncVersion: 1,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [tenant, setTenant] = useState<BusinessTenant>(defaultTenant);
  const [branches, setBranches] = useState<Branch[]>(defaultBranches);
  const [activeBranch, setActiveBranch] = useState<Branch>(defaultBranches[0]);
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [customers, setCustomers] = useState<Customer[]>(defaultCustomers);
  const [invoices, setInvoices] = useState<Invoice[]>(defaultInvoices);

  // Offline Synchronization State
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingRecords, setPendingRecords] = useState<SyncRecord[]>([]);
  const [syncedHistory, setSyncedHistory] = useState<SyncRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Theme & User Session
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<Invoice | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsSubTab, setSettingsSubTab] = useState<'store' | 'general' | 'hardware' | 'tax' | 'brand'>('store');
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string }>({
    name: 'Rajesh Sharma',
    role: 'STORE_MANAGER'
  });

  // Hydrate theme & custom store profile from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('invodesk_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }

      const savedTenant = localStorage.getItem('invodesk_custom_tenant');
      if (savedTenant) {
        setTenant(JSON.parse(savedTenant));
      }

      const savedBranches = localStorage.getItem('invodesk_custom_branches');
      if (savedBranches) {
        const parsed = JSON.parse(savedBranches);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBranches(parsed);
          setActiveBranch(parsed[0]);
        }
      }
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const handleUpdateTenant = useCallback(async (updated: Partial<BusinessTenant>) => {
    setTenant(prev => {
      const next: BusinessTenant = {
        ...prev,
        ...updated,
        address: {
          ...prev.address,
          ...(updated.address || {})
        }
      };
      try {
        localStorage.setItem('invodesk_custom_tenant', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (isOnline) {
      try {
        await apiFetch('http://localhost:4000/api/tenant', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } catch {}
    }
  }, [isOnline]);

  const handleUpdateStoreName = useCallback((newStoreName: string) => {
    handleUpdateTenant({ tradeName: newStoreName, name: newStoreName });
  }, [handleUpdateTenant]);

  const handleUpdateBranch = useCallback(async (branchId: string, updated: Partial<Branch>) => {
    setBranches(prev => {
      const next = prev.map(b => (b.id === branchId ? { ...b, ...updated } : b));
      try {
        localStorage.setItem('invodesk_custom_branches', JSON.stringify(next));
      } catch {}
      return next;
    });
    setActiveBranch(prev => (prev.id === branchId ? { ...prev, ...updated } : prev));

    if (isOnline) {
      try {
        await fetch(`http://localhost:4000/api/branches/${branchId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } catch {}
    }
  }, [isOnline]);

  const handleAddBranch = useCallback(async (newBranchData: { name: string; code: string; city?: string; phone?: string; gstin?: string }) => {
    const createdBranch: Branch = {
      id: `branch_${Date.now()}`,
      tenantId: tenant.id,
      name: newBranchData.name,
      code: newBranchData.code,
      gstin: newBranchData.gstin || tenant.gstin,
      phone: newBranchData.phone || tenant.phone,
      address: {
        street: tenant.address.street,
        city: newBranchData.city || tenant.address.city,
        state: tenant.address.state,
        stateCode: tenant.address.stateCode,
        pincode: tenant.address.pincode,
        country: 'India'
      },
      isMainBranch: false
    };

    setBranches(prev => {
      const next = [...prev, createdBranch];
      try {
        localStorage.setItem('invodesk_custom_branches', JSON.stringify(next));
      } catch {}
      return next;
    });
    setActiveBranch(createdBranch);

    if (isOnline) {
      try {
        await apiFetch('http://localhost:4000/api/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createdBranch)
        });
      } catch {}
    }
  }, [isOnline, tenant]);

  const handleUpdateInvoicePayment = useCallback((invoiceId: string, mode: PaymentMode, referenceNumber?: string) => {
    const updateInv = (inv: Invoice): Invoice => {
      const paidAmount = mode === 'CREDIT_KHATA' ? 0 : inv.grandTotal;
      const balanceAmount = inv.grandTotal - paidAmount;
      const paymentStatus = balanceAmount === 0 ? 'PAID' : 'UNPAID';
      return {
        ...inv,
        paidAmount,
        balanceAmount,
        paymentStatus,
        payments: [
          {
            id: inv.payments?.[0]?.id || `pay_${Date.now()}`,
            mode,
            amount: paidAmount,
            referenceNumber,
            paidAt: inv.payments?.[0]?.paidAt || new Date().toISOString()
          }
        ]
      };
    };

    setInvoices(prev => prev.map(inv => (inv.id === invoiceId ? updateInv(inv) : inv)));
    setSelectedInvoiceForModal(prev => (prev && prev.id === invoiceId ? updateInv(prev) : prev));
  }, []);

  const handleThemeChange = (nextTheme: 'light' | 'dark') => {
    setTheme(nextTheme);
    try {
      localStorage.setItem('invodesk_theme', nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
    } catch (e) {
      // storage unavailable
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    handleThemeChange(nextTheme);
  };

  // Hydrate persistent offline queue from client storage on mount
  useEffect(() => {
    try {
      const savedQueue = localStorage.getItem('invodesk_pending_sync_queue');
      if (savedQueue) {
        setPendingRecords(JSON.parse(savedQueue));
      }
      const savedHistory = localStorage.getItem('invodesk_synced_history');
      if (savedHistory) {
        setSyncedHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.warn('Could not read offline queue from storage');
    }
  }, []);

  // Persist pending offline queue whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('invodesk_pending_sync_queue', JSON.stringify(pendingRecords));
    } catch (e) {
      console.warn('Could not save offline queue to storage');
    }
  }, [pendingRecords]);

  useEffect(() => {
    try {
      localStorage.setItem('invodesk_synced_history', JSON.stringify(syncedHistory));
    } catch (e) {
      console.warn('Could not save synced history to storage');
    }
  }, [syncedHistory]);

  // Attempt initial sync with Fastify server if available
  useEffect(() => {
    async function loadServerData() {
      try {
        const res = await apiFetch('http://localhost:4000/api/health');
        if (res.ok) {
          const [pRes, cRes, iRes, bRes, tRes] = await Promise.all([
            apiFetch('http://localhost:4000/api/products'),
            apiFetch('http://localhost:4000/api/customers'),
            apiFetch('http://localhost:4000/api/invoices'),
            apiFetch('http://localhost:4000/api/branches'),
            apiFetch('http://localhost:4000/api/tenant')
          ]);

          if (pRes.ok) {
            const data = await pRes.json();
            if (data.products?.length) setProducts(data.products);
          }
          if (iRes.ok) {
            const data = await iRes.json();
            if (data.invoices?.length) setInvoices(data.invoices);
          }
          if (bRes.ok) {
            const data = await bRes.json();
            if (data.branches?.length && !localStorage.getItem('invodesk_custom_branches')) {
              const normalizedBranches = data.branches.map((b: any) => ({
                ...b,
                address: b.address || {
                  street: b.street || '',
                  city: b.city || '',
                  state: b.state || '',
                  stateCode: b.stateCode || '27',
                  pincode: b.pincode || '',
                  country: b.country || 'India'
                }
              }));
              setBranches(normalizedBranches);
              setActiveBranch(normalizedBranches[0]);
            }
          }
          if (cRes.ok) {
            const data = await cRes.json();
            if (data.customers?.length) {
              const normalizedCustomers = data.customers.map((c: any) => ({
                ...c,
                billingAddress: c.billingAddress || {
                  street: c.street || '',
                  city: c.city || '',
                  state: c.state || '',
                  stateCode: c.stateCode || '27',
                  pincode: c.pincode || '',
                  country: c.country || 'India'
                }
              }));
              setCustomers(normalizedCustomers);
            }
          }
          if (tRes.ok) {
            const data = await tRes.json();
            if (data.tenant && !localStorage.getItem('invodesk_custom_tenant')) {
              const normalizedTenant = {
                ...data.tenant,
                address: data.tenant.address || {
                  street: data.tenant.street || '',
                  city: data.tenant.city || '',
                  state: data.tenant.stateName || 'Maharashtra',
                  stateCode: data.tenant.stateCode || '27',
                  pincode: data.tenant.pincode || '',
                  country: data.tenant.country || 'India'
                }
              };
              setTenant(normalizedTenant);
            }
          }
        }
      } catch (e) {
        console.log('Server not reachable, running in offline/local state');
      }
    }
    loadServerData();
  }, []);

  // When a sale is completed in POS Counter
  const handleCompleteSale = useCallback(async (invoice: Invoice) => {
    // 1. Decrement product stock locally immediately
    setProducts(prev => {
      return prev.map(p => {
        const itemInInv = invoice.items.find(it => it.productId === p.id);
        if (itemInInv) {
          return { ...p, currentStock: p.currentStock - itemInInv.quantity };
        }
        return p;
      });
    });

    // 2. Add invoice to local invoices
    setInvoices(prev => [invoice, ...prev]);

    // 3. Update customer khata balance if credit sale
    if (invoice.customerId && invoice.balanceAmount > 0) {
      setCustomers(prev => {
        return prev.map(c => {
          if (c.id === invoice.customerId) {
            return { ...c, currentBalance: c.currentBalance + invoice.balanceAmount };
          }
          return c;
        });
      });
    }

    // 4. Handle Network & Sync
    if (isOnline) {
      try {
        const res = await apiFetch('http://localhost:4000/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            branchId: invoice.branchId,
            customerId: invoice.customerId,
            customerName: invoice.customerName,
            customerPhone: invoice.customerPhone,
            customerGstin: invoice.customerGstin,
            customerStateCode: invoice.customerStateCode,
            items: invoice.items.map(it => ({
              productId: it.productId,
              quantity: it.quantity,
              customUnitPrice: it.unitPrice,
              discountPercent: it.discountPercent
            })),
            payments: invoice.payments.map(p => ({
              mode: p.mode,
              amount: p.amount,
              referenceNumber: p.referenceNumber
            })),
            notes: invoice.notes
          })
        });

        if (res.ok) {
          const syncedRecord = createSyncRecord('INVOICE', 'CREATE', invoice.id, invoice, invoice.branchId, tenant.id);
          syncedRecord.status = 'SYNCED';
          setSyncedHistory(prev => [syncedRecord, ...prev]);
          return;
        }
      } catch (err) {
        console.warn('Network call failed, queueing offline mutation');
      }
    }

    // If offline or network call failed, enqueue to client sync queue
    const offlineRecord = createSyncRecord('INVOICE', 'CREATE', invoice.id, invoice, invoice.branchId, tenant.id);
    setPendingRecords(prev => [...prev, offlineRecord]);
  }, [isOnline, tenant.id]);

  // Adjust stock
  const handleAdjustStock = useCallback(async (productId: string, quantityDelta: number, reason: StockAdjustment['reason'], note?: string) => {
    setProducts(prev => {
      return prev.map(p => {
        if (p.id === productId) {
          return { ...p, currentStock: p.currentStock + quantityDelta };
        }
        return p;
      });
    });

    if (isOnline) {
      try {
        await fetch(`http://localhost:4000/api/products/${productId}/adjust-stock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quantityDelta,
            reason,
            note,
            branchId: activeBranch.id
          })
        });
        return;
      } catch (e) {
        console.warn('Stock adjustment network call failed, queueing');
      }
    }

    const rec = createSyncRecord('STOCK_ADJUSTMENT', 'UPDATE', productId, { quantityDelta, reason, note }, activeBranch.id, tenant.id);
    setPendingRecords(prev => [...prev, rec]);
  }, [isOnline, activeBranch.id, tenant.id]);

  // Add Product
  const handleAddProduct = useCallback(async (newProductData: Partial<Product>) => {
    const createdProduct: Product = {
      id: `prod_${Date.now()}`,
      tenantId: tenant.id,
      sku: newProductData.sku || `SKU-${Date.now()}`,
      barcode: newProductData.barcode,
      name: newProductData.name || 'Untitled Item',
      category: newProductData.category || 'General',
      brand: newProductData.brand,
      unit: newProductData.unit || 'PCS',
      hsnCode: newProductData.hsnCode || '9983',
      gstRate: newProductData.gstRate ?? 18,
      purchasePrice: newProductData.purchasePrice || 0,
      sellingPrice: newProductData.sellingPrice || 0,
      mrp: newProductData.mrp || (newProductData.sellingPrice ? newProductData.sellingPrice * 1.18 : 0),
      isTaxInclusive: newProductData.isTaxInclusive || false,
      currentStock: newProductData.currentStock || 0,
      minStockAlert: newProductData.minStockAlert || 5,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setProducts(prev => [createdProduct, ...prev]);

    if (isOnline) {
      try {
        await apiFetch('http://localhost:4000/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createdProduct)
        });
        return;
      } catch (e) {
        console.warn('Product create network call failed, queueing');
      }
    }

    const rec = createSyncRecord('PRODUCT', 'CREATE', createdProduct.id, createdProduct, activeBranch.id, tenant.id);
    setPendingRecords(prev => [...prev, rec]);
  }, [isOnline, activeBranch.id, tenant.id]);

  // Add Customer
  const handleAddCustomer = useCallback(async (custData: Partial<Customer>) => {
    const createdCust: Customer = {
      id: `cust_${Date.now()}`,
      tenantId: tenant.id,
      name: custData.name || 'New Customer',
      phone: custData.phone || '',
      email: custData.email,
      gstin: custData.gstin,
      creditLimit: custData.creditLimit || 0,
      currentBalance: custData.currentBalance || 0,
      billingAddress: {
        street: (activeBranch as any)?.address?.street || (activeBranch as any)?.street || 'Local',
        city: (activeBranch as any)?.address?.city || (activeBranch as any)?.city || 'Pune',
        state: (activeBranch as any)?.address?.state || (activeBranch as any)?.state || 'Maharashtra',
        stateCode: (activeBranch as any)?.address?.stateCode || (activeBranch as any)?.stateCode || '27',
        pincode: (activeBranch as any)?.address?.pincode || (activeBranch as any)?.pincode || '411001',
        country: (activeBranch as any)?.address?.country || (activeBranch as any)?.country || 'India'
      },
      createdAt: new Date().toISOString()
    };

    setCustomers(prev => [createdCust, ...prev]);

    if (isOnline) {
      try {
        await apiFetch('http://localhost:4000/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createdCust)
        });
        return;
      } catch (e) {
        console.warn('Customer create network call failed, queueing');
      }
    }

    const rec = createSyncRecord('CUSTOMER', 'CREATE', createdCust.id, createdCust, activeBranch.id, tenant.id);
    setPendingRecords(prev => [...prev, rec]);
  }, [isOnline, activeBranch, tenant.id]);

  // Record Khata Payment
  const handleRecordKhataPayment = useCallback(async (customerId: string, amount: number, mode: string = 'CASH') => {
    setCustomers(prev => {
      return prev.map(c => {
        if (c.id === customerId) {
          return { ...c, currentBalance: Math.max(0, c.currentBalance - amount) };
        }
        return c;
      });
    });

    if (isOnline) {
      try {
        await fetch(`http://localhost:4000/api/customers/${customerId}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, mode })
        });
        return;
      } catch (err) {
        console.warn('Payment recording failed, queueing offline');
      }
    }

    const rec = createSyncRecord('PAYMENT', 'CREATE', customerId, { amount, mode }, activeBranch.id, tenant.id);
    setPendingRecords(prev => [...prev, rec]);
  }, [isOnline, activeBranch.id, tenant.id]);

  // Force Synchronize Pending Records to Server
  const handleForceSync = useCallback(async () => {
    if (pendingRecords.length === 0 || !isOnline) return;
    setIsSyncing(true);

    try {
      const res = await apiFetch('http://localhost:4000/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: activeBranch.id,
          records: pendingRecords,
          lastSyncedTimestamp: Date.now()
        })
      });

      if (res.ok) {
        const data = await res.json();
        const syncedIds = new Set(data.syncedIds || []);

        const reconciled = pendingRecords
          .filter(r => syncedIds.has(r.id))
          .map(r => ({ ...r, status: 'SYNCED' as const, serverTimestamp: data.serverTimestamp }));

        setSyncedHistory(prev => [...reconciled, ...prev]);
        setPendingRecords(prev => prev.filter(r => !syncedIds.has(r.id)));
      }
    } catch (e) {
      console.error('Sync failed', e);
    } finally {
      setIsSyncing(false);
    }
  }, [pendingRecords, isOnline, activeBranch.id]);

  // Computed Dashboard Stats
  const dashboardStats: BusinessDashboardStats = useMemo(() => {
    const valuation = calculateInventoryValuation(products);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayInvoices = invoices.filter(i => i.createdAt.startsWith(todayStr));
    const todaySales = todayInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const monthRevenue = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const totalReceivables = customers.reduce((sum, c) => sum + Math.max(0, c.currentBalance), 0);

    const productSaleStats = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const inv of invoices) {
      for (const item of inv.items) {
        const existing = productSaleStats.get(item.productId) || {
          name: item.name,
          quantity: 0,
          revenue: 0
        };
        existing.quantity += item.quantity;
        existing.revenue += item.totalAmount;
        productSaleStats.set(item.productId, existing);
      }
    }

    const topSellingProducts = Array.from(productSaleStats.entries())
      .map(([productId, val]) => ({
        productId,
        name: val.name,
        quantitySold: val.quantity,
        revenue: Math.round(val.revenue)
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      todaySales: Math.round(todaySales),
      todaySalesCount: todayInvoices.length,
      monthRevenue: Math.round(monthRevenue),
      monthRevenueGrowth: 14.8,
      totalReceivables: Math.round(totalReceivables),
      totalPayables: 38200,
      inventoryValuation: valuation.costValuation,
      lowStockItemsCount: valuation.lowStockCount,
      topSellingProducts,
      recentInvoices: invoices.slice(0, 6)
    };
  }, [products, invoices, customers]);

  // Computed GSTR-1 Summary
  const gstr1Summary: GSTR1Summary = useMemo(() => {
    let totalTaxableAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalInvoiceValue = 0;
    let b2bCount = 0;
    let b2csCount = 0;
    let b2clCount = 0;

    const hsnMap = new Map<string, any>();

    for (const inv of invoices) {
      totalTaxableAmount += inv.taxableAmount;
      totalCgst += inv.totalCgst;
      totalSgst += inv.totalSgst;
      totalIgst += inv.totalIgst;
      totalInvoiceValue += inv.grandTotal;

      if (inv.customerGstin && inv.customerGstin.trim().length >= 15) {
        b2bCount++;
      } else if (inv.isInterState && inv.grandTotal > 250000) {
        b2clCount++;
      } else {
        b2csCount++;
      }

      for (const it of inv.items) {
        const key = `${it.hsnCode}_${it.gstRate}`;
        const existing = hsnMap.get(key) || {
          hsnCode: it.hsnCode,
          taxableAmount: 0,
          gstRate: it.gstRate,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          cessAmount: 0,
          totalTax: 0
        };
        existing.taxableAmount += it.taxableAmount;
        existing.cgstAmount += it.cgstAmount;
        existing.sgstAmount += it.sgstAmount;
        existing.igstAmount += it.igstAmount;
        existing.totalTax += it.cgstAmount + it.sgstAmount + it.igstAmount;
        hsnMap.set(key, existing);
      }
    }

    return {
      period: 'OCT-2026',
      totalInvoices: invoices.length,
      totalTaxableAmount: Math.round(totalTaxableAmount * 100) / 100,
      totalCgst: Math.round(totalCgst * 100) / 100,
      totalSgst: Math.round(totalSgst * 100) / 100,
      totalIgst: Math.round(totalIgst * 100) / 100,
      totalTax: Math.round((totalCgst + totalSgst + totalIgst) * 100) / 100,
      totalInvoiceValue: Math.round(totalInvoiceValue * 100) / 100,
      b2bInvoicesCount: b2bCount,
      b2csInvoicesCount: b2csCount,
      b2clInvoicesCount: b2clCount,
      hsnSummary: Array.from(hsnMap.values())
    };
  }, [invoices]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <div className="no-print">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          storeName={tenant.tradeName || tenant.name}
          branches={branches}
          activeBranch={activeBranch}
          setActiveBranch={setActiveBranch}
          isOnline={isOnline}
          setIsOnline={setIsOnline}
          pendingSyncCount={pendingRecords.length}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onOpenSettings={() => {
            setSettingsSubTab('general');
            setIsSettingsOpen(true);
          }}
          onOpenStoreSettings={() => {
            setSettingsSubTab('store');
            setIsSettingsOpen(true);
          }}
          onOpenLogin={() => setIsLoginOpen(true)}
          currentUser={currentUser}
        />
      </div>

      {/* Main View Body */}
      <main className="no-print" style={{ flex: 1, padding: '20px 24px', maxWidth: 1600, width: '100%', margin: '0 auto' }}>
        {activeTab === 'pos' && (
          <POSView
            tenant={tenant}
            activeBranch={activeBranch}
            products={products}
            customers={customers}
            onCompleteSale={handleCompleteSale}
            onOpenInvoiceModal={setSelectedInvoiceForModal}
            onUpdateStoreName={handleUpdateStoreName}
            onOpenStoreSettings={() => {
              setSettingsSubTab('store');
              setIsSettingsOpen(true);
            }}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            stats={dashboardStats}
            products={products}
            invoices={invoices}
            onOpenInvoiceModal={setSelectedInvoiceForModal}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
            onAdjustStock={handleAdjustStock}
            onAddProduct={handleAddProduct}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesView
            invoices={invoices}
            businessName={tenant.tradeName || tenant.name}
            onOpenInvoiceModal={setSelectedInvoiceForModal}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersView
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onRecordPayment={handleRecordKhataPayment}
          />
        )}

        {activeTab === 'gstr1' && (
          <GSTR1View
            report={gstr1Summary}
            tenantGstin={tenant.gstin || '27AAACA1234A1Z5'}
          />
        )}

        {activeTab === 'sync' && (
          <SyncView
            isOnline={isOnline}
            setIsOnline={setIsOnline}
            pendingRecords={pendingRecords}
            syncedHistory={syncedHistory}
            onForceSync={handleForceSync}
            isSyncing={isSyncing}
          />
        )}
      </main>

      {/* Tax Invoice & Thermal Receipt Modal */}
      <InvoicePrintModal
        invoice={selectedInvoiceForModal}
        tenant={tenant}
        activeBranchName={activeBranch?.name}
        onUpdateStoreName={handleUpdateStoreName}
        onUpdateInvoicePayment={handleUpdateInvoicePayment}
        onClose={() => setSelectedInvoiceForModal(null)}
      />

      {/* Brand & Store Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onThemeChange={handleThemeChange}
        tenant={tenant}
        onUpdateTenant={handleUpdateTenant}
        branches={branches}
        activeBranch={activeBranch}
        onUpdateBranch={handleUpdateBranch}
        onAddBranch={handleAddBranch}
        initialSubTab={settingsSubTab}
      />

      {/* Terminal Cashier Switcher / Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(operator) => {
          setCurrentUser({ name: operator.name, role: operator.role });
          setIsLoginOpen(false);
        }}
        isDark={theme === 'dark'}
      />
    </div>
  );
}
