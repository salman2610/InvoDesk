import {
  Invoice,
  InvoiceItem,
  InvoiceType,
  PaymentEntry,
  PaymentMode,
  PaymentStatus,
  Product
} from '@invodesk/types';
import { calculateInvoiceSummary, calculateItemTax, generateUPIPaymentUri } from '@invodesk/gst';

export interface CreateInvoiceDraftParams {
  tenantId: string;
  branchId: string;
  branchCode?: string;
  supplierStateCode: string;
  customerStateCode?: string;
  invoiceType?: InvoiceType;
  invoiceNumber?: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerGstin?: string;
  items: Array<{
    product: Product;
    quantity: number;
    customUnitPrice?: number;
    discountPercent?: number;
  }>;
  payments?: Array<{
    mode: PaymentMode;
    amount: number;
    referenceNumber?: string;
  }>;
  notes?: string;
  vpaForUPI?: string;
}

/**
 * Generate serial invoice numbering according to Indian Financial Year (e.g. INV/26-27/0001)
 */
export function generateInvoiceNumber(prefix = 'INV', branchCode = 'MAIN', sequence = 1, date = new Date()): string {
  const year = date.getFullYear();
  const nextYearShort = (year + 1).toString().slice(-2);
  const currentYearShort = year.toString().slice(-2);
  const seqPadded = sequence.toString().padStart(4, '0');
  return `${prefix}/${branchCode}/${currentYearShort}-${nextYearShort}/${seqPadded}`;
}

/**
 * Create a validated and fully computed invoice instance
 */
export function createInvoice(params: CreateInvoiceDraftParams): Invoice {
  const isInterState = Boolean(
    params.customerStateCode &&
    params.customerStateCode.trim() !== params.supplierStateCode.trim()
  );

  const invoiceItems: InvoiceItem[] = params.items.map((itemInput, idx) => {
    const prod = itemInput.product;
    const unitPrice = itemInput.customUnitPrice ?? prod.sellingPrice;
    const discountPercent = itemInput.discountPercent ?? 0;

    const taxCalc = calculateItemTax({
      quantity: itemInput.quantity,
      unitPrice,
      discountPercent,
      gstRate: prod.gstRate,
      cessRate: prod.cessRate,
      isInterState,
      isTaxInclusive: prod.isTaxInclusive
    });

    return {
      id: `item_${Date.now()}_${idx}`,
      productId: prod.id,
      name: prod.name,
      sku: prod.sku,
      hsnCode: prod.hsnCode,
      unit: prod.unit,
      quantity: itemInput.quantity,
      unitPrice,
      discountPercent,
      discountAmount: taxCalc.discountAmount,
      taxableAmount: taxCalc.taxableAmount,
      gstRate: prod.gstRate,
      isInterState,
      cgstRate: taxCalc.cgstRate,
      cgstAmount: taxCalc.cgstAmount,
      sgstRate: taxCalc.sgstRate,
      sgstAmount: taxCalc.sgstAmount,
      igstRate: taxCalc.igstRate,
      igstAmount: taxCalc.igstAmount,
      cessAmount: taxCalc.cessAmount,
      totalAmount: taxCalc.totalAmount
    };
  });

  const summary = calculateInvoiceSummary(invoiceItems);

  const nowIso = new Date().toISOString();
  const payments: PaymentEntry[] = (params.payments || []).map((p, idx) => ({
    id: `pay_${Date.now()}_${idx}`,
    mode: p.mode,
    amount: p.amount,
    referenceNumber: p.referenceNumber,
    paidAt: nowIso
  }));

  const paidAmount = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const balanceAmount = Math.max(0, summary.grandTotal - paidAmount);

  let paymentStatus: PaymentStatus = 'UNPAID';
  if (paidAmount >= summary.grandTotal) {
    paymentStatus = 'PAID';
  } else if (paidAmount > 0) {
    paymentStatus = 'PARTIAL';
  }

  const invoiceNum = params.invoiceNumber || generateInvoiceNumber('INV', params.branchCode || 'MAIN', 1);

  // Generate dynamic UPI URI if VPA provided
  let qrCodeData: string | undefined;
  if (params.vpaForUPI && balanceAmount > 0) {
    qrCodeData = generateUPIPaymentUri({
      vpa: params.vpaForUPI,
      payeeName: params.customerName || 'Shop Counter',
      amount: balanceAmount,
      transactionRef: invoiceNum,
      note: `Invoice ${invoiceNum}`
    });
  }

  return {
    id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    tenantId: params.tenantId,
    branchId: params.branchId,
    invoiceNumber: invoiceNum,
    type: params.invoiceType || 'TAX_INVOICE',
    customerId: params.customerId,
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    customerGstin: params.customerGstin,
    customerStateCode: params.customerStateCode,
    placeOfSupplyStateCode: params.customerStateCode || params.supplierStateCode,
    isInterState,
    items: invoiceItems,
    subTotal: summary.subTotal,
    totalDiscount: summary.totalDiscount,
    taxableAmount: summary.taxableAmount,
    totalCgst: summary.totalCgst,
    totalSgst: summary.totalSgst,
    totalIgst: summary.totalIgst,
    totalCess: summary.totalCess,
    totalTax: summary.totalTax,
    roundOff: summary.roundOff,
    grandTotal: summary.grandTotal,
    paymentStatus,
    paidAmount,
    balanceAmount,
    payments,
    notes: params.notes,
    qrCodeData,
    isSynced: true,
    syncVersion: 1,
    createdAt: nowIso,
    updatedAt: nowIso
  };
}

/**
 * Format a WhatsApp invoice message template with item summary & direct link
 */
export function buildWhatsAppShareUrl(invoice: Invoice, businessName: string, webInvoiceUrl?: string): string {
  const phone = (invoice.customerPhone || '').replace(/[^0-9]/g, '');
  const lines = [
    `*Invoice from ${businessName}*`,
    `Invoice No: *${invoice.invoiceNumber}*`,
    `Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`,
    `Total Amount: ₹${invoice.grandTotal.toLocaleString('en-IN')}`,
    `Paid: ₹${invoice.paidAmount.toLocaleString('en-IN')}`,
    invoice.balanceAmount > 0 ? `*Pending Balance: ₹${invoice.balanceAmount.toLocaleString('en-IN')}*` : `Status: *PAID (Thank you!)*`,
    ``,
    `Items (${invoice.items.length}):`,
    ...invoice.items.map(it => `• ${it.name} (x${it.quantity} ${it.unit}) - ₹${it.totalAmount}`),
    ``,
    webInvoiceUrl ? `View Invoice online: ${webInvoiceUrl}` : `Thank you for choosing ${businessName}!`
  ];

  const encodedText = encodeURIComponent(lines.join('\n'));
  return `https://api.whatsapp.com/send?phone=${phone ? (phone.startsWith('91') ? phone : `91${phone}`) : ''}&text=${encodedText}`;
}
