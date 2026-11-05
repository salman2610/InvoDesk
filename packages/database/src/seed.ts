import { prisma } from './index';

async function seed() {
  console.log('🌱 Starting InvoDesk Database Seeding...');

  // 1. Create Tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'tenant_1' },
    update: {},
    create: {
      id: 'tenant_1',
      name: 'Apex Retailers & Supermart Pvt Ltd',
      tradeName: 'Apex Supermart',
      gstin: '27AAACA1234A1Z5',
      pan: 'AAACA1234A',
      phone: '+91 98220 12345',
      email: 'accounts@apexretail.in',
      currency: 'INR',
      stateCode: '27',
      stateName: 'Maharashtra',
      street: 'Plot 42, Senapati Bapat Marg, Shivaji Nagar',
      city: 'Pune',
      pincode: '411016',
      country: 'India',
      isCompositionScheme: false,
      termsAndConditions: '1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer terms.\n3. Subject to Pune jurisdiction.'
    }
  });

  // 2. Branches
  const branchPune = await prisma.branch.upsert({
    where: { id: 'branch_pune_main' },
    update: {},
    create: {
      id: 'branch_pune_main',
      tenantId: tenant.id,
      name: 'Apex Flagship Store - Pune',
      code: 'PUN-01',
      gstin: '27AAACA1234A1Z5',
      phone: '+91 98220 12345',
      street: 'Plot 42, Senapati Bapat Marg, Shivaji Nagar',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '411016',
      country: 'India',
      isMainBranch: true
    }
  });

  await prisma.branch.upsert({
    where: { id: 'branch_mumbai_exp' },
    update: {},
    create: {
      id: 'branch_mumbai_exp',
      tenantId: tenant.id,
      name: 'Apex Express - Andheri Mumbai',
      code: 'MUM-02',
      gstin: '27AAACA1234A1Z5',
      phone: '+91 98220 99887',
      street: 'Unit 14, Lotus Grandeur, Link Road, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '400053',
      country: 'India',
      isMainBranch: false
    }
  });

  await prisma.branch.upsert({
    where: { id: 'branch_bengaluru_tech' },
    update: {},
    create: {
      id: 'branch_bengaluru_tech',
      tenantId: tenant.id,
      name: 'Apex Wholesale Hub - Bengaluru',
      code: 'BLR-03',
      gstin: '29AAACA1234A1Z9',
      phone: '+91 98450 54321',
      street: '88, 100 Feet Ring Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      stateCode: '29',
      pincode: '560038',
      country: 'India',
      isMainBranch: false
    }
  });

  // 2.5 Seed Users
  await prisma.user.upsert({
    where: { email: 'owner@apexretail.in' },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Vikram Joshi (Owner)',
      email: 'owner@apexretail.in',
      phone: '9822012345',
      passwordHash: 'admin123',
      role: 'OWNER'
    }
  });

  await prisma.user.upsert({
    where: { email: 'manager@apexretail.in' },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Pooja Kulkarni (Store Manager)',
      email: 'manager@apexretail.in',
      phone: '9822099887',
      passwordHash: 'manager123',
      role: 'MANAGER'
    }
  });

  await prisma.user.upsert({
    where: { email: 'cashier@apexretail.in' },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Rohan Patil (Cashier)',
      email: 'cashier@apexretail.in',
      phone: '9822055443',
      passwordHash: 'cashier123',
      role: 'CASHIER'
    }
  });

  // 3. Products
  const products = [
    {
      id: 'prod_1',
      tenantId: tenant.id,
      sku: 'ELEC-LOG-M220',
      barcode: '8901030456123',
      name: 'Logitech M220 Silent Wireless Mouse',
      description: '2.4GHz Wireless with Nano USB Receiver, 1000 DPI',
      category: 'Computer Accessories',
      brand: 'Logitech',
      unit: 'PCS',
      hsnCode: '84716060',
      gstRate: 18.0,
      purchasePrice: 650.0,
      sellingPrice: 840.0,
      mrp: 995.0,
      isTaxInclusive: false,
      currentStock: 48,
      minStockAlert: 10
    },
    {
      id: 'prod_2',
      tenantId: tenant.id,
      sku: 'ELEC-SAMS-T7',
      barcode: '8901030789456',
      name: 'Samsung T7 Shield 1TB Portable SSD',
      description: 'USB 3.2 Gen 2 Rugged External NVMe SSD 1050MB/s',
      category: 'Storage Devices',
      brand: 'Samsung',
      unit: 'PCS',
      hsnCode: '84717020',
      gstRate: 18.0,
      purchasePrice: 7200.0,
      sellingPrice: 8900.0,
      mrp: 10999.0,
      isTaxInclusive: false,
      currentStock: 16,
      minStockAlert: 5
    },
    {
      id: 'prod_3',
      tenantId: tenant.id,
      sku: 'FMCG-TATA-TEA',
      barcode: '8901052002345',
      name: 'Tata Tea Gold Premium Blend 500g',
      description: 'Black Tea with Gently Rolled Aromatic Long Leaves',
      category: 'Groceries & Beverages',
      brand: 'Tata Consumer',
      unit: 'PACK',
      hsnCode: '09024020',
      gstRate: 5.0,
      purchasePrice: 240.0,
      sellingPrice: 285.0,
      mrp: 310.0,
      isTaxInclusive: true,
      currentStock: 120,
      minStockAlert: 25
    },
    {
      id: 'prod_4',
      tenantId: tenant.id,
      sku: 'FMCG-AMUL-GHEE',
      barcode: '8901262010041',
      name: 'Amul Pure Cow Ghee Tin 1 Litre',
      description: 'Traditional granular aromatic pure clarified butter',
      category: 'Dairy & Staples',
      brand: 'Amul',
      unit: 'LTR',
      hsnCode: '04059020',
      gstRate: 12.0,
      purchasePrice: 560.0,
      sellingPrice: 635.0,
      mrp: 680.0,
      isTaxInclusive: true,
      currentStock: 8,
      minStockAlert: 15
    },
    {
      id: 'prod_5',
      tenantId: tenant.id,
      sku: 'ELEC-DELL-24MON',
      barcode: '8902055678912',
      name: 'Dell 24" IPS FHD Professional Monitor',
      description: 'Dell P2422H 1080p Height Adjustable Pivot & Tilt',
      category: 'Monitors & Displays',
      brand: 'Dell',
      unit: 'PCS',
      hsnCode: '85285200',
      gstRate: 18.0,
      purchasePrice: 11200.0,
      sellingPrice: 13999.0,
      mrp: 16500.0,
      isTaxInclusive: false,
      currentStock: 14,
      minStockAlert: 4
    },
    {
      id: 'prod_6',
      tenantId: tenant.id,
      sku: 'POS-ROLL-THERMAL',
      barcode: '8903344112233',
      name: 'Thermal Billing Paper Rolls 79mm x 50m (Pack of 10)',
      description: 'High sensitivity BPA-free cash register receipt paper',
      category: 'Stationery & Billing Supplies',
      brand: 'PosMaster',
      unit: 'BOX',
      hsnCode: '48119090',
      gstRate: 12.0,
      purchasePrice: 380.0,
      sellingPrice: 520.0,
      mrp: 650.0,
      isTaxInclusive: false,
      currentStock: 4,
      minStockAlert: 12
    },
    {
      id: 'prod_7',
      tenantId: tenant.id,
      sku: 'ELEC-KEY-MECH',
      barcode: '8904455223344',
      name: 'Keychron K2 Mechanical Keyboard RGB',
      description: '75% Compact Bluetooth Wireless Mechanical with Gateron Brown Switches',
      category: 'Computer Accessories',
      brand: 'Keychron',
      unit: 'PCS',
      hsnCode: '84716040',
      gstRate: 18.0,
      purchasePrice: 5800.0,
      sellingPrice: 7499.0,
      mrp: 8999.0,
      isTaxInclusive: false,
      currentStock: 22,
      minStockAlert: 6
    }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: {
        tenantId_sku: {
          tenantId: tenant.id,
          sku: p.sku
        }
      },
      update: {},
      create: p
    });
  }

  // 4. Customers
  await prisma.customer.upsert({
    where: { id: 'cust_walkin' },
    update: {},
    create: {
      id: 'cust_walkin',
      tenantId: tenant.id,
      name: 'Counter Retail Cash Customer',
      phone: '9800000000',
      creditLimit: 0,
      currentBalance: 0,
      street: 'Counter Sale',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '411016',
      country: 'India'
    }
  });

  await prisma.customer.upsert({
    where: { id: 'cust_sharma_ent' },
    update: {},
    create: {
      id: 'cust_sharma_ent',
      tenantId: tenant.id,
      name: 'Sharma Infotech & Traders',
      phone: '9822187654',
      email: 'accounts@sharmainfotech.com',
      gstin: '27BBBPS1234B1Z2',
      creditLimit: 150000,
      currentBalance: 24500,
      street: 'Suite 204, Trade Centre, F.C. Road',
      city: 'Pune',
      state: 'Maharashtra',
      stateCode: '27',
      pincode: '411004',
      country: 'India'
    }
  });

  await prisma.customer.upsert({
    where: { id: 'cust_karnataka_sys' },
    update: {},
    create: {
      id: 'cust_karnataka_sys',
      tenantId: tenant.id,
      name: 'Deccan Cloud Systems LLP',
      phone: '9845112233',
      email: 'finance@deccancloud.in',
      gstin: '29ABCDE1234F1Z5',
      creditLimit: 200000,
      currentBalance: 0,
      street: '4th Cross, Electronic City Phase 1',
      city: 'Bengaluru',
      state: 'Karnataka',
      stateCode: '29',
      pincode: '560100',
      country: 'India'
    }
  });

  // 5. Initial Invoice Sequence
  await prisma.invoiceSequence.upsert({
    where: {
      tenantId_branchId_financialYear: {
        tenantId: tenant.id,
        branchId: branchPune.id,
        financialYear: '26-27'
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      branchId: branchPune.id,
      financialYear: '26-27',
      lastSequence: 1
    }
  });

  // 6. Initial Seed Invoice
  const existingInv = await prisma.invoice.findUnique({
    where: {
      tenantId_invoiceNumber: {
        tenantId: tenant.id,
        invoiceNumber: 'INV/PUN-01/26-27/0001'
      }
    }
  });

  if (!existingInv) {
    await prisma.invoice.create({
      data: {
        id: 'inv_101',
        tenantId: tenant.id,
        branchId: branchPune.id,
        invoiceNumber: 'INV/PUN-01/26-27/0001',
        sequenceNumber: 1,
        type: 'TAX_INVOICE',
        customerId: 'cust_sharma_ent',
        customerName: 'Sharma Infotech & Traders',
        customerPhone: '9822187654',
        customerGstin: '27BBBPS1234B1Z2',
        customerStateCode: '27',
        placeOfSupplyStateCode: '27',
        isInterState: false,
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
        notes: 'Thank you for your business!',
        isSynced: true,
        items: {
          create: [
            {
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
          ]
        },
        payments: {
          create: [
            {
              mode: 'UPI',
              amount: 15210,
              referenceNumber: 'UPI/9822/283921820'
            }
          ]
        }
      }
    });
  }

  console.log('✅ InvoDesk Database Seeded Successfully!');
}

seed()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
