import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Force JSON serialization of Prisma Decimal to number so logs & APIs remain seamless
(Prisma.Decimal.prototype as any).toJSON = function () {
  return Number(this.toString());
};

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5433/invodesk?schema=public&connection_limit=25'
    }
  }
});

async function runMigration() {
  console.log('--- STARTING SQLITE TO POSTGRESQL 16+ DATA MIGRATION ---');
  const backupPath = path.resolve(__dirname, '../sqlite-backup.json');
  if (!fs.existsSync(backupPath)) {
    throw new Error(`SQLite backup file not found at ${backupPath}`);
  }

  const raw = fs.readFileSync(backupPath, 'utf8');
  const data = JSON.parse(raw);

  console.log(`Source records identified:`);
  console.log(`- Tenants: ${data.tenants.length}`);
  console.log(`- Branches: ${data.branches.length}`);
  console.log(`- Users: ${data.users.length}`);
  console.log(`- Products: ${data.products.length}`);
  console.log(`- Customers: ${data.customers.length}`);
  console.log(`- Invoices: ${data.invoices.length}`);
  console.log(`- InvoiceItems: ${data.invoiceItems.length}`);
  console.log(`- Payments: ${data.payments.length}`);
  console.log(`- InvoiceSequences: ${data.sequences.length}`);
  console.log(`- StockAdjustments: ${data.stockAdjustments.length}`);
  console.log(`- SyncTransactions: ${data.syncTransactions.length}`);

  // Use a transaction or sequential insertion with disabled foreign keys / ordered hierarchy
  console.log('\n[1/11] Migrating Tenants...');
  for (const t of data.tenants) {
    await prisma.tenant.upsert({
      where: { id: t.id },
      create: { ...t, createdAt: new Date(t.createdAt), updatedAt: new Date(t.updatedAt) },
      update: {}
    });
  }

  console.log('[2/11] Migrating Branches...');
  for (const b of data.branches) {
    await prisma.branch.upsert({
      where: { id: b.id },
      create: { ...b, createdAt: new Date(b.createdAt) },
      update: {}
    });
  }

  console.log('[3/11] Migrating Users...');
  for (const u of data.users) {
    await prisma.user.upsert({
      where: { id: u.id },
      create: { ...u, createdAt: new Date(u.createdAt) },
      update: {}
    });
  }

  console.log('[4/11] Migrating Products (Converting monetary fields to Decimal(12,2))...');
  for (const p of data.products) {
    await prisma.product.upsert({
      where: { id: p.id },
      create: {
        ...p,
        purchasePrice: new Prisma.Decimal(p.purchasePrice.toFixed(2)),
        sellingPrice: new Prisma.Decimal(p.sellingPrice.toFixed(2)),
        mrp: new Prisma.Decimal(p.mrp.toFixed(2)),
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      },
      update: {}
    });
  }

  console.log('[5/11] Migrating Customers (Converting balances to Decimal(12,2))...');
  for (const c of data.customers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      create: {
        ...c,
        creditLimit: new Prisma.Decimal(c.creditLimit.toFixed(2)),
        currentBalance: new Prisma.Decimal(c.currentBalance.toFixed(2)),
        createdAt: new Date(c.createdAt)
      },
      update: {}
    });
  }

  console.log('[6/11] Migrating Invoices (Converting financial totals to Decimal(12,2))...');
  for (const inv of data.invoices) {
    await prisma.invoice.upsert({
      where: { id: inv.id },
      create: {
        ...inv,
        subTotal: new Prisma.Decimal(inv.subTotal.toFixed(2)),
        totalDiscount: new Prisma.Decimal(inv.totalDiscount.toFixed(2)),
        taxableAmount: new Prisma.Decimal(inv.taxableAmount.toFixed(2)),
        totalCgst: new Prisma.Decimal(inv.totalCgst.toFixed(2)),
        totalSgst: new Prisma.Decimal(inv.totalSgst.toFixed(2)),
        totalIgst: new Prisma.Decimal(inv.totalIgst.toFixed(2)),
        totalCess: new Prisma.Decimal(inv.totalCess.toFixed(2)),
        totalTax: new Prisma.Decimal(inv.totalTax.toFixed(2)),
        roundOff: new Prisma.Decimal(inv.roundOff.toFixed(2)),
        grandTotal: new Prisma.Decimal(inv.grandTotal.toFixed(2)),
        paidAmount: new Prisma.Decimal(inv.paidAmount.toFixed(2)),
        balanceAmount: new Prisma.Decimal(inv.balanceAmount.toFixed(2)),
        createdAt: new Date(inv.createdAt),
        updatedAt: new Date(inv.updatedAt)
      },
      update: {}
    });
  }

  console.log('[7/11] Migrating InvoiceItems...');
  for (const item of data.invoiceItems) {
    await prisma.invoiceItem.upsert({
      where: { id: item.id },
      create: {
        ...item,
        unitPrice: new Prisma.Decimal(item.unitPrice.toFixed(2)),
        discountAmount: new Prisma.Decimal(item.discountAmount.toFixed(2)),
        taxableAmount: new Prisma.Decimal(item.taxableAmount.toFixed(2)),
        cgstAmount: new Prisma.Decimal(item.cgstAmount.toFixed(2)),
        sgstAmount: new Prisma.Decimal(item.sgstAmount.toFixed(2)),
        igstAmount: new Prisma.Decimal(item.igstAmount.toFixed(2)),
        cessAmount: new Prisma.Decimal(item.cessAmount.toFixed(2)),
        totalAmount: new Prisma.Decimal(item.totalAmount.toFixed(2))
      },
      update: {}
    });
  }

  console.log('[8/11] Migrating Payments...');
  for (const pay of data.payments) {
    await prisma.payment.upsert({
      where: { id: pay.id },
      create: {
        ...pay,
        amount: new Prisma.Decimal(pay.amount.toFixed(2)),
        paidAt: new Date(pay.paidAt)
      },
      update: {}
    });
  }

  console.log('[9/11] Migrating StockAdjustments...');
  for (const sa of data.stockAdjustments) {
    await prisma.stockAdjustment.upsert({
      where: { id: sa.id },
      create: {
        ...sa,
        createdAt: new Date(sa.createdAt)
      },
      update: {}
    });
  }

  console.log('[10/11] Migrating InvoiceSequences...');
  for (const seq of data.sequences) {
    await prisma.invoiceSequence.upsert({
      where: { id: seq.id },
      create: {
        ...seq
      },
      update: {}
    });
  }

  console.log('[11/11] Migrating SyncTransactions...');
  for (const st of data.syncTransactions) {
    await prisma.syncTransaction.upsert({
      where: { id: st.id },
      create: {
        ...st,
        clientTimestamp: BigInt(st.clientTimestamp),
        serverTimestamp: BigInt(st.serverTimestamp)
      },
      update: {}
    });
  }

  console.log('\n--- VERIFYING POSTGRESQL POST-MIGRATION DATA INTEGRITY ---');
  const [
    pgTenants,
    pgBranches,
    pgUsers,
    pgProducts,
    pgCustomers,
    pgInvoices,
    pgInvoiceItems,
    pgPayments,
    pgSequences,
    pgStockAdjustments,
    pgSyncTransactions
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.branch.count(),
    prisma.user.count(),
    prisma.product.count(),
    prisma.customer.count(),
    prisma.invoice.count(),
    prisma.invoiceItem.count(),
    prisma.payment.count(),
    prisma.invoiceSequence.count(),
    prisma.stockAdjustment.count(),
    prisma.syncTransaction.count()
  ]);

  console.log('Record Count Parity Audit:');
  console.log(`- Tenants:          Source: ${data.tenants.length} | Target: ${pgTenants} -> ${data.tenants.length === pgTenants ? 'PASSED' : 'FAILED'}`);
  console.log(`- Branches:         Source: ${data.branches.length} | Target: ${pgBranches} -> ${data.branches.length === pgBranches ? 'PASSED' : 'FAILED'}`);
  console.log(`- Users:            Source: ${data.users.length} | Target: ${pgUsers} -> ${data.users.length === pgUsers ? 'PASSED' : 'FAILED'}`);
  console.log(`- Products:         Source: ${data.products.length} | Target: ${pgProducts} -> ${data.products.length === pgProducts ? 'PASSED' : 'FAILED'}`);
  console.log(`- Customers:        Source: ${data.customers.length} | Target: ${pgCustomers} -> ${data.customers.length === pgCustomers ? 'PASSED' : 'FAILED'}`);
  console.log(`- Invoices:         Source: ${data.invoices.length} | Target: ${pgInvoices} -> ${data.invoices.length === pgInvoices ? 'PASSED' : 'FAILED'}`);
  console.log(`- InvoiceItems:     Source: ${data.invoiceItems.length} | Target: ${pgInvoiceItems} -> ${data.invoiceItems.length === pgInvoiceItems ? 'PASSED' : 'FAILED'}`);
  console.log(`- Payments:         Source: ${data.payments.length} | Target: ${pgPayments} -> ${data.payments.length === pgPayments ? 'PASSED' : 'FAILED'}`);
  console.log(`- InvoiceSequences: Source: ${data.sequences.length} | Target: ${pgSequences} -> ${data.sequences.length === pgSequences ? 'PASSED' : 'FAILED'}`);
  console.log(`- StockAdjustments: Source: ${data.stockAdjustments.length} | Target: ${pgStockAdjustments} -> ${data.stockAdjustments.length === pgStockAdjustments ? 'PASSED' : 'FAILED'}`);
  console.log(`- SyncTransactions: Source: ${data.syncTransactions.length} | Target: ${pgSyncTransactions} -> ${data.syncTransactions.length === pgSyncTransactions ? 'PASSED' : 'FAILED'}`);

  // Financial Total Integrity Checks
  const sourceInvoiceTotal = data.invoices.reduce((acc: number, inv: any) => acc + inv.grandTotal, 0);
  const pgInvoicesAll = await prisma.invoice.findMany({ select: { grandTotal: true } });
  const pgInvoiceTotal = pgInvoicesAll.reduce((acc: number, inv: any) => acc + Number(inv.grandTotal), 0);

  const sourcePaymentTotal = data.payments.reduce((acc: number, p: any) => acc + p.amount, 0);
  const pgPaymentsAll = await prisma.payment.findMany({ select: { amount: true } });
  const pgPaymentTotal = pgPaymentsAll.reduce((acc: number, p: any) => acc + Number(p.amount), 0);

  console.log('\nFinancial Parity Audit:');
  console.log(`- Total Invoiced: Source: ₹${sourceInvoiceTotal.toFixed(2)} | PostgreSQL: ₹${pgInvoiceTotal.toFixed(2)} -> ${Math.abs(sourceInvoiceTotal - pgInvoiceTotal) < 0.01 ? 'PASSED' : 'FAILED'}`);
  console.log(`- Total Payments: Source: ₹${sourcePaymentTotal.toFixed(2)} | PostgreSQL: ₹${pgPaymentTotal.toFixed(2)} -> ${Math.abs(sourcePaymentTotal - pgPaymentTotal) < 0.01 ? 'PASSED' : 'FAILED'}`);

  console.log('\n--- SQLITE TO POSTGRESQL 16+ MIGRATION COMPLETED SUCCESSFULLY ---');
  await prisma.$disconnect();
}

runMigration().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
