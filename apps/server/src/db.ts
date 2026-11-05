import {
  Branch,
  BusinessTenant,
  Customer,
  Invoice,
  Product,
  StockAdjustment
} from '@invodesk/types';

export const mockTenant: BusinessTenant = {
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

export const mockBranches: Branch[] = [
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

export const mockProducts: Product[] = [
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
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=300&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&q=80',
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
    currentStock: 8, // Low stock demo!
    minStockAlert: 15,
    imageUrl: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&q=80',
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
    currentStock: 4, // Very low stock alert!
    minStockAlert: 12,
    imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&q=80',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockCustomers: Customer[] = [
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
    gstin: '27BBBPS1234B1Z2', // B2B Intra-State (Maharashtra)
    creditLimit: 150000,
    currentBalance: 24500, // Customer owes ₹24,500
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
    gstin: '29ABCDE1234F1Z5', // B2B Inter-State (Karnataka -> IGST test!)
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

export const mockInvoices: Invoice[] = [
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

export const mockStockAdjustments: StockAdjustment[] = [
  {
    id: 'adj_init_1',
    productId: 'prod_4',
    branchId: 'branch_pune_main',
    quantityDelta: -5,
    previousStock: 13,
    newStock: 8,
    reason: 'SALE',
    note: 'POS Terminal Sale #101',
    userId: 'user_cashier_1',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];
