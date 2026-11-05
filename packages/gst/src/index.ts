import { GSTBreakdownItem, InvoiceItem } from '@invodesk/types';

/**
 * Indian State Codes according to GST rules
 */
export const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh'
};

/**
 * Standard Indian GST Rate Slabs (%)
 */
export const STANDARD_GST_RATES = [0, 5, 12, 18, 28] as const;

/**
 * Utility to round off financial numbers to 2 decimal places cleanly
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Validate GSTIN format (15 alphanumeric characters: 2-digit state code + 10-char PAN + 1 entity num + 'Z' + 1 checksum)
 */
export function isValidGSTIN(gstin: string): boolean {
  if (!gstin) return false;
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(gstin.trim().toUpperCase());
}

/**
 * Extract 2-digit state code from GSTIN
 */
export function extractStateCodeFromGSTIN(gstin: string): string | null {
  if (!gstin || gstin.length < 2) return null;
  const code = gstin.substring(0, 2);
  return GST_STATE_CODES[code] ? code : null;
}

/**
 * Determines whether the transaction is Inter-State (IGST) or Intra-State (CGST + SGST)
 * Place of Supply vs Origin State.
 */
export function isInterStateTransaction(supplierStateCode: string, placeOfSupplyStateCode: string): boolean {
  return supplierStateCode.trim() !== placeOfSupplyStateCode.trim();
}

export interface CalculateItemTaxParams {
  quantity: number;
  unitPrice: number; // Excl. tax price or MRP depending on isTaxInclusive
  discountPercent?: number;
  discountAmount?: number;
  gstRate: number; // e.g., 18 for 18%
  cessRate?: number; // e.g., 1 for 1%
  isInterState: boolean;
  isTaxInclusive?: boolean;
}

export interface CalculatedItemTax {
  discountAmount: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  cessAmount: number;
  totalTax: number;
  totalAmount: number;
}

/**
 * Calculates GST components for a single line item
 */
export function calculateItemTax(params: CalculateItemTaxParams): CalculatedItemTax {
  const {
    quantity,
    unitPrice,
    discountPercent = 0,
    gstRate,
    cessRate = 0,
    isInterState,
    isTaxInclusive = false
  } = params;

  let grossAmount = quantity * unitPrice;
  let discountAmount = params.discountAmount ?? 0;
  
  if (discountPercent > 0 && !params.discountAmount) {
    discountAmount = round2((grossAmount * discountPercent) / 100);
  }

  const netGross = Math.max(0, grossAmount - discountAmount);
  let taxableAmount: number;

  if (isTaxInclusive) {
    // Reverse tax calculation from MRP/Inclusive price:
    // Taxable = NetGross / (1 + (gstRate + cessRate) / 100)
    const totalTaxMultiplier = 1 + (gstRate + cessRate) / 100;
    taxableAmount = round2(netGross / totalTaxMultiplier);
  } else {
    // Normal forward calculation
    taxableAmount = round2(netGross);
  }

  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (isInterState) {
    // Inter-State: 100% IGST
    igstRate = gstRate;
    igstAmount = round2((taxableAmount * igstRate) / 100);
  } else {
    // Intra-State: 50% CGST + 50% SGST
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    cgstAmount = round2((taxableAmount * cgstRate) / 100);
    sgstAmount = round2((taxableAmount * sgstRate) / 100);
  }

  const cessAmount = cessRate > 0 ? round2((taxableAmount * cessRate) / 100) : 0;
  const totalTax = round2(cgstAmount + sgstAmount + igstAmount + cessAmount);
  const totalAmount = round2(taxableAmount + totalTax);

  return {
    discountAmount,
    taxableAmount,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    cessAmount,
    totalTax,
    totalAmount
  };
}

/**
 * Aggregates all line items to calculate invoice totals, round off, and GSTR HSN summary
 */
export function calculateInvoiceSummary(items: InvoiceItem[]) {
  let subTotal = 0;
  let totalDiscount = 0;
  let taxableAmount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalCess = 0;

  const hsnMap = new Map<string, GSTBreakdownItem>();

  for (const item of items) {
    subTotal += round2(item.quantity * item.unitPrice);
    totalDiscount += item.discountAmount;
    taxableAmount += item.taxableAmount;
    totalCgst += item.cgstAmount;
    totalSgst += item.sgstAmount;
    totalIgst += item.igstAmount;
    totalCess += item.cessAmount;

    // HSN aggregation for GSTR-1
    const key = `${item.hsnCode || 'NO-HSN'}_${item.gstRate}`;
    const existing = hsnMap.get(key) || {
      hsnCode: item.hsnCode || 'N/A',
      taxableAmount: 0,
      gstRate: item.gstRate,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      cessAmount: 0,
      totalTax: 0
    };

    existing.taxableAmount = round2(existing.taxableAmount + item.taxableAmount);
    existing.cgstAmount = round2(existing.cgstAmount + item.cgstAmount);
    existing.sgstAmount = round2(existing.sgstAmount + item.sgstAmount);
    existing.igstAmount = round2(existing.igstAmount + item.igstAmount);
    existing.cessAmount = round2(existing.cessAmount + item.cessAmount);
    existing.totalTax = round2(
      existing.cgstAmount + existing.sgstAmount + existing.igstAmount + existing.cessAmount
    );

    hsnMap.set(key, existing);
  }

  const totalTax = round2(totalCgst + totalSgst + totalIgst + totalCess);
  const rawTotal = round2(taxableAmount + totalTax);

  // Indian Rupee standard rounding to whole number
  const grandTotal = Math.round(rawTotal);
  const roundOff = round2(grandTotal - rawTotal);

  return {
    subTotal: round2(subTotal),
    totalDiscount: round2(totalDiscount),
    taxableAmount: round2(taxableAmount),
    totalCgst: round2(totalCgst),
    totalSgst: round2(totalSgst),
    totalIgst: round2(totalIgst),
    totalCess: round2(totalCess),
    totalTax,
    roundOff,
    grandTotal,
    hsnSummary: Array.from(hsnMap.values())
  };
}

/**
 * Generate UPI QR Payment string according to NPCI specs
 * e.g., upi://pay?pa=shop@upi&pn=InvoDesk&am=1450.00&tr=INV-2026-001&cu=INR
 */
export function generateUPIPaymentUri(params: {
  vpa: string;
  payeeName: string;
  amount: number;
  transactionRef: string;
  note?: string;
}): string {
  const query = new URLSearchParams({
    pa: params.vpa,
    pn: params.payeeName,
    am: params.amount.toFixed(2),
    tr: params.transactionRef,
    tn: params.note || `Bill ${params.transactionRef}`,
    cu: 'INR'
  });
  return `upi://pay?${query.toString()}`;
}
