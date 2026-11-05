import { describe, it, expect } from 'vitest';
import {
  calculateItemTax,
  isInterStateTransaction,
  isValidGSTIN,
  extractStateCodeFromGSTIN,
  calculateInvoiceSummary,
  generateUPIPaymentUri
} from './index';

describe('GST Calculation Engine', () => {
  it('identifies Intra-state vs Inter-state transaction by State Code', () => {
    // Both Maharashtra (27)
    expect(isInterStateTransaction('27', '27')).toBe(false);
    // Maharashtra (27) to Karnataka (29)
    expect(isInterStateTransaction('27', '29')).toBe(true);
  });

  it('validates 15-digit Indian GSTIN format and extracts state code', () => {
    const validGstin = '27AAACA1234A1Z5';
    expect(isValidGSTIN(validGstin)).toBe(true);
    expect(extractStateCodeFromGSTIN(validGstin)).toBe('27');

    expect(isValidGSTIN('INVALID123')).toBe(false);
    expect(extractStateCodeFromGSTIN('9999')).toBe(null);
  });

  it('calculates Intra-state tax: 50% CGST + 50% SGST', () => {
    const res = calculateItemTax({
      quantity: 2,
      unitPrice: 1000,
      gstRate: 18,
      isInterState: false
    });

    expect(res.taxableAmount).toBe(2000);
    expect(res.cgstRate).toBe(9);
    expect(res.cgstAmount).toBe(180);
    expect(res.sgstRate).toBe(9);
    expect(res.sgstAmount).toBe(180);
    expect(res.igstRate).toBe(0);
    expect(res.igstAmount).toBe(0);
    expect(res.totalTax).toBe(360);
    expect(res.totalAmount).toBe(2360);
  });

  it('calculates Inter-state tax: 100% IGST', () => {
    const res = calculateItemTax({
      quantity: 1,
      unitPrice: 5000,
      gstRate: 18,
      isInterState: true
    });

    expect(res.taxableAmount).toBe(5000);
    expect(res.cgstAmount).toBe(0);
    expect(res.sgstAmount).toBe(0);
    expect(res.igstRate).toBe(18);
    expect(res.igstAmount).toBe(900);
    expect(res.totalTax).toBe(900);
    expect(res.totalAmount).toBe(5900);
  });

  it('calculates tax-inclusive backwards from MRP properly', () => {
    // Item priced at ₹118 inclusive of 18% GST -> Taxable must be ₹100, Tax ₹18
    const res = calculateItemTax({
      quantity: 1,
      unitPrice: 118,
      gstRate: 18,
      isInterState: false,
      isTaxInclusive: true
    });

    expect(res.taxableAmount).toBe(100);
    expect(res.totalTax).toBe(18);
    expect(res.totalAmount).toBe(118);
  });

  it('generates valid NPCI compliant UPI payment URI', () => {
    const uri = generateUPIPaymentUri({
      vpa: 'shop@okaxis',
      payeeName: 'InvoDesk Store',
      amount: 1450.5,
      transactionRef: 'INV-101'
    });

    expect(uri).toContain('upi://pay?');
    expect(uri).toContain('pa=shop%40okaxis');
    expect(uri).toContain('am=1450.50');
    expect(uri).toContain('tr=INV-101');
    expect(uri).toContain('cu=INR');
  });
});
